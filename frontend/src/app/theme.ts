import { createTheme } from '@mui/material/styles'
import { esES } from '@mui/material/locale'

const borderColor = '#e5e7eb'

export const theme = createTheme(
  {
    palette: {
      primary: { main: '#3f51b5' },
      secondary: { main: '#00897b' },
      background: { default: '#f5f6f8' },
      divider: borderColor,
    },
    shape: { borderRadius: 8 },
    typography: {
      fontFamily: '"Inter Variable", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: { fontSize: '1.75rem', fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
      },
      // Solo la elevación por defecto (tablas y tarjetas): diálogos y menús conservan su sombra.
      MuiPaper: {
        variants: [
          {
            props: { elevation: 1 },
            style: { boxShadow: 'none', border: `1px solid ${borderColor}` },
          },
        ],
      },
      MuiTableCell: {
        styleOverrides: {
          head: { backgroundColor: '#f3f4f6', color: '#5f6368', fontWeight: 600 },
        },
      },
    },
  },
  esES,
)
