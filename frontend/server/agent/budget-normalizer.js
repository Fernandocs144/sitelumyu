/**
 * Normalizador determinístico de orçamentos brutos (stated_budget_raw) para o Agente Comercial Lumyo.
 * Função pura, síncrona e sem efeitos secundários.
 */

const PERIOD_MONTHLY_PATTERNS = [
  /(?:^|\W)por\s+mês(?:$|\W)/i,
  /(?:^|\W)ao\s+mês(?:$|\W)/i,
  /(?:^|\W)mensais(?:$|\W)/i,
  /(?:^|\W)mensal(?:$|\W)/i,
  /\/\s*mês(?:$|\W)/i,
  /\/\s*mes(?:$|\W)/i,
  /(?:^|\W)per\s+month(?:$|\W)/i,
  /(?:^|\W)monthly(?:$|\W)/i,
  /\/\s*month(?:$|\W)/i,
];

const PERIOD_PROJECT_PATTERNS = [
  /(?:^|\W)pelo\s+projeto(?:$|\W)/i,
  /(?:^|\W)pelo\s+projecto(?:$|\W)/i,
  /(?:^|\W)para\s+o\s+projeto(?:$|\W)/i,
  /(?:^|\W)para\s+o\s+projecto(?:$|\W)/i,
  /(?:^|\W)orçamento\s+total(?:$|\W)/i,
  /(?:^|\W)orçamento\s+global(?:$|\W)/i,
  /(?:^|\W)valor\s+total(?:$|\W)/i,
  /(?:^|\W)one-off(?:$|\W)/i,
  /(?:^|\W)one\s+time(?:$|\W)/i,
  /(?:^|\W)per\s+project(?:$|\W)/i,
];

const OPEN_BOUND_PATTERNS = [
  /(?:^|\W)até(?:$|\W)/i,
  /(?:^|\W)no\s+máximo(?:$|\W)/i,
  /(?:^|\W)menos\s+de(?:$|\W)/i,
  /(?:^|\W)a\s+partir\s+de(?:$|\W)/i,
  /(?:^|\W)mais\s+de(?:$|\W)/i,
  /(?:^|\W)acima\s+de(?:$|\W)/i,
  /(?:^|\W)mínimo\s+de(?:$|\W)/i,
  /(?:^|\W)up\s+to(?:$|\W)/i,
  /(?:^|\W)max(?:$|\W)/i,
  /(?:^|\W)at\s+least(?:$|\W)/i,
  /(?:^|\W)more\s+than(?:$|\W)/i,
  /(?:^|\W)less\s+than(?:$|\W)/i,
];

const OTHER_CURRENCY_PATTERNS = [
  /\$/,
  /(?:^|\W)USD(?:$|\W)/i,
  /(?:^|\W)dólar/i,
  /(?:^|\W)dolares/i,
  /(?:^|\W)dólares/i,
  /£/,
  /(?:^|\W)GBP(?:$|\W)/i,
  /(?:^|\W)libra/i,
  /(?:^|\W)libras/i,
  /R\$/,
  /(?:^|\W)BRL(?:$|\W)/i,
  /(?:^|\W)reais/i,
  /¥/,
  /(?:^|\W)JPY(?:$|\W)/i,
  /(?:^|\W)yen/i,
  /(?:^|\W)CHF(?:$|\W)/i,
];

const EUR_MARKERS_PATTERN = /(?:€|\bEUR\b|\beuros?\b)/gi;

function stripEurMarkers(str) {
  return str.replace(EUR_MARKERS_PATTERN, '').trim();
}

function detectPeriod(text, primaryService) {
  for (const pattern of PERIOD_MONTHLY_PATTERNS) {
    if (pattern.test(text)) return 'monthly';
  }
  for (const pattern of PERIOD_PROJECT_PATTERNS) {
    if (pattern.test(text)) return 'project';
  }

  if (primaryService === 'digital_growth') {
    return 'monthly';
  }
  if (
    primaryService === 'websites' ||
    primaryService === 'automation' ||
    primaryService === 'ai'
  ) {
    return 'project';
  }

  return 'unknown';
}

function parseSingleNumberToken(token) {
  if (!token) return null;
  let str = token.trim();

  // Remover apenas os marcadores EUR aceites antes de processar sufixos e separadores
  str = stripEurMarkers(str);

  let multiplier = 1;
  const kMatch = str.match(/^([0-9.,]+)\s*k$/i);
  if (kMatch) {
    multiplier = 1000;
    str = kMatch[1];
  } else {
    const milMatch = str.match(/^([0-9.,]+)\s*(mil|milhares)$/i);
    if (milMatch) {
      multiplier = 1000;
      str = milMatch[1];
    }
  }

  str = str.replace(/\s+/g, '');

  if (/^\d{1,3}(\.\d{3})+,\d+$/.test(str)) {
    // Ex: 1.200,50 -> 1200.50
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(str)) {
    // Ex: 1.200 -> 1200 ou 10.000 -> 10000
    str = str.replace(/\./g, '');
  } else if (/^\d+,\d+$/.test(str)) {
    // Ex: 1200,50 -> 1200.50
    str = str.replace(',', '.');
  }

  const num = Number(str);
  if (isNaN(num)) return null;

  return num * multiplier;
}

function isPrecededByNumberToken(leftText) {
  // O texto imediatamente à esquerda do hífen tem de terminar com um token numérico positivo
  // ex: "1000", "1k", "1.000 €", "1.000 EUR", "1 mil euros"
  return /(?:[0-9.,]+\s*(?:k|mil|milhares)?(?:\s*(?:€|\bEUR\b|\beuros?\b))?)\s*$/i.test(leftText);
}

function hasNegativeNumber(text) {
  const matches = text.matchAll(/-\s*\d+/g);
  for (const match of matches) {
    const index = match.index;
    const leftText = text.slice(0, index);
    if (!isPrecededByNumberToken(leftText)) {
      return true;
    }
  }
  return false;
}

export function normalizeBudget(rawBudget, primaryService) {
  const result = {
    min: null,
    max: null,
    currency: null,
    period: 'unknown',
    status: 'ambiguous',
    source: 'model_extracted',
  };

  if (typeof rawBudget !== 'string') {
    return result;
  }

  const clean = rawBudget.trim();
  if (clean.length === 0) {
    return result;
  }

  // 1. Verificar periodicidade
  const period = detectPeriod(clean, primaryService);
  result.period = period;

  // 2. Verificar se contém moedas não suportadas (dólar, libra, etc.)
  for (const pattern of OTHER_CURRENCY_PATTERNS) {
    if (pattern.test(clean)) {
      result.status = 'invalid';
      return result;
    }
  }

  // 3. Verificar se há número negativo (sem confundir com hífen de intervalo)
  if (hasNegativeNumber(clean)) {
    result.status = 'invalid';
    return result;
  }

  // 4. Detetar se tem moeda em EUR ou se assume EUR por omissão
  const hasEurSymbol = /€|\bEUR\b|\beuros?\b/i.test(clean);

  // 5. Verificar se contém palavras de limites abertos (até 2000, a partir de 1000, etc.)
  let isOpenBound = false;
  for (const pattern of OPEN_BOUND_PATTERNS) {
    if (pattern.test(clean)) {
      isOpenBound = true;
      break;
    }
  }

  // 6. Extrair intervalos explícitos primeiro (ex: "1000 - 2000", "1k-2k", "1.000 a 2.000", "1.000 EUR - 2.000 EUR", "entre 1000 e 2000")
  const rangeMatch = clean.match(
    /(?:entre|de)?\s*([0-9.,]+\s*(?:k|mil|milhares)?(?:\s*(?:€|\bEUR\b|\beuros?\b))?)\s*(?:a|até|-|e|to)\s*([0-9.,]+\s*(?:k|mil|milhares)?(?:\s*(?:€|\bEUR\b|\beuros?\b))?)/i
  );

  if (rangeMatch) {
    const val1 = parseSingleNumberToken(rangeMatch[1]);
    const val2 = parseSingleNumberToken(rangeMatch[2]);

    if (val1 !== null && val2 !== null) {
      if (val1 < 0 || val2 < 0 || val2 < val1) {
        result.status = 'invalid';
        return result;
      }

      result.min = val1;
      result.max = val2;
      result.currency = 'EUR';
      result.status = 'normalized';
      return result;
    }
  }

  // 7. Procurar valor único ou lista de números (fallback)
  const numberTokens = clean.match(/([0-9.,]+\s*(?:k|mil|milhares)?)/gi);

  if (numberTokens && numberTokens.length > 0) {
    const parsedValues = numberTokens
      .map(parseSingleNumberToken)
      .filter((v) => v !== null && !isNaN(v));

    if (parsedValues.some((v) => v < 0)) {
      result.status = 'invalid';
      return result;
    }

    if (parsedValues.length === 1) {
      const singleVal = parsedValues[0];

      if (isOpenBound) {
        result.status = 'ambiguous';
        result.currency = 'EUR';
        return result;
      }

      result.min = singleVal;
      result.max = singleVal;
      result.currency = 'EUR';
      result.status = 'normalized';
      return result;
    } else if (parsedValues.length === 2) {
      const [v1, v2] = parsedValues;
      if (v2 < v1) {
        result.status = 'invalid';
        return result;
      }

      if (isOpenBound) {
        result.status = 'ambiguous';
        result.currency = 'EUR';
        return result;
      }

      result.min = v1;
      result.max = v2;
      result.currency = 'EUR';
      result.status = 'normalized';
      return result;
    } else if (parsedValues.length > 2) {
      result.status = 'invalid';
      return result;
    }
  }

  // 8. Se for texto sem números reconhecíveis (ex: "ainda não sabemos", "depende", "o mais barato possível")
  result.status = 'ambiguous';
  result.currency = hasEurSymbol ? 'EUR' : null;
  return result;
}
