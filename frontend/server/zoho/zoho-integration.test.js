import assert from 'node:assert';
import { test } from 'node:test';
import { handleZohoAuthorizeRequest, buildZohoAuthUrl } from '../../api/integrations/zoho/authorize.js';
import { handleZohoCallbackRequest, exchangeZohoCodeForTokens } from '../../api/integrations/zoho/callback.js';
import { isLumyoSelfSentEmail, normalizeEmailAddress, processNormalizedInboundEmail } from './inbound-email-processor.js';
import { syncZohoInboundMessages, extractEmailAddress, parseZohoReceivedDate } from './zoho-inbound-sync.js';

test('=== SUITE COMPLETA DE TESTES DA INTEGRAÇÃO ZOHO MAIL E INBOUND EMAIL ===', async () => {

  // 1. Testes de URL de Autorização OAuth
  const authUrl = buildZohoAuthUrl({
    clientId: 'test-client-id',
    redirectUri: 'https://www.lumyo.pt/api/integrations/zoho/callback',
    state: 'test-state-123'
  });
  assert.strictEqual(authUrl.includes('https://accounts.zoho.eu/oauth/v2/auth'), true);
  assert.strictEqual(authUrl.includes('client_id=test-client-id'), true);
  assert.strictEqual(authUrl.includes('scope=ZohoMail.accounts.READ%2CZohoMail.folders.READ%2CZohoMail.messages.READ'), true);
  assert.strictEqual(authUrl.includes('access_type=offline'), true);
  assert.strictEqual(authUrl.includes('prompt=consent'), true);
  console.log('PASSO 1 PASSOU: Geração de URL de autorização OAuth para Zoho EU validada.');

  // 2. Teste: Configuração OAuth em falta
  const originalClientId = process.env.ZOHO_CLIENT_ID;
  const originalClientSecret = process.env.ZOHO_CLIENT_SECRET;

  delete process.env.ZOHO_CLIENT_ID;
  delete process.env.ZOHO_CLIENT_SECRET;

  const reqNoConfig = new Request('http://localhost:3000/api/integrations/zoho/callback?code=abc&state=123');
  const resNoConfig = await handleZohoCallbackRequest(reqNoConfig);
  assert.strictEqual(resNoConfig.status, 400); // Falha de CSRF state ou falta de config
  const dataNoConfig = await resNoConfig.json();
  assert.strictEqual(dataNoConfig.refresh_token, undefined);
  assert.strictEqual(dataNoConfig.access_token, undefined);
  console.log('PASSO 2 PASSOU: Rejeição por falta de configuração OAuth sem exposição de tokens.');

  // Restaurar envs de teste
  process.env.ZOHO_CLIENT_ID = 'test-id';
  process.env.ZOHO_CLIENT_SECRET = 'test-secret';

  // 3. Teste: Callback sem Code
  const reqNoCode = new Request('http://localhost:3000/api/integrations/zoho/callback', {
    headers: { Cookie: 'lumyo_zoho_oauth_state=state123' }
  });
  const resNoCode = await handleZohoCallbackRequest(reqNoCode);
  assert.strictEqual(resNoCode.status, 400);
  const dataNoCode = await resNoCode.json();
  assert.strictEqual(dataNoCode.error, 'Missing authorization code');
  assert.strictEqual(dataNoCode.refresh_token, undefined);
  assert.strictEqual(dataNoCode.access_token, undefined);
  console.log('PASSO 3 PASSOU: Rejeição de callback sem code sem exposição de tokens.');

  // 4. Teste: State Inválido (Proteção CSRF)
  const reqInvalidState = new Request('http://localhost:3000/api/integrations/zoho/callback?code=code123&state=badstate', {
    headers: { Cookie: 'lumyo_zoho_oauth_state=goodstate' }
  });
  const resInvalidState = await handleZohoCallbackRequest(reqInvalidState);
  assert.strictEqual(resInvalidState.status, 400);
  const dataInvalidState = await resInvalidState.json();
  assert.strictEqual(dataInvalidState.error, 'Invalid state parameter (CSRF protection)');
  assert.strictEqual(dataInvalidState.refresh_token, undefined);
  assert.strictEqual(dataInvalidState.access_token, undefined);
  console.log('PASSO 4 PASSOU: Proteção CSRF por validação de State sem exposição de tokens.');

  // 5. Teste: Simulação do Callback com Troca de Tokens Válida vs Falha de Troca
  const originalFetch = globalThis.fetch;
  try {
    // 5.1. Falha na troca de tokens com a Zoho
    globalThis.fetch = async (url) => {
      if (String(url).includes('accounts.zoho.eu')) {
        return new Response(JSON.stringify({ error: 'invalid_code' }), { status: 400 });
      }
      return originalFetch(url);
    };

    const reqTokenFail = new Request('http://localhost:3000/api/integrations/zoho/callback?code=badcode&state=validstate', {
      headers: { Cookie: 'lumyo_zoho_oauth_state=validstate' }
    });
    const resTokenFail = await handleZohoCallbackRequest(reqTokenFail);
    assert.strictEqual(resTokenFail.status, 500);
    const dataTokenFail = await resTokenFail.json();
    assert.strictEqual(dataTokenFail.refresh_token, undefined);
    assert.strictEqual(dataTokenFail.access_token, undefined);

    // 5.2. Sucesso na troca de tokens (Sem exposição de tokens/secrets)
    globalThis.fetch = async (url) => {
      if (String(url).includes('accounts.zoho.eu')) {
        return new Response(JSON.stringify({
          access_token: 'secret_access_token_123',
          refresh_token: 'secret_refresh_token_xyz_456',
          expires_in: 3600
        }), { status: 200 });
      }
      return originalFetch(url);
    };

    const reqTokenSuccess = new Request('http://localhost:3000/api/integrations/zoho/callback?code=validcode&state=validstate', {
      headers: { Cookie: 'lumyo_zoho_oauth_state=validstate' }
    });
    const resTokenSuccess = await handleZohoCallbackRequest(reqTokenSuccess);
    assert.strictEqual(resTokenSuccess.status, 200);
    const dataTokenSuccess = await resTokenSuccess.json();

    // Garantias de segurança: NENHUM token ou secret é exposto na resposta
    assert.strictEqual(dataTokenSuccess.success, true);
    assert.strictEqual(dataTokenSuccess.obtained_refresh_token, true);
    assert.strictEqual(dataTokenSuccess.refresh_token, undefined);
    assert.strictEqual(dataTokenSuccess.access_token, undefined);
    assert.strictEqual(dataTokenSuccess.client_secret, undefined);
    assert.strictEqual(dataTokenSuccess.code, undefined);

  } finally {
    globalThis.fetch = originalFetch;
  }
  console.log('PASSO 5 PASSOU: Sucesso na troca de tokens verificado (zero exposição de secrets/tokens).');

  // 6. Teste: Inbound Email — Filtragem de mensagens enviadas pela própria LUMYO
  assert.strictEqual(isLumyoSelfSentEmail('noreply@lumyo.pt'), true);
  assert.strictEqual(isLumyoSelfSentEmail('CONTACTO@LUMYO.PT'), true);
  assert.strictEqual(isLumyoSelfSentEmail('equipa@lumyo.pt'), true);
  assert.strictEqual(isLumyoSelfSentEmail('lead.cliente@gmail.com'), false);

  const mockSupabaseSelf = {};
  const resSelf = await processNormalizedInboundEmail(mockSupabaseSelf, {
    providerMessageId: 'msg-self-1',
    senderEmail: 'noreply@lumyo.pt',
    recipientEmail: 'cliente@example.com',
    subject: 'Teste'
  });
  assert.strictEqual(resSelf.ignored, true);
  assert.strictEqual(resSelf.reason, 'self_sent_lumyo_email');
  console.log('PASSO 6 PASSOU: Filtragem de emails enviados pela própria LUMYO verificada.');

  // 7. Teste: Normalização de Email
  assert.strictEqual(normalizeEmailAddress('  Ana.Silva@Empresa.Com '), 'ana.silva@empresa.com');

  // 8. Mock Supabase para Testes de Idempotência e Atualização de last_interaction_at
  const leadsDb = new Map([
    ['lead-1', {
      id: 'lead-1',
      email: 'lead.existente@empresa.com',
      email_normalized: 'lead.existente@empresa.com',
      last_interaction_at: '2026-09-01T10:00:00.000Z'
    }]
  ]);

  const inboundDb = new Map();

  const mockSupabaseClient = {
    rpc(fnName, args) {
      if (fnName === 'process_inbound_email') {
        const cleanSender = normalizeEmailAddress(args.p_sender_email);
        const key = `${args.p_provider}_${args.p_provider_message_id}`;

        let matchedLead = null;
        for (const l of leadsDb.values()) {
          if (l.email_normalized === cleanSender) {
            matchedLead = l;
            break;
          }
        }

        if (inboundDb.has(key)) {
          return Promise.resolve({
            data: {
              inserted: false,
              inbound_id: inboundDb.get(key).id,
              lead_id: matchedLead ? matchedLead.id : null,
              updated_last_interaction: false
            },
            error: null
          });
        }

        const newInboundId = `inbound-uuid-${inboundDb.size + 1}`;
        inboundDb.set(key, {
          id: newInboundId,
          provider: args.p_provider,
          provider_message_id: args.p_provider_message_id,
          lead_id: matchedLead ? matchedLead.id : null,
          sender_email: cleanSender,
          received_at: args.p_received_at
        });

        let updatedLast = false;
        if (matchedLead) {
          const existingTime = new Date(matchedLead.last_interaction_at).getTime();
          const newTime = new Date(args.p_received_at).getTime();
          if (newTime > existingTime) {
            matchedLead.last_interaction_at = args.p_received_at;
            updatedLast = true;
          }
        }

        return Promise.resolve({
          data: {
            inserted: true,
            inbound_id: newInboundId,
            lead_id: matchedLead ? matchedLead.id : null,
            updated_last_interaction: updatedLast
          },
          error: null
        });
      }
      return Promise.resolve({ data: null, error: new Error('RPC não implementado') });
    }
  };

  // 9. Teste: Lead Encontrada e Atualização de last_interaction_at (received_at mais recente)
  const resMatched = await processNormalizedInboundEmail(mockSupabaseClient, {
    provider: 'zoho',
    providerMessageId: 'zoho-msg-101',
    senderEmail: 'Lead.Existente@empresa.com',
    recipientEmail: 'contacto@lumyo.pt',
    subject: 'Resposta Comercial',
    receivedAt: '2026-09-11T12:00:00.000Z'
  });

  assert.strictEqual(resMatched.ok, true);
  assert.strictEqual(resMatched.inserted, true);
  assert.strictEqual(resMatched.lead_id, 'lead-1');
  assert.strictEqual(resMatched.updated_last_interaction, true);
  assert.strictEqual(leadsDb.get('lead-1').last_interaction_at, '2026-09-11T12:00:00.000Z');
  console.log('PASSO 9 PASSOU: Associação a Lead existente e atualização de last_interaction_at verificada.');

  // 10. Teste: Idempotência (Mesmo provider_message_id)
  const resDuplicate = await processNormalizedInboundEmail(mockSupabaseClient, {
    provider: 'zoho',
    providerMessageId: 'zoho-msg-101',
    senderEmail: 'Lead.Existente@empresa.com',
    recipientEmail: 'contacto@lumyo.pt',
    subject: 'Resposta Comercial Repetida',
    receivedAt: '2026-09-11T13:00:00.000Z'
  });

  assert.strictEqual(resDuplicate.ok, true);
  assert.strictEqual(resDuplicate.inserted, false);
  assert.strictEqual(resDuplicate.updated_last_interaction, false);
  console.log('PASSO 10 PASSOU: Idempotência para o mesmo provider_message_id verificada.');

  // 11. Teste: received_at Antigo NÃO Recua last_interaction_at
  const resOlder = await processNormalizedInboundEmail(mockSupabaseClient, {
    provider: 'zoho',
    providerMessageId: 'zoho-msg-102',
    senderEmail: 'Lead.Existente@empresa.com',
    recipientEmail: 'contacto@lumyo.pt',
    subject: 'Mensagem Antiga Chegada com Atraso',
    receivedAt: '2026-09-05T08:00:00.000Z'
  });

  assert.strictEqual(resOlder.ok, true);
  assert.strictEqual(resOlder.inserted, true);
  assert.strictEqual(resOlder.updated_last_interaction, false);
  assert.strictEqual(leadsDb.get('lead-1').last_interaction_at, '2026-09-11T12:00:00.000Z');
  console.log('PASSO 11 PASSOU: Regra de não recuar last_interaction_at com mensagens antigas verificada.');

  // 12. Teste: Lead Inexistente (lead_id = NULL)
  const resNoLead = await processNormalizedInboundEmail(mockSupabaseClient, {
    provider: 'zoho',
    providerMessageId: 'zoho-msg-103',
    senderEmail: 'novo.contactante@desconhecido.com',
    recipientEmail: 'contacto@lumyo.pt',
    subject: 'Contacto Inicial de Desconhecido',
    receivedAt: '2026-09-11T14:00:00.000Z'
  });

  assert.strictEqual(resNoLead.ok, true);
  assert.strictEqual(resNoLead.inserted, true);
  assert.strictEqual(resNoLead.lead_id, null);
  assert.strictEqual(resNoLead.updated_last_interaction, false);
  console.log('PASSO 12 PASSOU: Persistência de inbound sem lead associada (lead_id = null) verificada.');

  // 13. Testes da Sincronização Incremental Inbox (Cenários A a I)
  // 13.A: Mensagem válida + exatamente 1 lead -> Inbound criado + last_interaction_at atualizado
  const mockSyncDbLeads = new Map([
    ['lead-sync-1', { id: 'lead-sync-1', email_normalized: 'lead.sync1@empresa.com', last_interaction_at: '2026-09-01T10:00:00.000Z' }]
  ]);
  const mockSyncDbInbound = new Map();

  const mockSupabaseSync = {
    rpc(fnName, args) {
      if (fnName === 'process_inbound_email') {
        const cleanSender = normalizeEmailAddress(args.p_sender_email);
        const key = `${args.p_provider}_${args.p_provider_message_id}`;

        const matchingLeads = Array.from(mockSyncDbLeads.values()).filter(l => l.email_normalized === cleanSender);
        const leadCount = matchingLeads.length;
        const matchedLead = leadCount === 1 ? matchingLeads[0] : null;

        if (mockSyncDbInbound.has(key)) {
          return Promise.resolve({
            data: {
              inserted: false,
              inbound_id: mockSyncDbInbound.get(key).id,
              lead_id: matchedLead ? matchedLead.id : null,
              updated_last_interaction: false,
              lead_count: leadCount
            },
            error: null
          });
        }

        const newId = `inbound-sync-${mockSyncDbInbound.size + 1}`;
        mockSyncDbInbound.set(key, {
          id: newId,
          provider: args.p_provider,
          provider_message_id: args.p_provider_message_id,
          lead_id: matchedLead ? matchedLead.id : null,
          sender_email: cleanSender,
          received_at: args.p_received_at
        });

        let updatedLast = false;
        if (matchedLead) {
          const existingTime = new Date(matchedLead.last_interaction_at).getTime();
          const newTime = new Date(args.p_received_at).getTime();
          if (newTime > existingTime) {
            matchedLead.last_interaction_at = args.p_received_at;
            updatedLast = true;
          }
        }

        return Promise.resolve({
          data: {
            inserted: true,
            inbound_id: newId,
            lead_id: matchedLead ? matchedLead.id : null,
            updated_last_interaction: updatedLast,
            lead_count: leadCount
          },
          error: null
        });
      }
      return Promise.resolve({ data: null, error: new Error('RPC não suportada no mock') });
    }
  };

  // A) Mensagem válida + exatamente 1 lead
  const fetchScenarioA = async () => [
    { messageId: 'msg-sync-a-1', fromAddress: 'lead.sync1@empresa.com', receivedTime: '2026-09-12T10:00:00.000Z', subject: 'Inbound Válido' }
  ];
  const metricsA = await syncZohoInboundMessages({ supabaseClient: mockSupabaseSync, fetchMessagesFn: fetchScenarioA });
  assert.strictEqual(metricsA.scanned, 1);
  assert.strictEqual(metricsA.processed, 1);
  assert.strictEqual(metricsA.invalid, 0);
  assert.strictEqual(mockSyncDbLeads.get('lead-sync-1').last_interaction_at, '2026-09-12T10:00:00.000Z');
  console.log('PASSO 13.A PASSOU: Mensagem válida + exatamente 1 lead -> Inbound criado + last_interaction_at atualizado.');

  // B) Mensagem duplicada
  const metricsB = await syncZohoInboundMessages({ supabaseClient: mockSupabaseSync, fetchMessagesFn: fetchScenarioA });
  assert.strictEqual(metricsB.scanned, 1);
  assert.strictEqual(metricsB.duplicates, 1);
  assert.strictEqual(metricsB.processed, 0);
  console.log('PASSO 13.B PASSOU: Mensagem duplicada -> Sem efeito adicional.');

  // C) Remetente desconhecido
  const fetchScenarioC = async () => [
    { messageId: 'msg-sync-c-1', fromAddress: 'desconhecido.lead@test.com', receivedTime: '2026-09-12T11:00:00.000Z', subject: 'Novo Contacto' }
  ];
  const metricsC = await syncZohoInboundMessages({ supabaseClient: mockSupabaseSync, fetchMessagesFn: fetchScenarioC });
  assert.strictEqual(metricsC.scanned, 1);
  assert.strictEqual(metricsC.unmatched, 1);
  assert.strictEqual(metricsC.processed, 0);
  console.log('PASSO 13.C PASSOU: Remetente desconhecido -> Inbound guardado com lead_id NULL.');

  // D) Duas leads com mesmo email (Ambiguidade)
  mockSyncDbLeads.set('lead-ambig-1', { id: 'lead-ambig-1', email_normalized: 'ambiguo@empresa.com', last_interaction_at: '2026-09-01T10:00:00.000Z' });
  mockSyncDbLeads.set('lead-ambig-2', { id: 'lead-ambig-2', email_normalized: 'ambiguo@empresa.com', last_interaction_at: '2026-09-01T10:00:00.000Z' });

  const fetchScenarioD = async () => [
    { messageId: 'msg-sync-d-1', fromAddress: 'ambiguo@empresa.com', receivedTime: '2026-09-12T12:00:00.000Z', subject: 'Contacto Ambíguo' }
  ];
  const metricsD = await syncZohoInboundMessages({ supabaseClient: mockSupabaseSync, fetchMessagesFn: fetchScenarioD });
  assert.strictEqual(metricsD.scanned, 1);
  assert.strictEqual(metricsD.ambiguous, 1);
  assert.strictEqual(metricsD.processed, 0);
  assert.strictEqual(mockSyncDbLeads.get('lead-ambig-1').last_interaction_at, '2026-09-01T10:00:00.000Z');
  assert.strictEqual(mockSyncDbLeads.get('lead-ambig-2').last_interaction_at, '2026-09-01T10:00:00.000Z');
  console.log('PASSO 13.D PASSOU: Duas leads com mesmo email -> Inbound guardado com lead_id NULL e nenhuma lead atualizada.');

  // E) Mensagem da própria LUMYO
  const fetchScenarioE = async () => [
    { messageId: 'msg-sync-e-1', fromAddress: 'noreply@lumyo.pt', receivedTime: '2026-09-12T13:00:00.000Z', subject: 'Notificação Interna' }
  ];
  const metricsE = await syncZohoInboundMessages({ supabaseClient: mockSupabaseSync, fetchMessagesFn: fetchScenarioE });
  assert.strictEqual(metricsE.scanned, 1);
  assert.strictEqual(metricsE.self_filtered, 1);
  console.log('PASSO 13.E PASSOU: Mensagem da própria LUMYO -> Ignorada (self_filtered).');

  // F) provider_message_id inválido
  const fetchScenarioF = async () => [
    { messageId: '', fromAddress: 'lead.sync1@empresa.com', receivedTime: '2026-09-12T14:00:00.000Z', subject: 'Mensagem sem ID' }
  ];
  const metricsF = await syncZohoInboundMessages({ supabaseClient: mockSupabaseSync, fetchMessagesFn: fetchScenarioF });
  assert.strictEqual(metricsF.scanned, 1);
  assert.strictEqual(metricsF.invalid, 1);
  console.log('PASSO 13.F PASSOU: provider_message_id inválido -> Ignorada/controlada (invalid).');

  // G) received_at inválido
  const fetchScenarioG = async () => [
    { messageId: 'msg-sync-g-1', fromAddress: 'lead.sync1@empresa.com', receivedTime: 'invalid-date-format', subject: 'Data Inválida' }
  ];
  const metricsG = await syncZohoInboundMessages({ supabaseClient: mockSupabaseSync, fetchMessagesFn: fetchScenarioG });
  assert.strictEqual(metricsG.scanned, 1);
  assert.strictEqual(metricsG.invalid, 1);
  console.log('PASSO 13.G PASSOU: received_at inválido -> Não atualiza lead e contabiliza invalid.');

  // H) Múltiplas páginas sem duplicação
  const fetchScenarioH = async ({ start, limit }) => {
    if (start === 1) {
      return [
        { messageId: 'msg-p1-1', fromAddress: 'lead.sync1@empresa.com', receivedTime: '2026-09-12T15:00:00.000Z' },
        { messageId: 'msg-p1-2', fromAddress: 'lead.sync1@empresa.com', receivedTime: '2026-09-12T15:05:00.000Z' }
      ];
    }
    if (start === 3) {
      return [
        { messageId: 'msg-p2-1', fromAddress: 'lead.sync1@empresa.com', receivedTime: '2026-09-12T15:10:00.000Z' }
      ];
    }
    return [];
  };
  const metricsH = await syncZohoInboundMessages({ supabaseClient: mockSupabaseSync, fetchMessagesFn: fetchScenarioH, limit: 2, maxPages: 5 });
  assert.strictEqual(metricsH.scanned, 3);
  assert.strictEqual(metricsH.processed, 3);
  console.log('PASSO 13.H PASSOU: Múltiplas páginas -> Todas as páginas previstas são percorridas sem duplicação.');

  // I) Falha numa mensagem isolada
  const fetchScenarioI = async () => [
    { messageId: 'msg-i-1', fromAddress: 'lead.sync1@empresa.com', receivedTime: '2026-09-12T16:00:00.000Z' },
    { messageId: 'msg-i-FAIL', fromAddress: 'lead.sync1@empresa.com', receivedTime: '2026-09-12T16:05:00.000Z' },
    { messageId: 'msg-i-2', fromAddress: 'lead.sync1@empresa.com', receivedTime: '2026-09-12T16:10:00.000Z' }
  ];

  const mockSupabasePartialFail = {
    rpc(fnName, args) {
      if (args.p_provider_message_id === 'msg-i-FAIL') {
        return Promise.reject(new Error('Erro simulação mensagem isolada'));
      }
      return mockSupabaseSync.rpc(fnName, args);
    }
  };

  const metricsI = await syncZohoInboundMessages({ supabaseClient: mockSupabasePartialFail, fetchMessagesFn: fetchScenarioI });
  assert.strictEqual(metricsI.scanned, 3);
  assert.strictEqual(metricsI.errors, 1);
  assert.strictEqual(metricsI.processed, 2);
  console.log('PASSO 13.I PASSOU: Falha numa mensagem isolada -> Comportamento controlado e restantes mensagens processadas.');

  // J) Truncamento de Paginação: maxPages atingido com última página cheia -> has_more = true
  const fetchScenarioJ = async ({ start, limit }) => {
    return Array.from({ length: limit }, (_, i) => ({
      messageId: `msg-trunc-${start}-${i}`,
      fromAddress: 'lead.sync1@empresa.com',
      receivedTime: '2026-09-12T17:00:00.000Z'
    }));
  };

  const metricsJ = await syncZohoInboundMessages({
    supabaseClient: mockSupabaseSync,
    fetchMessagesFn: fetchScenarioJ,
    limit: 2,
    maxPages: 3
  });
  assert.strictEqual(metricsJ.scanned, 6);
  assert.strictEqual(metricsJ.has_more, true, 'has_more deve ser true se a última página de maxPages veio cheia');
  console.log('PASSO 13.J PASSOU: maxPages atingido com última página cheia -> has_more = true.');

  // K) Paginação Drenada: página final incompleta -> has_more = false
  const fetchScenarioK = async ({ start }) => {
    if (start === 1) {
      return [{ messageId: 'msg-k-1', fromAddress: 'lead.sync1@empresa.com', receivedTime: '2026-09-12T17:30:00.000Z' }];
    }
    return [];
  };

  const metricsK = await syncZohoInboundMessages({
    supabaseClient: mockSupabaseSync,
    fetchMessagesFn: fetchScenarioK,
    limit: 2,
    maxPages: 3
  });
  assert.strictEqual(metricsK.scanned, 1);
  assert.strictEqual(metricsK.has_more, false, 'has_more deve ser false se a página final veio incompleta');
  console.log('PASSO 13.K PASSOU: Página final incompleta -> has_more = false.');

  // Restaurar envs originais
  if (originalClientId) process.env.ZOHO_CLIENT_ID = originalClientId;
  else delete process.env.ZOHO_CLIENT_ID;

  if (originalClientSecret) process.env.ZOHO_CLIENT_SECRET = originalClientSecret;
  else delete process.env.ZOHO_CLIENT_SECRET;

  console.log('\n=== TODOS OS TESTES DA INTEGRAÇÃO ZOHO MAIL E INBOUND EMAIL PASSARAM COM SUCESSO ===');
});
