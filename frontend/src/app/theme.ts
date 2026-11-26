import { createTheme } from '@mui/material/styles'
import { esES } from '@mui/material/locale'

export const theme = createTheme(
  {
    palette: {
      primary: { main: '#0d47a1' },
      secondary: { main: '#00897b' },
      background: { default: '#f5f7fa' },
    },
    shape: { borderRadius: 8 },
  },
  esES,
)
