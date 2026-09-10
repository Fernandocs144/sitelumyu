import assert from 'node:assert';
import {
  formatFallback,
  formatPrimaryService,
  formatServiceVariant,
  formatServiceFull,
  formatLanguage,
  formatTimeline,
  formatDecisionInvolvement,
  formatIntentLevel,
  formatAlignmentBadge,
  formatAlignmentReason,
  formatClassificationBadge,
  formatClassificationReason,
  formatNextStep,
  formatSource,
  formatConversationStatus,
  formatCommercialStage,
  formatPrimaryOutcome,
} from '../../src/utils/adminFormatters.js';

console.log('=== INICIANDO SUITE DE TESTES DOS FORMATADORES DE TAXONOMIA ADMIN ===\n');

// 1. TESTE DE FALLBACK GENÉRICO
{
  assert.strictEqual(formatFallback('high'), 'High');
  assert.strictEqual(formatFallback('booking_pending'), 'Booking Pending');
  assert.strictEqual(formatFallback('some_new_unknown_code'), 'Some New Unknown Code');
  assert.strictEqual(formatFallback(''), '—');
  assert.strictEqual(formatFallback(null), '—');

  console.log('TESTE 1 PASSOU: Fallback legível para valores não mapeados verificado.');
}

// 2. TESTE DE INTENT LEVEL
{
  assert.strictEqual(formatIntentLevel('high'), 'Elevado');
  assert.strictEqual(formatIntentLevel('medium'), 'Médio');
  assert.strictEqual(formatIntentLevel('low'), 'Baixo');
  assert.strictEqual(formatIntentLevel('exploratory'), 'Exploratório');
  assert.strictEqual(formatIntentLevel('unknown_intent'), 'Unknown Intent');

  console.log('TESTE 2 PASSOU: Mapeamento de intent_level verificado.');
}

// 3. TESTE DE NEXT STEP
{
  assert.strictEqual(formatNextStep('booking_pending'), 'Marcação de reunião pendente');
  assert.strictEqual(formatNextStep('schedule_meeting'), 'Agendar reunião de diagnóstico');
  assert.strictEqual(formatNextStep('human_contact_requested'), 'Contacto humano solicitado pelo visitante');

  console.log('TESTE 3 PASSOU: Mapeamento de next_step verificado.');
}

// 4. TESTE DE FINANCIAL ALIGNMENT REASON
{
  assert.strictEqual(formatAlignmentReason('budget_at_or_above_minimum'), 'Orçamento igual ou superior ao mínimo de referência');
  assert.strictEqual(formatAlignmentReason('budget_aligned_project_range'), 'Orçamento declarado dentro da faixa de referência para a variante do projeto');
  assert.strictEqual(formatAlignmentReason('budget_not_normalized'), 'Orçamento não especificado ou pendente de clarificação');

  console.log('TESTE 4 PASSOU: Mapeamento de financial_alignment_reason verificado.');
}

// 5. TESTE DE CLASSIFICATION REASON
{
  assert.strictEqual(formatClassificationReason('qualification_complete_financial_aligned'), 'Qualificação concluída e financeiramente alinhada');
  assert.strictEqual(formatClassificationReason('contact_and_timeline_missing'), 'Pendente de confirmação de dados de contacto e prazo');

  console.log('TESTE 5 PASSOU: Mapeamento de classification_reason verificado.');
}

// 6. TESTE DE COMMERCIAL STAGE E CONVERSATION STATUS
{
  assert.strictEqual(formatCommercialStage('discovery'), 'Descoberta / Levantamento de necessidades');
  assert.strictEqual(formatCommercialStage('exploring_need'), 'Exploração da necessidade');
  assert.strictEqual(formatConversationStatus('active'), 'Ativa');
  assert.strictEqual(formatConversationStatus('Active'), 'Ativa');
  assert.strictEqual(formatPrimaryOutcome('meeting_booked'), 'Reunião agendada');

  console.log('TESTE 6 PASSOU: Mapeamento de etapas e estado de conversa verificado.');
}

// 7. TESTE DE SERVIÇOS E LINGUAGEM
{
  assert.strictEqual(formatServiceFull('websites', 'ecommerce'), 'Websites (Loja Online / E-commerce)');
  assert.strictEqual(formatLanguage('pt'), 'Português (PT)');
  assert.strictEqual(formatLanguage('en'), 'Inglês (EN)');
  assert.strictEqual(formatSource('website_agent'), 'Agente Comercial Lumyo (Website)');

  console.log('TESTE 7 PASSOU: Mapeamento de serviços, linguagem e fonte verificado.');
}

console.log('\n=== TODOS OS TESTES DOS FORMATADORES PASSARAM COM SUCESSO ===');
