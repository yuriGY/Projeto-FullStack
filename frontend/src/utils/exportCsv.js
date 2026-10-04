import { lineTypeLabel } from '../services/lineTypes'

const COLUNAS = [
  'Número informado',
  'Formato internacional',
  'Formato local',
  'Situação',
  'País',
  'Código do país',
  'Localidade',
  'Operadora',
  'Tipo de linha',
  'Origem',
  'Consultado em',
]

const SOURCE_LABELS = { api: 'API', cache: 'Cache' }

/** Marca de ordem de bytes do UTF-8, escrita por código para não virar um caractere invisível no fonte. */
const BOM = String.fromCharCode(0xfeff)

function situacao(entry) {
  if (entry.status === 'error') return 'Falha na consulta'
  if (entry.status !== 'success') return 'Pendente'
  return entry.result?.valid ? 'Válido' : 'Inválido'
}

/** Escapa o campo no padrão CSV: aspas duplicadas e cercado quando necessário. */
function campo(valor) {
  const texto = String(valor ?? '')
  if (!/[";\n\r]/.test(texto)) return texto
  return `"${texto.replaceAll('"', '""')}"`
}

function linha(entry) {
  const r = entry.result
  return [
    entry.raw,
    r?.international_format,
    r?.local_format,
    situacao(entry),
    r?.country_name,
    r?.country_code,
    r?.location,
    r?.carrier,
    lineTypeLabel(r?.line_type),
    SOURCE_LABELS[entry.source] ?? entry.source,
    entry.createdAt ? new Date(entry.createdAt).toLocaleString('pt-BR') : '',
  ]
    .map(campo)
    .join(';')
}

export function buildCsv(entries) {
  return [COLUNAS.map(campo).join(';'), ...entries.map(linha)].join('\r\n')
}

export function csvFileName(date = new Date()) {
  const iso = date.toISOString().slice(0, 16).replace('T', '_').replaceAll(':', '-')
  return `validafone_${iso}.csv`
}

/**
 * Dispara o download do CSV.
 *
 * Separador `;` e BOM UTF-8 porque é o que o Excel em português reconhece sem
 * pedir configuração de importação.
 *
 * @returns {number} quantidade de registros exportados
 */
export function downloadCsv(entries) {
  const blob = new Blob([BOM + buildCsv(entries)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = csvFileName()
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  return entries.length
}
