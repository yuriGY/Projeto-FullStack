/**
 * Países oferecidos no seletor do formulário.
 *
 * A Numverify exige `country_code` (ISO 3166-1 alfa-2) sempre que o número é
 * informado em formato local. Números em formato internacional (iniciados por
 * "+") dispensam o parâmetro.
 */
export const COUNTRIES = [
  { code: 'BR', name: 'Brasil', dial: '+55' },
  { code: 'PT', name: 'Portugal', dial: '+351' },
  { code: 'US', name: 'Estados Unidos', dial: '+1' },
  { code: 'CA', name: 'Canadá', dial: '+1' },
  { code: 'AR', name: 'Argentina', dial: '+54' },
  { code: 'CL', name: 'Chile', dial: '+56' },
  { code: 'CO', name: 'Colômbia', dial: '+57' },
  { code: 'MX', name: 'México', dial: '+52' },
  { code: 'UY', name: 'Uruguai', dial: '+598' },
  { code: 'PY', name: 'Paraguai', dial: '+595' },
  { code: 'ES', name: 'Espanha', dial: '+34' },
  { code: 'FR', name: 'França', dial: '+33' },
  { code: 'DE', name: 'Alemanha', dial: '+49' },
  { code: 'IT', name: 'Itália', dial: '+39' },
  { code: 'GB', name: 'Reino Unido', dial: '+44' },
  { code: 'JP', name: 'Japão', dial: '+81' },
  { code: 'AU', name: 'Austrália', dial: '+61' },
]

const BY_CODE = new Map(COUNTRIES.map((country) => [country.code, country]))

export function findCountry(code) {
  return BY_CODE.get(String(code ?? '').toUpperCase()) ?? null
}

export function countryName(code) {
  return findCountry(code)?.name ?? ''
}

/**
 * Converte "BR" no emoji da bandeira somando o offset dos Regional Indicator
 * Symbols (U+1F1E6) à posição de cada letra no alfabeto.
 */
export function flagEmoji(code) {
  const normalized = String(code ?? '').toUpperCase()
  if (!/^[A-Z]{2}$/.test(normalized)) return ''
  const codePoints = [...normalized].map((char) => 0x1f1e6 + char.charCodeAt(0) - 65)
  return String.fromCodePoint(...codePoints)
}
