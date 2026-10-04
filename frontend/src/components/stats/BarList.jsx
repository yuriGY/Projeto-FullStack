import { Box, Tooltip, Typography } from '@mui/material'

const LIMITE_ITENS = 6

/**
 * Distribuição por categoria.
 *
 * Uma série, uma cor: todas as barras usam o mesmo azul. Dar um tom diferente a
 * cada categoria duplicaria o comprimento em matiz e gastaria o único canal
 * livre com informação que a barra já mostra.
 *
 * A cauda além de seis categorias é agrupada em "Outros" em vez de gerar mais
 * cores ou uma lista interminável. O valor aparece como rótulo direto ao lado
 * da barra, então o tooltip complementa e nunca é o único jeito de ler o dado.
 */
export default function BarList({ title, items, emptyText = 'Sem dados ainda.' }) {
  if (items.length === 0) {
    return (
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {emptyText}
        </Typography>
      </Box>
    )
  }

  const visiveis = items.slice(0, LIMITE_ITENS)
  const cauda = items.slice(LIMITE_ITENS)
  if (cauda.length > 0) {
    visiveis.push({
      label: `Outros (${cauda.length})`,
      count: cauda.reduce((soma, item) => soma + item.count, 0),
    })
  }

  const maior = visiveis.reduce((max, item) => Math.max(max, item.count), 0)

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {title}
      </Typography>

      {visiveis.map((item) => (
        <Tooltip key={item.label} title={`${item.label}: ${item.count}`} placement="top">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75, minHeight: 24 }}>
            <Typography
              variant="body2"
              sx={{
                width: { xs: 96, sm: 150 },
                flexShrink: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item.label}
            </Typography>

            <Box sx={{ flexGrow: 1, height: 10, bgcolor: 'viz.track', borderRadius: '4px' }}>
              <Box
                sx={{
                  width: `${(item.count / maior) * 100}%`,
                  height: '100%',
                  bgcolor: 'viz.bar',
                  borderRadius: '0 4px 4px 0',
                }}
              />
            </Box>

            <Typography
              variant="body2"
              sx={{ width: 32, flexShrink: 0, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
            >
              {item.count}
            </Typography>
          </Box>
        </Tooltip>
      ))}
    </Box>
  )
}
