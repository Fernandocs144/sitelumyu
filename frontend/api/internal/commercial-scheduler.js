import { createClient } from '@supabase/supabase-js';
import { loadLocalEnv } from '../_lib/env.js';
import { runCommercialScheduler } from '../../server/scheduler/commercial-scheduler-service.js';

export const config = {
  maxDuration: 60
};

/**
 * FASE 8 / STEP 11 — VERCEL CRON COMMERCIAL SCHEDULER ENDPOINT
 *
 * Endpoint privado para acionamento automático agendado do motor comercial.
 * Exige obrigatoriamente autenticação 'Authorization: Bearer <CRON_SECRET>'
 * e executa com dryRun: false, enableAutomaticTasks: true, enableAutomaticOutbound: true.
 */
export async function handleCommercialSchedulerCron(request) {
  loadLocalEnv();

  // 1. Método HTTP restrito a GET
  const method = request?.method || 'GET';
  if (method.toUpperCase() !== 'GET') {
    return Response.json(
      { ok: false, error: 'Método não permitido.' },
      { status: 405, headers: { Allow: 'GET', 'Cache-Control': 'no-store' } }
    );
  }

  // 2. Validação estrita do CRON_SECRET no servidor (Fail-Closed)
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || !cronSecret.trim()) {
    console.error('[Commercial Scheduler Cron] CRON_SECRET não configurado no servidor (FAIL-CLOSED).');
    return Response.json(
      { ok: false, error: 'Configuração do servidor incompleta.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // 3. Validação do Header Authorization
  let authHeader = null;
  if (request?.headers) {
    if (typeof request.headers.get === 'function') {
      authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    } else if (typeof request.headers === 'object') {
      authHeader = request.headers.authorization || request.headers.Authorization || request.headers['authorization'];
    }
  }

  const expectedAuth = `Bearer ${cronSecret.trim()}`;
  if (!authHeader || authHeader.trim() !== expectedAuth) {
    return Response.json(
      { ok: false, error: 'Acesso não autorizado.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // 4. Iniciar cliente Supabase com Service Role
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[Commercial Scheduler Cron] Credenciais Supabase Service Role não configuradas.');
    return Response.json(
      { ok: false, error: 'Erro de configuração da base de dados.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const metrics = await runCommercialScheduler({
      supabaseClient,
      dryRun: false,
      enableAutomaticTasks: true,
      enableAutomaticOutbound: true
    });

    return Response.json(
      { ok: true, metrics },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    console.error('[Commercial Scheduler Cron] Erro durante a execução do scheduler:', err.message);
    return Response.json(
      { ok: false, error: 'Falha na execução do scheduler.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

export default async function handler(req, res) {
  if (req && typeof req.json === 'function' && !res) {
    return handleCommercialSchedulerCron(req);
  }

  if (!res || typeof res.status !== 'function') {
    return handleCommercialSchedulerCron(req);
  }

  loadLocalEnv();

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(405).json({ ok: false, error: 'Método não permitido.' });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || !cronSecret.trim()) {
    console.error('[Commercial Scheduler Cron] CRON_SECRET não configurado no servidor (FAIL-CLOSED).');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(500).json({ ok: false, error: 'Configuração do servidor incompleta.' });
  }

  const authHeader = req.headers.authorization || req.headers.Authorization || req.headers['authorization'];
  const expectedAuth = `Bearer ${cronSecret.trim()}`;

  if (!authHeader || authHeader.trim() !== expectedAuth) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(401).json({ ok: false, error: 'Acesso não autorizado.' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[Commercial Scheduler Cron] Credenciais Supabase Service Role não configuradas.');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(500).json({ ok: false, error: 'Erro de configuração da base de dados.' });
  }

  try {
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const metrics = await runCommercialScheduler({
      supabaseClient,
      dryRun: false,
      enableAutomaticTasks: true,
      enableAutomaticOutbound: true
    });

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ ok: true, metrics });
  } catch (err) {
    console.error('[Commercial Scheduler Cron] Erro durante a execução do scheduler:', err.message);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(500).json({ ok: false, error: 'Falha na execução do scheduler.' });
  }
}
