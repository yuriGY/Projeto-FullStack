import { forwardRef } from 'react'
import { InputAdornment, TextField } from '@mui/material'

/**
 * Campo de telefone.
 *
 * Envolvido em `forwardRef` para que o formulário alcance o <input> real e
 * devolva o foco depois de enviar, permitindo encadear várias consultas sem
 * tocar no mouse. Sem o forwardRef, a ref pararia neste componente e não
 * chegaria ao elemento do DOM.
 */
const PhoneInput = forwardRef(function PhoneInput(
  { value, onChange, helperText, error = false, disabled = false, prefix = '' },
  ref,
) {
  return (
    <TextField
      inputRef={ref}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      label="Número de telefone"
      placeholder="11987654321"
      error={error}
      helperText={helperText}
      disabled={disabled}
      fullWidth
      slotProps={
        prefix
          ? { input: { startAdornment: <InputAdornment position="start">{prefix}</InputAdornment> } }
          : undefined
      }
    />
  )
})

export default PhoneInput
