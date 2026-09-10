import crypto from 'crypto';
import { evaluateFollowUp } from './admin-followup-engine.js';
import { buildFollowUpContextFingerprint, bulkGetEffectiveFollowUpStates } from './admin-followup-state-service.js';
import { getLeadCadenceReadModel } from './admin-followup-cadence-service.js';
import { sendEmailWithResendProvider } from '../email/resend-email-provider-adapter.js';
import { sendEmailWithFakeProvider } from '../email/fake-email-provider-adapter.js';

/**
 * FASE 7F.1 / 7F.1.1 / 7I.1 — FOLLOW-UP DISPATCH SERVICE
 *
 * Serviço de domínio server-side para validação pré-envio, idempotência técnica local,
 * bloqueio de concorrência, suporte a providers (Resend / Fake) e transição factual de disparos.
 */

/**
 * Executa o disparo factual de uma comunicação previamente aprovada.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient Client com service_role
 * @param {Object} params
 * @param {string} params.adminUserId UUID do Admin autenticado
 * @param {string} params.approvedCommunicationId UUID da comunicação aprovada
 * @param {string} [params.provider='resend'] 'resend' | 'fake'
 * @param {string} [params.simulateMode='accepted'] Apenas para provider='fake': 'accepted' | 'failed' | 'unknown'
 * @param {Object} [params.resendClient] Cliente Resend opcional para mocks em testes
 * @param {Date|string} [params.now=new Date()] Instante de referência para o motor
 * @returns {Promise<Object>} Registo do dispatch criado e atualizado
 */
export async function dispatchApprovedFollowUpCommunication(supabaseClient, {
  adminUserId,
  approvedCommunicationId,
  provider = 'resend',
  simulateMode = 'accepted',
  resendClient = null,
  now = new Date()
}) {
  if (!supabaseClient) throw new Error('SupabaseClient é obrigatório em dispatchApprovedFollowUpCommunication');
  if (!adminUserId) throw new Error('adminUserId é obrigatório em dispatchApprovedFollowUpCommunication');
  if (!approvedCommunicationId) throw new Error('approvedCommunicationId é obrigatório em dispatchApprovedFollowUpCommunication');

  const evaluationDate = typeof now === 'string' ? new Date(now) : now;
  const nowMs = evaluationDate.getTime();
  const selectedProvider = provider === 'fake' ? 'fake' : 'resend';

  // 1. Carregar a Approved Communication
  const { data: approvedComm, error: commErr } = await supabaseClient
    .from('approved_communications')
    .select(`
      id,
      lead_id,
      cadence_instance_id,
      context_fingerprint,
      reason_code,
      channel,
      recipient_email,
      recipient_name,
      subject,
      body,
      generation_source,
      status,
      approved_by,
      approved_at
    `)
    .eq('id', approvedCommunicationId)
    .maybeSingle();

  if (commErr || !approvedComm) {
    const err = new Error('Comunicação aprovada não encontrada.');
    err.statusCode = 404;
    throw err;
  }

  if (approvedComm.status !== 'approved') {
    const err = new Error(`Não é possível enviar: Comunicação aprovada está com estado '${approvedComm.status}'.`);
    err.statusCode = 409;
    throw err;
  }

  const leadId = approvedComm.lead_id;

  // 1.1. Active Dispatch Lock & Concorrência Atómica para a mesma Approved Communication
  const { data: existingDispatches } = await supabaseClient
    .from('communication_dispatches')
    .select('id, status, idempotency_key, created_at')
    .eq('approved_communication_id', approvedCommunicationId)
    .order('created_at', { ascending: true });

  const dispatchesList = existingDispatches || [];

  const acceptedDispatch = dispatchesList.find(d => d.status === 'accepted');
  if (acceptedDispatch) {
    const err = new Error('Disparo bloqueado: Esta comunicação aprovada já foi enviada e aceite pelo provider.');
    err.statusCode = 409;
    err.dispatch_active_status = 'accepted';
    throw err;
  }

  const unknownDispatch = dispatchesList.find(d => d.status === 'unknown');
  if (unknownDispatch) {
    const err = new Error('Disparo bloqueado: Esta comunicação está num estado incerto (unknown) e aguarda reconciliação manual.');
    err.statusCode = 409;
    err.dispatch_active_status = 'unknown';
    throw err;
  }

  const activeLockDispatch = dispatchesList.find(d => d.status === 'pending' || d.status === 'processing');
  if (activeLockDispatch) {
    const err = new Error('Disparo bloqueado: Já existe um envio em curso para esta comunicação aprovada.');
    err.statusCode = 409;
    err.dispatch_active_status = activeLockDispatch.status;
    throw err;
  }

  // 1.2 Cooldown Global de 48 Horas (Disparos Comerciais Aceites)
  const { data: recentAcceptedDispatches } = await supabaseClient
    .from('communication_dispatches')
    .select('provider_accepted_at')
    .eq('lead_id', leadId)
    .eq('status', 'accepted')
    .order('provider_accepted_at', { ascending: false })
    .limit(1);

  if (Array.isArray(recentAcceptedDispatches) && recentAcceptedDispatches.length > 0) {
    const lastAcceptedAt = new Date(recentAcceptedDispatches[0].provider_accepted_at).getTime();
    const hoursSinceLastAccepted = (nowMs - lastAcceptedAt) / (1000 * 60 * 60);
    if (hoursSinceLastAccepted < 48) {
      const err = new Error(`Disparo bloqueado: A lead recebeu outro contacto comercial externo aceite há ${hoursSinceLastAccepted.toFixed(1)} horas (Limite mínimo: 48h).`);
      err.statusCode = 422;
      err.cooldown_active = true;
      throw err;
    }
  }

  // 1.3 Barreira de Segurança Transversal para Disparos Unknown na Mesma Lead
  const { data: leadUnknownDispatches } = await supabaseClient
    .from('communication_dispatches')
    .select('id, approved_communication_id, status')
    .eq('lead_id', leadId)
    .eq('status', 'unknown')
    .limit(1);

  if (Array.isArray(leadUnknownDispatches) && leadUnknownDispatches.length > 0) {
    const err = new Error('Disparo bloqueado por segurança: Existe um disparo prévio em estado incerto (unknown) para esta lead que aguarda reconciliação manual.');
    err.statusCode = 409;
    err.unknown_cross_approval_block = true;
    throw err;
  }

  // 2. Carregar contexto factual completo da lead para Validação Factual e Drift Detection
  const selectQuery = `
    id,
    name,
    email,
    company_name,
    need_description,
    primary_service,
    pipeline_stage,
    lead_classification,
    last_interaction_at,
    created_at,
    updated_at,
    conversations (
      id,
      status,
      last_activity_at,
      updated_at
    ),
    calendar_bookings (
      id,
      status,
      start_time,
      end_time
    ),
    lead_tasks (
      id,
      title,
      status,
      priority,
      due_at,
      created_at
    )
  `;

  const { data: rawLead, error: leadErr } = await supabaseClient
    .from('leads')
    .select(selectQuery)
    .eq('id', leadId)
    .maybeSingle();

  if (leadErr || !rawLead) {
    const err = new Error('Lead associada à comunicação não foi encontrada.');
    err.statusCode = 404;
    throw err;
  }

  const latestConv = (rawLead.conversations || []).sort((a, b) => {
    const aTime = a.last_activity_at ? new Date(a.last_activity_at).getTime() : 0;
    const bTime = b.last_activity_at ? new Date(b.last_activity_at).getTime() : 0;
    return bTime - aTime;
  })[0] || null;

  const cadenceReadModel = await getLeadCadenceReadModel(supabaseClient, leadId);

  const context = {
    lead: {
      id: rawLead.id,
      name: rawLead.name,
      email: rawLead.email,
      company_name: rawLead.company_name,
      need_description: rawLead.need_description,
      primary_service: rawLead.primary_service,
      pipeline_stage: rawLead.pipeline_stage,
      lead_classification: rawLead.lead_classification,
      last_interaction_at: rawLead.last_interaction_at,
      created_at: rawLead.created_at,
      updated_at: rawLead.updated_at
    },
    latestConversation: latestConv,
    bookings: rawLead.calendar_bookings || [],
    tasks: rawLead.lead_tasks || [],
    cadenceReadModel
  };

  // 3. Reavaliação server-side com o Follow-Up Engine (7G.1 Cadence-Aware)
  const recommendation = evaluateFollowUp(context, evaluationDate);

  if (recommendation.blocked) {
    const err = new Error(`Disparo cancelado por segurança: Lead está bloqueada (${recommendation.blocked_reason})`);
    err.statusCode = 422;
    err.blocked_reason = recommendation.blocked_reason;
    throw err;
  }

  if (!recommendation.needs_follow_up || !recommendation.reason_code) {
    const err = new Error('Disparo cancelado: A recomendação comercial expirou ou deixou de ser necessária.');
    err.statusCode = 422;
    throw err;
  }

  if (recommendation.contact_eligible !== true) {
    const err = new Error(`Disparo rejeitado: Recomendação com tipo de ação '${recommendation.action_type || 'não elegível'}' não permite disparo comercial.`);
    err.statusCode = 422;
    err.contact_eligible = false;
    err.action_type = recommendation.action_type;
    throw err;
  }

  // 4. Verificação de Fingerprint Drift (Contexto Factual Atual vs Contexto de Aprovação)
  const currentFingerprint = buildFollowUpContextFingerprint(context, recommendation);
  if (currentFingerprint !== approvedComm.context_fingerprint) {
    const err = new Error('Disparo bloqueado (Fingerprint Drift): O contexto da lead alterou-se após a aprovação da mensagem. É necessária nova revisão.');
    err.statusCode = 409;
    err.fingerprint_drift = true;
    err.approved_fingerprint = approvedComm.context_fingerprint;
    err.current_fingerprint = currentFingerprint;
    throw err;
  }

  // 5. Verificação do Recommendation State (ignored / snoozed)
  const statesMap = await bulkGetEffectiveFollowUpStates(supabaseClient, [{ lead_id: leadId, context_fingerprint: currentFingerprint }], evaluationDate);
  const stateInfo = statesMap.get(currentFingerprint);

  if (stateInfo?.effective_state === 'ignored') {
    const err = new Error('Disparo bloqueado: Recomendação atual está ignorada.');
    err.statusCode = 422;
    throw err;
  }

  if (stateInfo?.effective_state === 'snoozed') {
    const err = new Error('Disparo bloqueado: Recomendação atual está adiada (Snoozed).');
    err.statusCode = 422;
    throw err;
  }

  // 7. Gerar Idempotency Key Server-Side para esta tentativa técnica
  const failedDispatchesCount = dispatchesList.filter(d => d.status === 'failed').length;
  const technicalAttemptNumber = failedDispatchesCount + 1;
  const idempotencyKey = crypto.createHash('sha256').update(`${approvedCommunicationId}_try_${technicalAttemptNumber}`).digest('hex');

  // 8. Inserir Registo 'pending' em communication_dispatches
  const pendingPayload = {
    approved_communication_id: approvedCommunicationId,
    lead_id: leadId,
    provider: selectedProvider,
    status: 'pending',
    idempotency_key: idempotencyKey,
    provider_message_id: null,
    recipient_email_snapshot: approvedComm.recipient_email,
    subject_snapshot: approvedComm.subject || null,
    body_snapshot: approvedComm.body,
    provider_accepted_at: null,
    error_code: null,
    error_message: null,
    dispatched_by: adminUserId
  };

  const { data: pendingDispatch, error: insertErr } = await supabaseClient
    .from('communication_dispatches')
    .insert(pendingPayload)
    .select()
    .single();

  if (insertErr) {
    if (insertErr.code === '23505') { // Unique constraint violation on idempotency_key
      const err = new Error('Disparo bloqueado por concorrência: Idempotency Key em uso.');
      err.statusCode = 409;
      throw err;
    }
    console.error('Erro ao registar dispatch pending:', insertErr);
    throw insertErr;
  }

  // 9. Invocação do Provider (Resend real ou Fake simulation)
  let providerResult = null;
  if (selectedProvider === 'resend') {
    providerResult = await sendEmailWithResendProvider({
      idempotencyKey,
      to: approvedComm.recipient_email,
      subject: approvedComm.subject,
      text: approvedComm.body,
      resendClient
    });
  } else {
    try {
      providerResult = await sendEmailWithFakeProvider({
        idempotencyKey,
        from: 'Lumyo <noreply@lumyo.pt>',
        to: approvedComm.recipient_email,
        subject: approvedComm.subject,
        text: approvedComm.body,
        simulateMode,
        now: evaluationDate
      });
    } catch (providerErr) {
      console.warn('Erro/Exception na simulação do Fake Provider:', providerErr.message);
      providerResult = {
        ok: false,
        provider: 'fake',
        providerMessageId: null,
        acceptedAt: null,
        errorCode: 'PROVIDER_TIMEOUT',
        errorMessage: providerErr.message || 'Exceção não tratada na invocação do provider'
      };
    }
  }

  // 10. Transição e Atualização do Registo de Dispatch
  let updatePayload = { updated_at: new Date().toISOString() };

  if (providerResult.ok && providerResult.providerMessageId && providerResult.acceptedAt) {
    updatePayload.status = 'accepted';
    updatePayload.provider_message_id = providerResult.providerMessageId;
    updatePayload.provider_accepted_at = providerResult.acceptedAt;
  } else if (providerResult.errorCode === 'PROVIDER_TIMEOUT' || simulateMode === 'unknown') {
    updatePayload.status = 'unknown';
    updatePayload.error_code = sanitizeErrorCode(providerResult.errorCode || 'PROVIDER_TIMEOUT');
    updatePayload.error_message = sanitizeErrorMessage(providerResult.errorMessage || 'Timeout de resposta na simulação do provider');
  } else {
    updatePayload.status = 'failed';
    updatePayload.error_code = sanitizeErrorCode(providerResult.errorCode || 'PROVIDER_REJECTED');
    updatePayload.error_message = sanitizeErrorMessage(providerResult.errorMessage || 'Rejeição do provider');
  }

  const { data: updatedDispatch, error: updateErr } = await supabaseClient
    .from('communication_dispatches')
    .update(updatePayload)
    .eq('id', pendingDispatch.id)
    .select()
    .single();

  if (updateErr) {
    console.error('Erro ao atualizar estado do dispatch:', updateErr);
    throw updateErr;
  }

  if (!providerResult.ok) {
    const err = new Error(updatedDispatch.error_message || 'Falha no disparo de email.');
    err.statusCode = providerResult.errorCode === 'TEST_RECIPIENT_NOT_ALLOWED' ? 422 : 502;
    err.dispatch = updatedDispatch;
    err.errorCode = updatedDispatch.error_code;
    throw err;
  }

  return {
    ok: true,
    dispatch: updatedDispatch
  };
}

/**
 * Deriva deterministicamente a contagem factual de Business Attempts efetuadas numa cadence instance.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {string} cadenceInstanceId UUID da pipeline_stage_history
 * @returns {Promise<number>} Número de aprovações distintas com pelo menos um dispatch accepted
 */
export async function getFactualBusinessAttemptsForCadence(supabaseClient, cadenceInstanceId) {
  if (!supabaseClient || !cadenceInstanceId) return 0;

  const { data: approvedComms, error } = await supabaseClient
    .from('approved_communications')
    .select('id, communication_dispatches (id, status)')
    .eq('cadence_instance_id', cadenceInstanceId);

  if (error || !Array.isArray(approvedComms)) {
    return 0;
  }

  const completedAttempts = approvedComms.filter(comm => {
    const dispatches = comm.communication_dispatches || [];
    return dispatches.some(d => d.status === 'accepted');
  });

  return completedAttempts.length;
}

function sanitizeErrorCode(code) {
  if (!code || typeof code !== 'string') return 'DISPATCH_ERROR';
  const clean = code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_').slice(0, 50);
  return clean || 'DISPATCH_ERROR';
}

function sanitizeErrorMessage(msg) {
  if (!msg || typeof msg !== 'string') return 'Erro não especificado no disparo.';
  let clean = msg;
  clean = clean.replace(/(Bearer\s+|re_|key=|[a-z0-9_-]*key[a-z0-9_-]*=)[^\s&]+/gi, '$1[REDACTED]');
  clean = clean.replace(/re_[a-zA-Z0-9_]{20,}/g, '[REDACTED_API_KEY]');
  clean = clean.replace(/sk-[a-zA-Z0-9]{20,}/g, '[REDACTED_API_KEY]');
  clean = clean.split('\n').filter(line => !line.trim().startsWith('at ')).join(' ');
  return clean.trim().slice(0, 500);
}
