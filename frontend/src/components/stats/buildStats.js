/**
 * Agregações do painel analítico.
 *
 * Fica neste módulo, e não em `state/`, porque só o StatsPanel importa, assim
 * o código entra no chunk carregado sob demanda pelo `lazy`, em vez de pesar no
 * bundle inicial.
 */

function contar(entries, acessar) {
  const mapa = new Map()
  for (const entry of entries) {
    const chave = acessar(entry)
    if (!chave) continue
    mapa.set(chave, (mapa.get(chave) ?? 0) + 1)
  }
  return [...mapa]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'pt-BR'))
}

export function buildStats(entries) {
  const validos = entries.filter((entry) => entry.status === 'success' && entry.result?.valid === true).length
  const invalidos = entries.filter((entry) => entry.status === 'success' && entry.result?.valid === false).length
  const falhas = entries.filter((entry) => entry.status === 'error').length
  const respondidos = validos + invalidos

  return {
    total: entries.length,
    validos,
    invalidos,
    falhas,
    /** Proporção de válidos entre os números que a API conseguiu avaliar. */
    taxaValidade: respondidos === 0 ? null : validos / respondidos,
    viaApi: entries.filter((entry) => entry.source === 'api').length,
    viaCache: entries.filter((entry) => entry.source === 'cache').length,
    porPais: contar(entries, (entry) => entry.result?.country_name),
    porOperadora: contar(entries, (entry) => entry.result?.carrier),
    porTipoLinha: contar(entries, (entry) => entry.result?.line_type),
  }
}
