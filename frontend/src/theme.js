import { createTheme } from '@mui/material/styles'

/**
 * Cores do painel analítico.
 *
 * Os valores saíram do validador de paleta e foram conferidos contra as duas
 * superfícies reais da aplicação (#ffffff no claro, #121212 no escuro):
 *
 * - `bar`: hue único para as distribuições. Uma série, uma cor. Colorir cada
 *   barra de um tom diferente duplicaria o comprimento em matiz sem informar
 *   nada. Passa todas as checagens nos dois modos.
 * - `good` / `warning` / `critical`: paleta de status, fixa nos dois modos.
 *   `warning` fica abaixo de 3:1 no fundo claro por natureza, então todo uso
 *   vem acompanhado de ícone e rótulo, e a cor nunca carrega o significado só.
 */
const VIZ_LIGHT = {
  bar: '#2a78d6',
  track: '#eef1f5',
  good: '#0ca30c',
  warning: '#fab219',
  critical: '#d03b3b',
}

const VIZ_DARK = {
  bar: '#3987e5',
  track: '#2c2c2a',
  good: '#0ca30c',
  warning: '#fab219',
  critical: '#d03b3b',
}

export function buildTheme(mode) {
  const dark = mode === 'dark'

  return createTheme({
    palette: {
      mode,
      primary: { main: dark ? '#5b9bd5' : '#12507e' },
      background: dark ? { default: '#0d0d0d', paper: '#121212' } : { default: '#f3f5f8', paper: '#ffffff' },
      viz: dark ? VIZ_DARK : VIZ_LIGHT,
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },
    },
  })
}
