/**
 * Cliente HTTP da Numverify.
 *
 * Duas particularidades desta API moldam o código abaixo:
 *
 * 1. O plano gratuito é HTTP-only. Uma chave gratuita chamando https:// recebe
 *    o erro 105 ("Subscription Plan does not support HTTPS Encryption"), por
 *    isso o endpoint permanece em http:// e a aplicação roda em localhost.
 * 2. Erro de negócio chega como HTTP 200 com `success: false` no corpo. Ou
 *    seja, `response.ok` não diz se a consulta deu certo — é preciso ler o
 *    corpo antes de tratar o payload como resultado.
 */

const ENDPOINT = 'http://apilayer.net/api/validate'
const DEFAULT_TIMEOUT_MS = 10000

/** Mensagens amigáveis para os códigos conhecidos da apilayer. */
const KNOWN_ERRORS = {
  101: 'Chave de acesso inválida. Confira VITE_NUMVERIFY_KEY em frontend/.env.local.',
  102: 'A conta na apilayer está inativa.',
  103: 'Função de API inexistente.',
  104: 'Cota mensal esgotada — o plano gratuito permite 100 consultas por mês.',
  105: 'O plano gratuito não permite HTTPS. O endpoint precisa continuar em http://.',
  106: 'A API não retornou resultado para esse número.',
  210: 'Nenhum número foi enviado na consulta.',
  211: 'O número informado contém caracteres não numéricos.',
}

export class NumverifyError extends Error {
  constructor({ code = null, type = 'unknown_error', info }) {
    super(info || 'Falha ao consultar a Numverify.')
    this.name = 'NumverifyError'
    this.code = code
    this.type = type
    this.info = this.message
  }
}

/** Garante a forma do resultado mesmo que a API omita algum campo. */
function normalizeResult(payload) {
  return {
    valid: Boolean(payload.valid),
    number: payload.number ?? '',
    local_format: payload.local_format ?? '',
    international_format: payload.international_format ?? '',
    country_prefix: payload.country_prefix ?? '',
    country_code: payload.country_code ?? '',
    country_name: payload.country_name ?? '',
    location: payload.location ?? '',
    carrier: payload.carrier ?? '',
    line_type: payload.line_type ?? '',
  }
}

/**
 * @param {{ number: string, countryCode?: string, signal?: AbortSignal, timeout?: number }} params
 * @returns {Promise<object>} resultado normalizado da Numverify
 * @throws {NumverifyError} falha de rede ou erro reportado pela API
 * @throws {DOMException} AbortError/TimeoutError quando a consulta é cancelada
 */
export async function validatePhone({ number, countryCode, signal, timeout = DEFAULT_TIMEOUT_MS }) {
  const accessKey = import.meta.env.VITE_NUMVERIFY_KEY
  if (!accessKey) {
    throw new NumverifyError({
      type: 'missing_access_key',
      info: 'Nenhuma chave configurada. Preencha VITE_NUMVERIFY_KEY em frontend/.env.local e reinicie o servidor.',
    })
  }

  const url = new URL(ENDPOINT)
  url.searchParams.set('access_key', accessKey)
  url.searchParams.set('number', number)
  if (countryCode) url.searchParams.set('country_code', countryCode)
  url.searchParams.set('format', '1')

  const deadline = AbortSignal.timeout(timeout)
  const combinedSignal = signal ? AbortSignal.any([signal, deadline]) : deadline

  let response
  try {
    response = await fetch(url, { signal: combinedSignal })
  } catch (error) {
    if (error?.name === 'AbortError' || error?.name === 'TimeoutError') throw error
    throw new NumverifyError({
      type: 'network_error',
      info: 'Não foi possível alcançar a API. Verifique a conexão e se a página está em http://localhost.',
    })
  }

  if (!response.ok) {
    throw new NumverifyError({
      type: 'http_error',
      info: `A API respondeu com status ${response.status}.`,
    })
  }

  let payload
  try {
    payload = await response.json()
  } catch {
    throw new NumverifyError({ type: 'invalid_json', info: 'A resposta da API não é um JSON válido.' })
  }

  if (payload?.success === false) {
    const { code, type, info } = payload.error ?? {}
    throw new NumverifyError({ code, type, info: KNOWN_ERRORS[code] ?? info })
  }

  if (typeof payload?.valid === 'undefined') {
    throw new NumverifyError({ type: 'unexpected_payload', info: 'A API respondeu em um formato inesperado.' })
  }

  return normalizeResult(payload)
}
