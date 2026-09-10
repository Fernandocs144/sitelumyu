import fs from 'fs';
import path from 'path';

let isLoaded = false;

export function loadLocalEnv() {
  if (isLoaded) return;

  const vercelEnv = process.env.VERCEL_ENV;
  const nodeEnv = process.env.NODE_ENV;

  // EXPLICIT SECURITY CHECK:
  // Never load .env.local in 'preview' or 'production' Vercel Cloud deployments.
  if (vercelEnv === 'preview' || vercelEnv === 'production' || nodeEnv === 'production') {
    isLoaded = true;
    return;
  }

  // loadLocalEnv() must run EXCLUSIVELY when process.env.VERCEL_ENV === 'development'
  // (or in local node testing where VERCEL_ENV is undefined and NODE_ENV is not production).
  const isDevelopment = vercelEnv === 'development' || (!vercelEnv && nodeEnv !== 'production');
  if (!isDevelopment) {
    isLoaded = true;
    return;
  }

  const cwd = process.cwd();
  const envCandidates = [
    path.join(cwd, '.env.local'),
    path.join(cwd, 'frontend', '.env.local'),
    path.join(cwd, '..', '.env.local'),
  ];

  for (const envPath of envCandidates) {
    try {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const lines = content.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx > 0) {
              const key = trimmed.substring(0, eqIdx).trim();
              let val = trimmed.substring(eqIdx + 1).trim();
              if (
                (val.startsWith('"') && val.endsWith('"')) ||
                (val.startsWith("'") && val.endsWith("'"))
              ) {
                val = val.slice(1, -1);
              }
              if (key && (!process.env[key] || process.env[key] === '[SENSITIVE]')) {
                process.env[key] = val;
              }
            }
          }
        }
      }
    } catch (e) {
      // Ignore reading errors
    }
  }

  isLoaded = true;
}
