/**
 * Fonte única de verdade da aplicação.
 *
 * Todo o estado compartilhado vive aqui. Nenhum componente mantém cópia de
 * `entries`: o formulário escreve pelo dispatch e as demais áreas derivam o que
 * precisam a partir deste estado. É o que mantém as telas integradas.
 */

export const ACTIONS = {
  ADD_ENTRY: 'ADD_ENTRY',
  ADD_BATCH: 'ADD_BATCH',
  REQUEST_START: 'REQUEST_START',
  REQUEST_SUCCESS: 'REQUEST_SUCCESS',
  REQUEST_CACHED: 'REQUEST_CACHED',
  REQUEST_ERROR: 'REQUEST_ERROR',
  REMOVE_ENTRY: 'REMOVE_ENTRY',
  CLEAR_HISTORY: 'CLEAR_HISTORY',
  SET_FILTER: 'SET_FILTER',
  SET_SORT: 'SET_SORT',
}

export const EMPTY_FILTERS = {
  text: '',
  country: 'all',
  carrier: 'all',
  lineType: 'all',
  validity: 'all',
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7)
}

function quotaLimit() {
  return Number(import.meta.env.VITE_QUOTA_LIMIT) || 100
}

export const initialState = {
  entries: [],
  lastEntryId: null,
  /** Resultados já obtidos, por número normalizado. Evita gastar cota duas vezes. */
  cache: {},
  /** Ids do lote que ainda não foram processados. */
  queue: [],
  queueTotal: 0,
  quota: { used: 0, limit: quotaLimit(), month: currentMonth() },
  filters: EMPTY_FILTERS,
  sort: { field: 'createdAt', direction: 'desc' },
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
 *
 * Filtros, ordenação e fila não são restaurados de propósito: a sessão começa
 * mostrando o histórico inteiro, e um lote interrompido não faz sentido retomar.
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
    cache: persisted.cache ?? {},
    quota: rollQuota(persisted.quota),
  }
}

/** Aplica uma alteração a um registro específico, preservando a ordem da lista. */
function updateEntry(entries, id, changes) {
  return entries.map((entry) => (entry.id === id ? { ...entry, ...changes, updatedAt: Date.now() } : entry))
}

/**
 * Remove o id da fila do lote. Devolve o estado anterior quando o id não está
 * na fila, para não trocar a referência do array sem necessidade.
 */
function advanceQueue(state, id) {
  if (!state.queue.includes(id)) return { queue: state.queue, queueTotal: state.queueTotal }
  const queue = state.queue.filter((item) => item !== id)
  return { queue, queueTotal: queue.length === 0 ? 0 : state.queueTotal }
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

    case ACTIONS.ADD_BATCH: {
      const { entries } = action.payload
      if (entries.length === 0) return state
      return {
        ...state,
        entries: [...entries, ...state.entries],
        lastEntryId: entries[0].id,
        queue: entries.map((entry) => entry.id),
        queueTotal: entries.length,
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
      const { id, result, source, cacheKey } = action.payload
      return {
        ...state,
        entries: updateEntry(state.entries, id, { status: 'success', result, error: null, source }),
        cache: cacheKey ? { ...state.cache, [cacheKey]: result } : state.cache,
        quota: source === 'api' ? { ...state.quota, used: state.quota.used + 1 } : state.quota,
        ...advanceQueue(state, id),
      }
    }

    case ACTIONS.REQUEST_CACHED: {
      const { id, result } = action.payload
      return {
        ...state,
        entries: updateEntry(state.entries, id, { status: 'success', result, error: null, source: 'cache' }),
        ...advanceQueue(state, id),
      }
    }

    case ACTIONS.REQUEST_ERROR: {
      const { id, error, source } = action.payload
      return {
        ...state,
        entries: updateEntry(state.entries, id, { status: 'error', error, result: null }),
        quota:
          source === 'api' && error?.code ? { ...state.quota, used: state.quota.used + 1 } : state.quota,
        ...advanceQueue(state, id),
      }
    }

    case ACTIONS.REMOVE_ENTRY: {
      const { id } = action.payload
      const entries = state.entries.filter((entry) => entry.id !== id)
      return {
        ...state,
        entries,
        lastEntryId: state.lastEntryId === id ? (entries[0]?.id ?? null) : state.lastEntryId,
        ...advanceQueue(state, id),
      }
    }

    case ACTIONS.CLEAR_HISTORY:
      return { ...state, entries: [], lastEntryId: null, queue: [], queueTotal: 0 }

    case ACTIONS.SET_FILTER: {
      const { key, value } = action.payload
      return { ...state, filters: { ...state.filters, [key]: value } }
    }

    case ACTIONS.SET_SORT: {
      const { field } = action.payload
      const direction = state.sort.field === field && state.sort.direction === 'desc' ? 'asc' : 'desc'
      return { ...state, sort: { field, direction } }
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

export function selectBatchProgress(state) {
  if (state.queueTotal === 0) return null
  return { done: state.queueTotal - state.queue.length, total: state.queueTotal }
}

function matchesText(entry, text) {
  const termo = text.trim().toLowerCase()
  if (!termo) return true
  const campos = [
    entry.raw,
    entry.result?.international_format,
    entry.result?.local_format,
    entry.result?.carrier,
    entry.result?.country_name,
    entry.result?.location,
  ]
  return campos.some((campo) => String(campo ?? '').toLowerCase().includes(termo))
}

function matchesValidity(entry, validity) {
  switch (validity) {
    case 'valid':
      return entry.status === 'success' && entry.result?.valid === true
    case 'invalid':
      return entry.status === 'success' && entry.result?.valid === false
    case 'error':
      return entry.status === 'error'
    default:
      return true
  }
}

export function filterEntries(entries, filters) {
  return entries.filter((entry) => {
    if (!matchesText(entry, filters.text)) return false
    if (!matchesValidity(entry, filters.validity)) return false
    if (filters.country !== 'all' && entry.result?.country_code !== filters.country) return false
    if (filters.carrier !== 'all' && entry.result?.carrier !== filters.carrier) return false
    if (filters.lineType !== 'all' && entry.result?.line_type !== filters.lineType) return false
    return true
  })
}

const SORT_ACCESSORS = {
  createdAt: (entry) => entry.createdAt ?? 0,
  raw: (entry) => entry.raw ?? '',
  country: (entry) => entry.result?.country_name ?? '',
  carrier: (entry) => entry.result?.carrier ?? '',
  lineType: (entry) => entry.result?.line_type ?? '',
  validity: (entry) => (entry.status === 'error' ? 2 : entry.result?.valid ? 0 : 1),
}

export function sortEntries(entries, sort) {
  const accessor = SORT_ACCESSORS[sort.field] ?? SORT_ACCESSORS.createdAt
  const factor = sort.direction === 'asc' ? 1 : -1

  return [...entries].sort((a, b) => {
    const valorA = accessor(a)
    const valorB = accessor(b)
    if (typeof valorA === 'number' && typeof valorB === 'number') {
      return (valorA - valorB) * factor
    }
    return String(valorA).localeCompare(String(valorB), 'pt-BR') * factor
  })
}

/** Monta as opções dos seletores a partir do que existe no histórico. */
export function collectFilterOptions(entries) {
  const countries = new Map()
  const carriers = new Set()
  const lineTypes = new Set()

  for (const entry of entries) {
    const result = entry.result
    if (!result) continue
    if (result.country_code) countries.set(result.country_code, result.country_name || result.country_code)
    if (result.carrier) carriers.add(result.carrier)
    if (result.line_type) lineTypes.add(result.line_type)
  }

  const porNome = (a, b) => a.localeCompare(b, 'pt-BR')

  return {
    countries: [...countries]
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => porNome(a.name, b.name)),
    carriers: [...carriers].sort(porNome),
    lineTypes: [...lineTypes].sort(porNome),
  }
}
