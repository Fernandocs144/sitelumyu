import assert from 'node:assert';

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'dummy-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-service-role-key';

import {
  parseCookieHeader,
  serializeAdminCookies,
  serializeClearAdminCookies,
  verifyAdminSession,
  getRequestHeader,
  parseAdminRequestUrl,
  parseAdminRequestJson,
} from './admin-auth-service.js';

console.log('=== SUITE COMPLETA DE TESTES DA AUTENTICAÇÃO E AUTORIZAÇÃO ADMIN (DUAL COOKIES & SILENT REFRESH) ===\n');

// 1. Teste de atributos de cookies de acesso e refresh
const [accessCookie, refreshCookie] = serializeAdminCookies('access_jwt_123', 'refresh_token_456', true);

assert(accessCookie.includes('lumyo_admin_access=access_jwt_123'), 'TESTE 1A: Cookie access tem token correto');
assert(accessCookie.includes('Path=/;'), 'TESTE 1A: Cookie access tem Path=/');
assert(accessCookie.includes('Max-Age=3600'), 'TESTE 1A: Cookie access tem Max-Age de 1 hora');
assert(accessCookie.includes('HttpOnly'), 'TESTE 1A: Cookie access tem HttpOnly');
assert(accessCookie.includes('Secure'), 'TESTE 1A: Cookie access tem Secure');
assert(accessCookie.includes('SameSite=Lax'), 'TESTE 1A: Cookie access tem SameSite=Lax');

assert(refreshCookie.includes('lumyo_admin_refresh=refresh_token_456'), 'TESTE 1B: Cookie refresh tem token correto');
assert(refreshCookie.includes('Path=/api/admin'), 'TESTE 1B: Cookie refresh tem Path=/api/admin');
assert(refreshCookie.includes('Max-Age=604800'), 'TESTE 1B: Cookie refresh tem Max-Age de 7 dias');
assert(refreshCookie.includes('HttpOnly'), 'TESTE 1B: Cookie refresh tem HttpOnly');
assert(refreshCookie.includes('Secure'), 'TESTE 1B: Cookie refresh tem Secure');
assert(refreshCookie.includes('SameSite=Lax'), 'TESTE 1B: Cookie refresh tem SameSite=Lax');
console.log('TESTE 1 PASSOU: Atributos de ambos os cookies (HttpOnly, Secure, SameSite, Path, Max-Age) estritamente verificados.');

// 2. Teste de limpeza de ambos os cookies no logout
const [clearAccess, clearRefresh] = serializeClearAdminCookies(true);
assert(clearAccess.includes('lumyo_admin_access='), 'TESTE 2A: Limpeza access limpa chave');
assert(clearAccess.includes('Max-Age=0'), 'TESTE 2A: Limpeza access usa Max-Age=0');
assert(clearRefresh.includes('lumyo_admin_refresh='), 'TESTE 2B: Limpeza refresh limpa chave');
assert(clearRefresh.includes('Max-Age=0'), 'TESTE 2B: Limpeza refresh usa Max-Age=0');
console.log('TESTE 2 PASSOU: Limpeza simultânea dos dois cookies HttpOnly verificada.');

// 3. Teste de requisição sem qualquer cookie -> 401
const mockReqNoCookies = new Request('http://localhost/api/admin/auth/check', { headers: {} });
const resNoCookies = await verifyAdminSession(mockReqNoCookies);
assert.strictEqual(resNoCookies.authenticated, false, 'TESTE 3: authenticated=false sem cookies');
assert.strictEqual(resNoCookies.authorized, false, 'TESTE 3: authorized=false sem cookies');
assert.strictEqual(resNoCookies.status, 401, 'TESTE 3: status=401 sem cookies');
console.log('TESTE 3 PASSOU: Requisição sem cookies rejeitada com 401.');

// 4. Teste de access token expirado/inválido sem refresh token -> 401
const mockReqInvalidAccess = new Request('http://localhost/api/admin/auth/check', {
  headers: { cookie: 'lumyo_admin_access=invalid_jwt' },
});
const resInvalidAccess = await verifyAdminSession(mockReqInvalidAccess);
assert.strictEqual(resInvalidAccess.authenticated, false, 'TESTE 4: authenticated=false com access token inválido');
assert.strictEqual(resInvalidAccess.status, 401, 'TESTE 4: status=401 sem refresh token');
console.log('TESTE 4 PASSOU: Access token expirado/inválido sem refresh token devolve 401.');

// 5. Teste de parseCookieHeader
const headerSample = 'lumyo_admin_access=jwt_token_sample; lumyo_admin_refresh=refresh_sample';
assert.strictEqual(parseCookieHeader(headerSample, 'lumyo_admin_access'), 'jwt_token_sample', 'TESTE 5A: Parse access');
assert.strictEqual(parseCookieHeader(headerSample, 'lumyo_admin_refresh'), 'refresh_sample', 'TESTE 5B: Parse refresh');
console.log('TESTE 5 PASSOU: Extrator de cookies de cabeçalho validado.');

// 6. Teste de getRequestHeader com Web Headers, Node object, e malformed
const webReq = new Request('http://localhost/test', { headers: { cookie: 'lumyo_admin_access=web_123', host: 'localhost:3000' } });
assert.strictEqual(getRequestHeader(webReq, 'cookie'), 'lumyo_admin_access=web_123', 'TESTE 6A: Web Headers Cookie');
assert.strictEqual(getRequestHeader(webReq, 'host'), 'localhost:3000', 'TESTE 6A: Web Headers Host');

const nodeReqObj = { headers: { cookie: 'lumyo_admin_access=node_123', Host: 'localhost:3000' } };
assert.strictEqual(getRequestHeader(nodeReqObj, 'cookie'), 'lumyo_admin_access=node_123', 'TESTE 6B: Node req object Cookie');
assert.strictEqual(getRequestHeader(nodeReqObj, 'host'), 'localhost:3000', 'TESTE 6B: Node req object Host case-insensitive');

assert.strictEqual(getRequestHeader(null, 'cookie'), '', 'TESTE 6C: Null request');
assert.strictEqual(getRequestHeader({}, 'cookie'), '', 'TESTE 6C: Empty request');
assert.strictEqual(getRequestHeader({ headers: undefined }, 'cookie'), '', 'TESTE 6C: Undefined headers');
console.log('TESTE 6 PASSOU: getRequestHeader funciona com Web Headers, Node object req e formatos malformados.');

// 7. Teste de verifyAdminSession com Node req object (Sem lançar TypeError: request.headers.get is not a function)
const nodeReqNoCookies = { headers: { host: 'localhost:3000' } };
const resNodeNoCookies = await verifyAdminSession(nodeReqNoCookies);
assert.strictEqual(resNodeNoCookies.authenticated, false, 'TESTE 7: authenticated=false em Node req sem cookies');
assert.strictEqual(resNodeNoCookies.status, 401, 'TESTE 7: status=401 em Node req sem cookies (Sem TypeError)');
console.log('TESTE 7 PASSOU: verifyAdminSession com Node req object processa sem TypeError.');

// 8. Teste de parseAdminRequestUrl (Compatibilidade Web Fetch vs Node/Vercel URL relativo)
const webReqUrl = new Request('http://localhost:3000/api/admin/follow-ups/9144b69c-f3cc-490c-bdd5-bbd55abf5aa2/approve?id=9144b69c-f3cc-490c-bdd5-bbd55abf5aa2');
const parsedWebUrl = parseAdminRequestUrl(webReqUrl);
assert.strictEqual(parsedWebUrl.pathname, '/api/admin/follow-ups/9144b69c-f3cc-490c-bdd5-bbd55abf5aa2/approve', 'TESTE 8A: Pathname Web Fetch');
assert.strictEqual(parsedWebUrl.searchParams.get('id'), '9144b69c-f3cc-490c-bdd5-bbd55abf5aa2', 'TESTE 8A: SearchParams id Web Fetch');

const nodeReqRelativeUrl = {
  url: '/api/admin/follow-ups/9144b69c-f3cc-490c-bdd5-bbd55abf5aa2/approve?id=9144b69c-f3cc-490c-bdd5-bbd55abf5aa2',
  headers: { host: 'localhost:3000' }
};
const parsedNodeUrl = parseAdminRequestUrl(nodeReqRelativeUrl);
assert.strictEqual(parsedNodeUrl.pathname, '/api/admin/follow-ups/9144b69c-f3cc-490c-bdd5-bbd55abf5aa2/approve', 'TESTE 8B: Pathname Node URL relativo');
assert.strictEqual(parsedNodeUrl.searchParams.get('id'), '9144b69c-f3cc-490c-bdd5-bbd55abf5aa2', 'TESTE 8B: SearchParams id Node URL relativo');

const fallbackUrl = parseAdminRequestUrl(null);
assert.strictEqual(fallbackUrl.pathname, '/', 'TESTE 8C: Fallback para null request');

console.log('TESTE 8 PASSOU: parseAdminRequestUrl suporta Web Request absoluto, Node URL relativo e fallbacks sem lançar exceções.');

// 9. Teste de parseAdminRequestJson (Compatibilidade Web Fetch Request vs Node req object vs Buffer vs Invalid JSON)
const webReqJson = new Request('http://localhost/test', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ subject: 'Assunto Teste', body: 'Conteúdo da mensagem', generation_source: 'manual' }),
});
const parsedWebJson = await parseAdminRequestJson(webReqJson);
assert.strictEqual(parsedWebJson.subject, 'Assunto Teste', 'TESTE 9A: Web Fetch Request subject');
assert.strictEqual(parsedWebJson.body, 'Conteúdo da mensagem', 'TESTE 9A: Web Fetch Request body');

const nodeReqObject = {
  body: { subject: 'Assunto Node Obj', body: 'Mensagem Node Obj', generation_source: 'manual' }
};
const parsedNodeObj = await parseAdminRequestJson(nodeReqObject);
assert.strictEqual(parsedNodeObj.subject, 'Assunto Node Obj', 'TESTE 9B: Node req.body objeto');

const nodeReqString = {
  body: JSON.stringify({ subject: 'Assunto Node String', body: 'Mensagem Node String' })
};
const parsedNodeStr = await parseAdminRequestJson(nodeReqString);
assert.strictEqual(parsedNodeStr.subject, 'Assunto Node String', 'TESTE 9C: Node req.body string');

const nodeReqBuffer = {
  body: Buffer.from(JSON.stringify({ subject: 'Assunto Buffer', body: 'Mensagem Buffer' }))
};
const parsedBuffer = await parseAdminRequestJson(nodeReqBuffer);
assert.strictEqual(parsedBuffer.subject, 'Assunto Buffer', 'TESTE 9D: Node req.body Buffer');

const emptyReq = { body: '' };
const parsedEmpty = await parseAdminRequestJson(emptyReq);
assert.deepStrictEqual(parsedEmpty, {}, 'TESTE 9E: Body vazio retorna objeto vazio {}');

let invalidJsonCaught = false;
try {
  await parseAdminRequestJson({ body: '{ malformed json: true ' });
} catch (err) {
  invalidJsonCaught = true;
}
assert.strictEqual(invalidJsonCaught, true, 'TESTE 9F: JSON malformado lança erro para ser capturado com HTTP 400');

console.log('TESTE 9 PASSOU: parseAdminRequestJson valida Web Request, Node req.body (objeto/string/Buffer), body vazio e JSON malformado.');

console.log('\n=== TODOS OS TESTES DA FUNDAÇÃO ADMIN PASSARAM COM SUCESSO ===');
