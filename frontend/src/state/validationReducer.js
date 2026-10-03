/**
 * Fonte única de verdade da aplicação.
 *
 * Todo o estado compartilhado vive aqui. Nenhum componente mantém cópia de
 * `entries`: o formulário escreve pelo dispatch e as demais áreas derivam o que
 * precisam a partir deste estado. É o que mantém as telas integradas.
 */

export const ACTIONS = {
  ADD_ENTRY: 'ADD_ENTRY',
  REQUEST_START: 'REQUEST_START',
  REQUEST_SUCCESS: 'REQUEST_SUCCESS',
  REQUEST_ERROR: 'REQUEST_ERROR',
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7) // YYYY-MM
}

function quotaLimit() {
  return Number(import.meta.env.VITE_QUOTA_LIMIT) || 100
}

export const initialState = {
  entries: [],
  lastEntryId: null,
  quota: { used: 0, limit: quotaLimit(), month: currentMonth() },
}

/** Zera o consumo quando o mês vira — a cota da apilayer é mensal. */
function rollQuota(quota) {
  const month = currentMonth()
  if (quota?.month === month) return { ...quota, limit: quotaLimit() }
  return { used: 0, limit: quotaLimit(), month }
}

/**
 * Inicializador preguiçoso do useReducer: monta o estado já a partir do que foi
 * persistido, evitando um primeiro render com a lista vazia.
 */
export function createInitialState(persisted) {
  if (!persisted) return initialState

  return {
    ...initialState,
    entries: (persisted.entries ?? []).map((entry) =>
      entry.status === 'loading'
        ? {
            ...entry,
            status: 'error',
            error: { code: null, type: 'interrupted', info: 'Consulta interrompida ao recarregar a página.' },
          }
        : entry,
    ),
    quota: rollQuota(persisted.quota),
  }
}

/** Aplica uma alteração a um registro específico, preservando a ordem da lista. */
function updateEntry(entries, id, changes) {
  return entries.map((entry) => (entry.id === id ? { ...entry, ...changes, updatedAt: Date.now() } : entry))
}

export function validationReducer(state, action) {
  switch (action.type) {
    case ACTIONS.ADD_ENTRY: {
      const entry = action.payload
      return {
        ...state,
        entries: [entry, ...state.entries],
        lastEntryId: entry.id,
      }
    }

    case ACTIONS.REQUEST_START: {
      const { id } = action.payload
      return {
        ...state,
        entries: updateEntry(state.entries, id, { status: 'loading', error: null }),
      }
    }

    case ACTIONS.REQUEST_SUCCESS: {
      const { id, result, source } = action.payload
      return {
        ...state,
        entries: updateEntry(state.entries, id, { status: 'success', result, error: null, source }),
        quota: source === 'api' ? { ...state.quota, used: state.quota.used + 1 } : state.quota,
      }
    }

    case ACTIONS.REQUEST_ERROR: {
      const { id, error, source } = action.payload
      return {
        ...state,
        entries: updateEntry(state.entries, id, { status: 'error', error, result: null }),
        quota:
          source === 'api' && error?.code ? { ...state.quota, used: state.quota.used + 1 } : state.quota,
      }
    }

    default:
      return state
  }
}

export function selectLastEntry(state) {
  if (!state.lastEntryId) return null
  return state.entries.find((entry) => entry.id === state.lastEntryId) ?? null
}

export function selectQuotaRemaining(state) {
  return Math.max(0, state.quota.limit - state.quota.used)
}
