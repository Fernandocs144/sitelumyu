/**
 * FASE D — ZOHO MAIL API CLIENT (EU DATACENTER)
 *
 * Cliente isolado server-side para interagir com a API de Zoho Mail (EU).
 * Suporta atualização de Access Token via Refresh Token e operações de leitura (Accounts, Folders, Messages).
 */

export async function refreshZohoAccessToken({ clientId, clientSecret, refreshToken }) {
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Configuração Zoho em falta: clientId, clientSecret e refreshToken são obrigatórios.');
  }

  const tokenUrl = 'https://accounts.zoho.eu/oauth/v2/token';
  const bodyParams = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: bodyParams.toString(),
  });

  if (!response.ok) {
    const errText = await response.text();
    let sanitizedMsg = 'Falha ao renovar access token no Zoho EU';
    try {
      const parsed = JSON.parse(errText);
      if (parsed.error) sanitizedMsg = `Zoho Token Refresh Error: ${parsed.error}`;
    } catch (_) {}
    throw new Error(sanitizedMsg);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`Zoho Token Refresh Error: ${data.error}`);
  }

  if (!data.access_token) {
    throw new Error('Resposta do Zoho Token Refresh não incluiu access_token.');
  }

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in || 3600,
  };
}

export async function getZohoAccounts({ accessToken }) {
  if (!accessToken) throw new Error('accessToken é obrigatório em getZohoAccounts');

  const url = 'https://mail.zoho.eu/api/v2/accounts';
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Erro na API Zoho Mail (Accounts): HTTP ${response.status}`);
  }

  const data = await response.json();
  return data?.data || [];
}

export async function getZohoFolders({ accessToken, accountId }) {
  if (!accessToken || !accountId) {
    throw new Error('accessToken e accountId são obrigatórios em getZohoFolders');
  }

  const url = `https://mail.zoho.eu/api/v2/accounts/${accountId}/folders`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Erro na API Zoho Mail (Folders): HTTP ${response.status}`);
  }

  const data = await response.json();
  return data?.data || [];
}

export async function getZohoInboxMessages({ accessToken, accountId, folderId, limit = 50, start = 1 }) {
  if (!accessToken || !accountId) {
    throw new Error('accessToken e accountId são obrigatórios em getZohoInboxMessages');
  }

  let url = `https://mail.zoho.eu/api/v2/accounts/${accountId}/messages?limit=${limit}&start=${start}`;
  if (folderId) {
    url += `&folderId=${folderId}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Erro na API Zoho Mail (Messages): HTTP ${response.status}`);
  }

  const data = await response.json();
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.messages)) return data.data.messages;
  return [];
}
