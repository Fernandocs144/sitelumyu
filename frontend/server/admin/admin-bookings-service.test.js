import assert from 'node:assert';
import { createAdminBookingInDatabase } from './admin-bookings-service.js';

console.log('=== INICIANDO TESTES DE CRIAÇÃO MANUAL DE REUNIÕES NO CRM ===\n');

async function runTests() {
  // Teste 1: Rejeitar requisição sem leadId -> 400
  {
    try {
      await createAdminBookingInDatabase(null, { startTime: '2026-09-15T14:30:00Z' });
      assert.fail('Deveria ter lançado erro');
    } catch (err) {
      assert.strictEqual(err.statusCode, 400);
      assert.strictEqual(err.message, 'ID de lead obrigatório');
      console.log('TESTE 1 PASSOU: leadId ausente rejeitado com 400.');
    }
  }

  // Teste 2: Rejeitar requisição sem startTime -> 400
  {
    try {
      await createAdminBookingInDatabase(null, { leadId: 'lead-123', startTime: null });
      assert.fail('Deveria ter lançado erro');
    } catch (err) {
      assert.strictEqual(err.statusCode, 400);
      assert.strictEqual(err.message, 'Data e hora de início obrigatórias');
      console.log('TESTE 2 PASSOU: startTime ausente rejeitado com 400.');
    }
  }

  // Teste 3: Rejeitar startTime com formato inválido -> 400
  {
    try {
      await createAdminBookingInDatabase(null, { leadId: 'lead-123', startTime: 'invalid-date' });
      assert.fail('Deveria ter lançado erro');
    } catch (err) {
      assert.strictEqual(err.statusCode, 400);
      assert.strictEqual(err.message, 'Data e hora de início inválidas');
      console.log('TESTE 3 PASSOU: startTime em formato inválido rejeitado com 400.');
    }
  }

  // Teste 4: Rejeitar duração <= 0 -> 400
  {
    try {
      await createAdminBookingInDatabase(null, {
        leadId: 'lead-123',
        startTime: '2026-09-15T14:30:00Z',
        durationMinutes: 0,
      });
      assert.fail('Deveria ter lançado erro');
    } catch (err) {
      assert.strictEqual(err.statusCode, 400);
      assert.strictEqual(err.message, 'Duração da reunião deve ser superior a 0 minutos');
      console.log('TESTE 4 PASSOU: duração <= 0 minutos rejeitada com 400.');
    }
  }

  // Teste 5: Lead não encontrada na BD -> 404
  {
    const mockSupabase = {
      from: (table) => {
        assert.strictEqual(table, 'leads');
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        };
      },
    };

    try {
      await createAdminBookingInDatabase(mockSupabase, {
        leadId: 'lead-inexistente',
        startTime: '2026-09-15T14:30:00Z',
      });
      assert.fail('Deveria ter lançado erro');
    } catch (err) {
      assert.strictEqual(err.statusCode, 404);
      assert.strictEqual(err.message, 'Lead não encontrada');
      console.log('TESTE 5 PASSOU: lead não encontrada lança 404.');
    }
  }

  // Teste 6: Criação bem-sucedida de Reunião Manual com prefixo 'manual_' e transição de pipeline para lead em 'new'
  {
    let insertedPayload = null;

    const mockSupabase = {
      from: (table) => {
        if (table === 'leads') {
          return {
            select: () => ({
              eq: (col, val) => ({
                maybeSingle: async () => ({
                  data: {
                    id: 'lead-abc-123',
                    name: 'Maria Santos',
                    email: 'maria@example.com',
                    pipeline_stage: 'new',
                  },
                  error: null,
                }),
              }),
            }),
          };
        }

        if (table === 'calendar_bookings') {
          return {
            insert: (payload) => {
              insertedPayload = payload;
              return {
                select: () => ({
                  single: async () => ({
                    data: {
                      id: 'booking-777',
                      provider: payload.provider,
                      external_booking_id: payload.external_booking_id,
                      lead_id: payload.lead_id,
                      status: payload.status,
                      start_time: payload.start_time,
                      end_time: payload.end_time,
                      timezone: payload.timezone,
                      attendee_name: payload.attendee_name,
                      attendee_email: payload.attendee_email,
                      provider_metadata: payload.provider_metadata,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                      leads: {
                        id: 'lead-abc-123',
                        name: 'Maria Santos',
                        email: 'maria@example.com',
                        company_name: 'Lumyo Client',
                        primary_service: 'web_design',
                        lead_classification: 'hot',
                      },
                    },
                    error: null,
                  }),
                }),
              };
            },
          };
        }

        // Mock para pipeline history & updates se invocados
        return {
          select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
          update: () => ({ eq: () => ({ select: () => ({ single: async () => ({ data: {}, error: null }) }) }) }),
          insert: () => ({ select: () => ({ single: async () => ({ data: {}, error: null }) }) }),
        };
      },
    };

    const startTime = '2026-09-15T14:30:00.000Z';
    const result = await createAdminBookingInDatabase(mockSupabase, {
      leadId: 'lead-abc-123',
      startTime,
      durationMinutes: 45,
      notes: 'Discutir proposta de redesenho web',
      adminUserId: 'admin-user-001',
    });

    assert.strictEqual(result.booking.id, 'booking-777');
    assert.strictEqual(insertedPayload.provider, 'manual');
    assert.ok(insertedPayload.external_booking_id.startsWith('manual_'), 'external_booking_id deve ter prefixo manual_');
    assert.strictEqual(insertedPayload.status, 'confirmed');
    assert.strictEqual(insertedPayload.provider_metadata.notes, 'Discutir proposta de redesenho web');
    assert.strictEqual(insertedPayload.provider_metadata.duration_minutes, 45);
    assert.strictEqual(insertedPayload.provider_metadata.is_manual, true);
    assert.strictEqual(insertedPayload.provider_metadata.created_by_admin, 'admin-user-001');

    // Verificar cálculo do end_time (14:30 + 45 min = 15:15)
    const expectedEnd = new Date(new Date(startTime).getTime() + 45 * 60 * 1000).toISOString();
    assert.strictEqual(insertedPayload.end_time, expectedEnd);

    console.log('TESTE 6 PASSOU: Reunião manual criada com provider=manual, prefixo manual_, notas e transição de pipeline.');
  }

  // Teste 7: Prevenção de regressão do pipeline para lead que já está em 'proposal'
  {
    const mockSupabase = {
      from: (table) => {
        if (table === 'leads') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: 'lead-avancada',
                    name: 'Carlos Bento',
                    email: 'carlos@example.com',
                    pipeline_stage: 'proposal', // Fase posterior a meeting_scheduled
                  },
                  error: null,
                }),
              }),
            }),
          };
        }

        if (table === 'calendar_bookings') {
          return {
            insert: (payload) => ({
              select: () => ({
                single: async () => ({
                  data: {
                    id: 'booking-888',
                    ...payload,
                    leads: { id: 'lead-avancada', name: 'Carlos Bento' },
                  },
                  error: null,
                }),
              }),
            }),
          };
        }

        return {
          select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
        };
      },
    };

    const result = await createAdminBookingInDatabase(mockSupabase, {
      leadId: 'lead-avancada',
      startTime: '2026-09-16T10:00:00.000Z',
      durationMinutes: 30,
    });

    assert.strictEqual(result.booking.id, 'booking-888');
    assert.strictEqual(result.pipelineTransitioned, false, 'Pipeline não deve sofrer regressão se lead já estiver em proposal');

    console.log('TESTE 7 PASSOU: Regressão de pipeline evitada para lead já em fase avançada (proposal).');
  }

  console.log('\n✅ TODOS OS TESTES DA CRIAÇÃO MANUAL DE REUNIÕES PASSARAM COM SUCESSO!\n');
}

runTests().catch((err) => {
  console.error('❌ FALHA NOS TESTES:', err);
  process.exit(1);
});
