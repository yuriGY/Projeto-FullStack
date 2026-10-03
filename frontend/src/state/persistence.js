/**
 * Persistência do estado em localStorage.
 *
 * Todo acesso é protegido: o storage pode estar indisponível (aba anônima,
 * cookies de site bloqueados) ou cheio. Nesses casos a aplicação continua
 * funcionando, apenas sem lembrar do histórico entre sessões.
 */

const STORAGE_KEY = 'validafone:state:v1'

export function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.entries)) return null

    return parsed
  } catch {
    return null
  }
}

export function saveState(state) {
  try {
    const snapshot = {
      entries: state.entries,
      quota: state.quota,
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
      }
}
