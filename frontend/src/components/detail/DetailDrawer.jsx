import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Box, Chip, Divider, IconButton, Paper, Stack, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

import { flagEmoji } from '../../services/countries'
import { lineTypeLabel } from '../../services/lineTypes'
import { useValidationDispatch, useValidationState } from '../../state/validationContexts'
import { ACTIONS, selectSelectedEntry } from '../../state/validationReducer'

const SOURCE_LABELS = { api: 'Consulta à API', cache: 'Resultado em cache' }

function Linha({ label, value }) {
  return (
    <Box sx={{ display: 'flex', gap: 2, py: 0.75 }}>
      <Typography variant="body2" color="text.secondary" sx={{ width: 150, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
        {value || '—'}
      </Typography>
    </Box>
  )
}

/**
 * Painel lateral com todos os campos do registro selecionado.
 *
 * Renderizado com `createPortal` em `#portal-root`, um nó irmão de `#root` no
 * index.html. Sair da árvore do DOM evita que qualquer `overflow` ou contexto
 * de empilhamento de um ancestral recorte o painel, mas o componente continua
 * na árvore do React, então segue lendo o estado pelos contextos normalmente.
 */
export default function DetailDrawer() {
  const state = useValidationState()
  const dispatch = useValidationDispatch()
  const entry = selectSelectedEntry(state)

  const fechar = () => dispatch({ type: ACTIONS.SELECT_ENTRY, payload: { id: null } })

  useEffect(() => {
    if (!entry) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') dispatch({ type: ACTIONS.SELECT_ENTRY, payload: { id: null } })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [entry, dispatch])

  const alvo = typeof document === 'undefined' ? null : document.getElementById('portal-root')
  if (!entry || !alvo) return null

  const { result } = entry

  return createPortal(
    <Box
      role="presentation"
      onClick={fechar}
      sx={{ position: 'fixed', inset: 0, zIndex: 1300, bgcolor: 'rgba(0,0,0,0.4)' }}
    >
      <Paper
        role="dialog"
        aria-label="Detalhes do registro"
        onClick={(event) => event.stopPropagation()}
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          height: '100%',
          width: { xs: '100%', sm: 420 },
          p: 3,
          overflowY: 'auto',
          borderRadius: 0,
        }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="h6" component="p" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {result?.international_format || entry.raw}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Informado como {entry.raw}
            </Typography>
          </Box>
          <IconButton onClick={fechar} size="small" aria-label="Fechar">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
          {entry.status === 'error' ? (
            <Chip size="small" color="warning" variant="outlined" label="Falha na consulta" />
          ) : result?.valid ? (
            <Chip size="small" color="success" label="Número válido" />
          ) : (
            <Chip size="small" color="error" variant="outlined" label="Número inválido" />
          )}
          <Chip size="small" variant="outlined" label={SOURCE_LABELS[entry.source] ?? entry.source} />
        </Stack>

        <Divider sx={{ mb: 1 }} />

        {entry.status === 'error' ? (
          <Stack sx={{ pt: 1 }}>
            <Linha label="Erro" value={entry.error?.info} />
            <Linha label="Tipo" value={entry.error?.type} />
            <Linha label="Código" value={entry.error?.code ? String(entry.error.code) : ''} />
          </Stack>
        ) : (
          <Stack sx={{ pt: 1 }}>
            <Linha label="Formato internacional" value={result?.international_format} />
            <Linha label="Formato local" value={result?.local_format} />
            <Linha label="Dígitos enviados" value={result?.number} />
            <Linha
              label="País"
              value={result?.country_name ? `${flagEmoji(result.country_code)} ${result.country_name}` : ''}
            />
            <Linha label="Código do país" value={result?.country_code} />
            <Linha label="Prefixo" value={result?.country_prefix} />
            <Linha label="Localidade" value={result?.location} />
            <Linha label="Operadora" value={result?.carrier} />
            <Linha label="Tipo de linha" value={lineTypeLabel(result?.line_type)} />
          </Stack>
        )}

        <Divider sx={{ my: 1 }} />

        <Linha
          label="Consultado em"
          value={entry.createdAt ? new Date(entry.createdAt).toLocaleString('pt-BR') : ''}
        />
      </Paper>
    </Box>,
    alvo,
  )
}
