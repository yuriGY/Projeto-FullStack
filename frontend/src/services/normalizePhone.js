/**
 * Normalização da entrada do usuário e validação local.
 *
 * A validação local existe por economia: o plano gratuito da Numverify dá 100
 * consultas por mês, então entradas obviamente inválidas são barradas antes de
 * virarem requisição.
 */

/** Comprimento máximo de um número no padrão E.164. */
const E164_MAX_DIGITS = 15
const MIN_DIGITS = 6

export function onlyDigits(value) {
  return String(value ?? '').replace(/\D/g, '')
}

/** Número em formato internacional dispensa o parâmetro country_code. */
export function isInternational(raw) {
  return String(raw ?? '').trim().startsWith('+')
}

/**
 * Monta exatamente o par de valores que será enviado à API, para que a chave de
 * cache e a requisição nunca saiam de sincronia.
 */
export function buildQuery(raw, countryCode) {
  return {
    number: onlyDigits(raw),
    countryCode: isInternational(raw) ? '' : String(countryCode ?? '').toUpperCase(),
  }
}

/**
 * Chave de cache: "(11) 98765-4321" e "11987654321" no mesmo país geram a mesma
 * entrada, evitando gastar cota duas vezes com o mesmo número.
 */
export function cacheKey(raw, countryCode) {
  const query = buildQuery(raw, countryCode)
  if (!query.number) return ''
  return `${query.countryCode || 'INTL'}:${query.number}`
}

/**
 * @returns {{ ok: boolean, message: string }}
 */
export function validateInput(raw, countryCode) {
  const trimmed = String(raw ?? '').trim()
  if (!trimmed) {
    return { ok: false, message: 'Informe um número de telefone.' }
  }

  const digits = onlyDigits(trimmed)
  if (digits.length < MIN_DIGITS) {
    return { ok: false, message: 'Número curto demais para ser válido.' }
  }
  if (digits.length > E164_MAX_DIGITS) {
    return { ok: false, message: `Número longo demais: o padrão E.164 permite até ${E164_MAX_DIGITS} dígitos.` }
  }
  if (!isInternational(trimmed) && !countryCode) {
    return { ok: false, message: 'Selecione o país ou informe o número no formato internacional (+55...).' }
  }

  return { ok: true, message: '' }
}
