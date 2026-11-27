import Chip from '@mui/material/Chip'
import { alpha } from '@mui/material/styles'
import { accountStatusLabels, type AccountStatus } from './types'

const paletteByStatus = {
  ACTIVE: 'success',
  INACTIVE: 'warning',
  CANCELLED: 'grey',
} as const

export function AccountStatusChip({ status }: { status: AccountStatus }) {
  const palette = paletteByStatus[status]
  return (
    <Chip
      size="small"
      label={accountStatusLabels[status]}
      // Fondo tenue y texto oscuro del mismo color: se lee mejor que el chip relleno de MUI.
      sx={(theme) => {
        const main = palette === 'grey' ? theme.palette.grey[600] : theme.palette[palette].main
        const dark = palette === 'grey' ? theme.palette.grey[800] : theme.palette[palette].dark
        return { bgcolor: alpha(main, 0.12), color: dark, fontWeight: 500 }
      }}
    />
  )
}
