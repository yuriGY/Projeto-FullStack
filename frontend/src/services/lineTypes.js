/** Tradução dos valores de `line_type` devolvidos pela Numverify. */
const LINE_TYPE_LABELS = {
  mobile: 'Celular',
  landline: 'Fixo',
  voip: 'VoIP',
  special_services: 'Serviço especial',
  toll_free: 'Discagem gratuita',
  premium_rate: 'Tarifa premium',
  satellite: 'Satélite',
  paging: 'Pager',
}

export function lineTypeLabel(value) {
  if (!value) return ''
  return LINE_TYPE_LABELS[value] ?? value
}
