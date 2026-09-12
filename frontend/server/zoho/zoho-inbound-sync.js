/**
 * FASE E.1 — COMPONENTE DE SINCRONIZAÇÃO INCREMENTAL ZOHO INBOX
 *
 * Responsável por:
 * 1. Paginar a Inbox Zoho de forma segura e limitada.
 * 2. Extrair identificadores estáveis e validar timestamps.
 * 3. Filtrar emails internos/próprios da Lumyo (self-sent).
 * 4. Aplicar minimização de dados (sem HTML nem anexos).
 * 5. Invocação da RPC process_inbound_email.
 * 6. Devolver estritamente métricas operacionais sem expor conteúdo.
 */

import { isLumyoSelfSentEmail, normalizeEmailAddress, processNormalizedInboundEmail } from './inbound-email-processor.js';

export function extractEmailAddress(rawSender) {
  if (!rawSender || typeof rawSender !== 'string') return '';
  const match = rawSender.match(/<([^>]+)>/) || rawSender.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  return match ? match[1].trim().toLowerCase() : rawSender.trim().toLowerCase();
}

export function parseZohoReceivedDate(rawTime) {
  if (rawTime === null || rawTime === undefined || rawTime === '') return null;

  if (typeof rawTime === 'number' || (typeof rawTime === 'string' && /^\d+$/.test(rawTime.trim()))) {
    const num = Number(rawTime);
    if (!isNaN(num) && num > 0) {
      const d = new Date(num);
      return !isNaN(d.getTime()) ? d.toISOString() : null;
    }
  }

  if (typeof rawTime === 'string') {
    const d = new Date(rawTime);
    return !isNaN(d.getTime()) ? d.toISOString() : null;
  }

  return null;
}

export async function syncZohoInboundMessages({
  supabaseClient,
  fetchMessagesFn,
  folderId = null,
  accountId = null,
  limit = 50,
  maxPages = 5
}) {
  if (!supabaseClient) throw new Error('supabaseClient é obrigatório em syncZohoInboundMessages');
  if (typeof fetchMessagesFn !== 'function') {
    throw new Error('fetchMessagesFn (função de busca de mensagens) é obrigatória em syncZohoInboundMessages');
  }

  const metrics = {
    scanned: 0,
    processed: 0,
    duplicates: 0,
    unmatched: 0,
    ambiguous: 0,
    self_filtered: 0,
    invalid: 0,
    errors: 0,
    has_more: false
  };

  const processedMsgIdsInRun = new Set();

  for (let page = 1; page <= maxPages; page++) {
    const start = (page - 1) * limit + 1;
    let pageMessages = [];

    try {
      pageMessages = await fetchMessagesFn({ start, limit, folderId, accountId });
    } catch (err) {
      if (page === 1) {
        throw new Error(`Falha na API Zoho ao procurar mensagens: ${err.message}`);
      }
      metrics.errors++;
      break;
    }

    if (!Array.isArray(pageMessages) || pageMessages.length === 0) {
      break;
    }

    if (page === maxPages && pageMessages.length >= limit) {
      metrics.has_more = true;
    }

    for (const msg of pageMessages) {
      metrics.scanned++;

      try {
        const rawMsgId = msg.messageId || msg.providerMessageId || msg.id || msg.message_id;
        const providerMessageId = rawMsgId ? String(rawMsgId).trim() : '';
        const rawSender = msg.fromAddress || msg.senderEmail || msg.sender || msg.from;
        const senderEmail = extractEmailAddress(rawSender);
        const recipientEmail = extractEmailAddress(msg.toAddress || msg.recipientEmail || msg.recipient || msg.to || 'contacto@lumyo.pt') || 'contacto@lumyo.pt';
        const receivedAtIso = parseZohoReceivedDate(msg.receivedTime || msg.sentDateInGMT || msg.received_at || msg.receivedTimeInGMT);

        // 1. Validação de segurança temporal e de identificador (Requisito 6)
        if (!providerMessageId || !senderEmail || !receivedAtIso) {
          metrics.invalid++;
          continue;
        }

        // 2. Proteção contra duplicados no mesmo lote
        if (processedMsgIdsInRun.has(providerMessageId)) {
          metrics.duplicates++;
          continue;
        }
        processedMsgIdsInRun.add(providerMessageId);

        // 3. Filtragem de emails próprios da Lumyo (Requisito 4)
        if (isLumyoSelfSentEmail(senderEmail)) {
          metrics.self_filtered++;
          continue;
        }

        // 4. Minimização de dados: textContent = null, htmlContent = null (Requisito 5)
        const result = await processNormalizedInboundEmail(supabaseClient, {
          provider: 'zoho',
          providerMessageId,
          senderEmail,
          recipientEmail,
          subject: msg.subject ? String(msg.subject).substring(0, 250) : null,
          textContent: null,
          htmlContent: null,
          receivedAt: receivedAtIso
        });

        if (result.ignored && result.reason === 'self_sent_lumyo_email') {
          metrics.self_filtered++;
        } else if (result.inserted === false) {
          metrics.duplicates++;
        } else if (result.inserted === true) {
          if (result.lead_id !== null) {
            metrics.processed++;
          } else {
            if (result.lead_count > 1) {
              metrics.ambiguous++;
            } else {
              metrics.unmatched++;
            }
          }
        }
      } catch (msgErr) {
        metrics.errors++;
      }
    }

    if (pageMessages.length < limit) {
      break;
    }
  }

  return metrics;
}
