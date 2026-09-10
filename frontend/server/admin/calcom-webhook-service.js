import crypto from 'node:crypto';
import { isValidUuid } from './admin-conversations-service.js';
import { transitionLeadPipelineStage } from '../pipeline/pipeline-service.js';

/**
 * Valida a assinatura HMAC SHA-256 de um webhook do Cal.com.
 *
 * @param {string} rawBodyStr
 * @param {string} signatureHeader
 * @param {string} secretStr
 * @returns {boolean}
 */
export function verifyCalComWebhookSignature(rawBodyStr, signatureHeader, secretStr) {
  if (!secretStr) {
    // Se nenhum segredo estiver configurado em ambiente dev local, ignorar validação de assinatura
    return true;
  }
  if (!signatureHeader || typeof signatureHeader !== 'string') {
    return false;
  }

  try {
    const computedHmac = crypto
      .createHmac('sha256', secretStr)
      .update(rawBodyStr || '')
      .digest('hex');

    let expectedSig = signatureHeader.trim();

    // Suportar formatos comuns de cabeçalhos (ex.: 'sha256=HEX', 'v1=HEX', 't=...,v1=HEX' ou 'HEX')
    if (expectedSig.includes('v1=')) {
      const match = expectedSig.match(/v1=([a-f0-9]+)/i);
      if (match) expectedSig = match[1];
    } else if (expectedSig.startsWith('sha256=')) {
      expectedSig = expectedSig.replace('sha256=', '');
    }

    const computedBuffer = Buffer.from(computedHmac, 'hex');
    const expectedBuffer = Buffer.from(expectedSig, 'hex');

    if (computedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(computedBuffer, expectedBuffer);
  } catch (err) {
    return false;
  }
}

/**
 * Normaliza e extrai as informações principais do payload do Cal.com.
 *
 * @param {object} payloadBody
 * @returns {object}
 */
export function extractCalComBookingInformation(payloadBody) {
  if (!payloadBody || typeof payloadBody !== 'object') {
    return null;
  }

  const triggerEvent = (payloadBody.triggerEvent || payloadBody.event || '').toString();
  let normalizedEvent = 'UNKNOWN';

  if (triggerEvent.includes('BOOKING_CREATED') || triggerEvent.includes('booking.created')) {
    normalizedEvent = 'BOOKING_CREATED';
  } else if (triggerEvent.includes('BOOKING_RESCHEDULED') || triggerEvent.includes('booking.rescheduled')) {
    normalizedEvent = 'BOOKING_RESCHEDULED';
  } else if (triggerEvent.includes('BOOKING_CANCELLED') || triggerEvent.includes('booking.cancelled')) {
    normalizedEvent = 'BOOKING_CANCELLED';
  }

  const payload = payloadBody.payload || payloadBody;
  const externalBookingId = String(payload.uid || payload.bookingId || payload.id || '').trim();

  if (!externalBookingId) {
    return null;
  }

  const startTime = payload.startTime || payload.start_time || null;
  const endTime = payload.endTime || payload.end_time || null;
  const timezone = payload.timeZone || payload.timezone || payload.organizer?.timeZone || null;

  const attendeeName = payload.attendees?.[0]?.name || payload.organizer?.name || payload.name || null;
  const attendeeEmail = payload.attendees?.[0]?.email || payload.organizer?.email || payload.email || null;

  const metadata = payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {};
  const responses = payload.responses && typeof payload.responses === 'object' ? payload.responses : {};
  const userFields = payload.userFields && typeof payload.userFields === 'object' ? payload.userFields : {};

  let rawConvId =
    metadata.conversation_id ||
    metadata.conversationId ||
    metadata['metadata[conversation_id]'] ||
    responses.conversation_id ||
    responses.conversationId ||
    responses['metadata[conversation_id]'] ||
    userFields.conversation_id ||
    userFields.conversationId ||
    userFields['metadata[conversation_id]'] ||
    null;

  let rawLeadId =
    metadata.lead_id ||
    metadata.leadId ||
    metadata['metadata[lead_id]'] ||
    responses.lead_id ||
    responses.leadId ||
    responses['metadata[lead_id]'] ||
    userFields.lead_id ||
    userFields.leadId ||
    userFields['metadata[lead_id]'] ||
    null;

  const conversation_id = isValidUuid(rawConvId) ? rawConvId : null;
  const lead_id = isValidUuid(rawLeadId) ? rawLeadId : null;

  const rawPrevUid =
    payload.rescheduleUid ||
    payload.rescheduledFromUid ||
    payload.rescheduledFrom?.uid ||
    payload.previousBooking?.uid ||
    payload.previousBookingId ||
    payload.rescheduleId ||
    null;

  const previousExternalBookingId =
    rawPrevUid !== null && rawPrevUid !== undefined && String(rawPrevUid).trim() !== ''
      ? String(rawPrevUid).trim()
      : null;

  return {
    triggerEvent: normalizedEvent,
    rawTriggerEvent: triggerEvent,
    externalBookingId,
    previousExternalBookingId,
    startTime,
    endTime,
    timezone,
    attendeeName,
    attendeeEmail,
    conversation_id,
    lead_id,
    rawPayload: payloadBody,
  };
}

/**
 * Processa um evento do Webhook Cal.com na base de dados (READ/WRITE server-side com service_role).
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {object} bookingInfo
 * @returns {Promise<{ ok: boolean, action: string, bookingId?: string }>}
 */
export async function processCalComWebhookEvent(supabaseClient, bookingInfo) {
  if (!bookingInfo || !bookingInfo.externalBookingId) {
    const err = new Error('Payload do webhook inválido ou sem identificador de booking');
    err.statusCode = 400;
    throw err;
  }

  const {
    triggerEvent,
    externalBookingId,
    previousExternalBookingId,
    startTime,
    endTime,
    timezone,
    attendeeName,
    attendeeEmail,
    conversation_id,
    lead_id,
    rawPayload,
  } = bookingInfo;

  let effectiveConvId = conversation_id;
  let effectiveLeadId = lead_id;

  // 1. Reconciliação e validação de conversa ↔ lead
  if (effectiveConvId) {
    const { data: convRecord } = await supabaseClient
      .from('conversations')
      .select('id, lead_id')
      .eq('id', effectiveConvId)
      .maybeSingle();

    if (!convRecord) {
      effectiveConvId = null;
    } else if (convRecord.lead_id) {
      effectiveLeadId = convRecord.lead_id;
    }
  }

  if (!effectiveConvId && effectiveLeadId) {
    const { data: latestConv } = await supabaseClient
      .from('conversations')
      .select('id')
      .eq('lead_id', effectiveLeadId)
      .order('last_activity_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestConv) {
      effectiveConvId = latestConv.id;
    }
  }

  // 2. Processamento por tipo de evento
  if (triggerEvent === 'BOOKING_CREATED') {
    const { data: bookingRecord, error: bookingErr } = await supabaseClient
      .from('calendar_bookings')
      .upsert(
        {
          provider: 'calcom',
          external_booking_id: externalBookingId,
          conversation_id: effectiveConvId,
          lead_id: effectiveLeadId,
          status: 'confirmed',
          start_time: startTime,
          end_time: endTime,
          timezone,
          attendee_name: attendeeName,
          attendee_email: attendeeEmail,
          provider_metadata: rawPayload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'provider,external_booking_id' }
      )
      .select('id')
      .single();

    if (bookingErr) {
      throw new Error(`Erro ao guardar agendamento em calendar_bookings: ${bookingErr.message}`);
    }

    if (effectiveConvId) {
      const nowIso = new Date().toISOString();
      const { error: convUpdateErr } = await supabaseClient
        .from('conversations')
        .update({
          status: 'completed',
          closed_at: nowIso,
          primary_outcome: 'meeting_booked',
          commercial_stage: 'closed',
        })
        .eq('id', effectiveConvId);

      if (convUpdateErr) {
        console.error('Erro ao atualizar conversa em BOOKING_CREATED:', convUpdateErr);
      }
    }

    if (effectiveLeadId) {
      await supabaseClient
        .from('leads')
        .update({
          next_step: 'schedule_meeting',
          updated_at: new Date().toISOString(),
        })
        .eq('id', effectiveLeadId);

      // Automação Pipeline CRM (Fase 3A)
      try {
        const { data: leadRec } = await supabaseClient
          .from('leads')
          .select('pipeline_stage')
          .eq('id', effectiveLeadId)
          .single();

        if (leadRec && ['new', 'qualified', 'meeting_scheduled'].includes(leadRec.pipeline_stage)) {
          await transitionLeadPipelineStage({
            supabase: supabaseClient,
            leadId: effectiveLeadId,
            toStage: 'meeting_scheduled',
            source: 'calendar_webhook',
            changedBy: null,
            allowedFromStages: ['new', 'qualified', 'meeting_scheduled'],
          });
        }
      } catch (pipelineErr) {
        console.error('Erro ao atualizar pipeline_stage no BOOKING_CREATED:', pipelineErr.message);
      }
    }

    return {
      ok: true,
      action: 'booking_created',
      bookingId: bookingRecord?.id,
    };
  }

  if (triggerEvent === 'BOOKING_RESCHEDULED') {
    let existingRow = null;

    if (previousExternalBookingId) {
      const { data: prevRecord } = await supabaseClient
        .from('calendar_bookings')
        .select('*')
        .eq('provider', 'calcom')
        .eq('external_booking_id', previousExternalBookingId)
        .maybeSingle();

      if (prevRecord) {
        existingRow = prevRecord;
      }
    }

    if (!existingRow) {
      const { data: currentRecord } = await supabaseClient
        .from('calendar_bookings')
        .select('*')
        .eq('provider', 'calcom')
        .eq('external_booking_id', externalBookingId)
        .maybeSingle();

      if (currentRecord) {
        existingRow = currentRecord;
      }
    }

    let bookingRecordId = null;

    if (existingRow) {
      const finalConvId = effectiveConvId || existingRow.conversation_id || null;
      const finalLeadId = effectiveLeadId || existingRow.lead_id || null;
      const finalAttendeeName = attendeeName || existingRow.attendee_name || null;
      const finalAttendeeEmail = attendeeEmail || existingRow.attendee_email || null;

      const { data: updatedRecord, error: updateErr } = await supabaseClient
        .from('calendar_bookings')
        .update({
          external_booking_id: externalBookingId,
          conversation_id: finalConvId,
          lead_id: finalLeadId,
          status: 'rescheduled',
          start_time: startTime || existingRow.start_time,
          end_time: endTime || existingRow.end_time,
          timezone: timezone || existingRow.timezone,
          attendee_name: finalAttendeeName,
          attendee_email: finalAttendeeEmail,
          provider_metadata: rawPayload,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingRow.id)
        .select('id')
        .single();

      if (updateErr) {
        throw new Error(`Erro ao atualizar agendamento reagendado em calendar_bookings: ${updateErr.message}`);
      }

      bookingRecordId = updatedRecord?.id || existingRow.id;
      if (finalConvId) effectiveConvId = finalConvId;
      if (finalLeadId) effectiveLeadId = finalLeadId;
    } else {
      const { data: upsertRecord, error: upsertErr } = await supabaseClient
        .from('calendar_bookings')
        .upsert(
          {
            provider: 'calcom',
            external_booking_id: externalBookingId,
            conversation_id: effectiveConvId,
            lead_id: effectiveLeadId,
            status: 'rescheduled',
            start_time: startTime,
            end_time: endTime,
            timezone,
            attendee_name: attendeeName,
            attendee_email: attendeeEmail,
            provider_metadata: rawPayload,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'provider,external_booking_id' }
        )
        .select('id')
        .single();

      if (upsertErr) {
        throw new Error(`Erro no fallback de agendamento reagendado em calendar_bookings: ${upsertErr.message}`);
      }

      bookingRecordId = upsertRecord?.id;
    }

    if (effectiveConvId) {
      const nowIso = new Date().toISOString();
      const { error: convUpdateErr } = await supabaseClient
        .from('conversations')
        .update({
          status: 'completed',
          closed_at: nowIso,
          primary_outcome: 'meeting_booked',
          commercial_stage: 'closed',
        })
        .eq('id', effectiveConvId);

      if (convUpdateErr) {
        console.error('Erro ao atualizar conversa em BOOKING_RESCHEDULED:', convUpdateErr);
      }
    }

    if (effectiveLeadId) {
      await supabaseClient
        .from('leads')
        .update({
          next_step: 'schedule_meeting',
          updated_at: new Date().toISOString(),
        })
        .eq('id', effectiveLeadId);

      // Automação Pipeline CRM (Fase 3A)
      try {
        const { data: leadRec } = await supabaseClient
          .from('leads')
          .select('pipeline_stage')
          .eq('id', effectiveLeadId)
          .single();

        if (leadRec && ['new', 'qualified', 'meeting_scheduled'].includes(leadRec.pipeline_stage)) {
          await transitionLeadPipelineStage({
            supabase: supabaseClient,
            leadId: effectiveLeadId,
            toStage: 'meeting_scheduled',
            source: 'calendar_webhook',
            changedBy: null,
            allowedFromStages: ['new', 'qualified', 'meeting_scheduled'],
          });
        }
      } catch (pipelineErr) {
        console.error('Erro ao atualizar pipeline_stage no BOOKING_RESCHEDULED:', pipelineErr.message);
      }
    }

    return {
      ok: true,
      action: 'booking_rescheduled',
      bookingId: bookingRecordId,
    };
  }

  if (triggerEvent === 'BOOKING_CANCELLED') {
    const { data: bookingRecord, error: bookingErr } = await supabaseClient
      .from('calendar_bookings')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('provider', 'calcom')
      .eq('external_booking_id', externalBookingId)
      .select('id, conversation_id, lead_id')
      .maybeSingle();

    if (bookingErr) {
      throw new Error(`Erro ao cancelar agendamento em calendar_bookings: ${bookingErr.message}`);
    }

    const targetConvId = effectiveConvId || bookingRecord?.conversation_id;
    const targetLeadId = effectiveLeadId || bookingRecord?.lead_id;

    // Preservar a conversa comercial intacta (sem alterar commercial_stage nem primary_outcome)
    // para não violar as restrições da base de dados (chk_conversations_lifecycle) e manter a sessão concluída.

    // Automação Pipeline CRM no Cancelamento (Fase 3A)
    if (targetLeadId) {
      try {
        const { data: leadRec } = await supabaseClient
          .from('leads')
          .select('pipeline_stage, lead_classification')
          .eq('id', targetLeadId)
          .single();

        if (leadRec && leadRec.pipeline_stage === 'meeting_scheduled') {
          // Verificar se existe OUTRA booking ativa para este lead
          const { data: remainingLeadBookings } = await supabaseClient
            .from('calendar_bookings')
            .select('id')
            .eq('lead_id', targetLeadId)
            .in('status', ['confirmed', 'rescheduled'])
            .neq('external_booking_id', externalBookingId);

          const hasOtherActiveBooking = remainingLeadBookings && remainingLeadBookings.length > 0;

          if (!hasOtherActiveBooking) {
            const fallbackStage = ['priority', 'qualified'].includes(leadRec.lead_classification)
              ? 'qualified'
              : 'new';

            await transitionLeadPipelineStage({
              supabase: supabaseClient,
              leadId: targetLeadId,
              toStage: fallbackStage,
              source: 'calendar_webhook',
              changedBy: null,
              allowedFromStages: ['meeting_scheduled'],
            });
          }
        }
      } catch (pipelineErr) {
        console.error('Erro ao atualizar pipeline_stage no BOOKING_CANCELLED:', pipelineErr.message);
      }
    }

    return {
      ok: true,
      action: 'booking_cancelled',
      bookingId: bookingRecord?.id,
    };
  }

  return {
    ok: true,
    action: 'ignored_unsupported_event',
  };
}
