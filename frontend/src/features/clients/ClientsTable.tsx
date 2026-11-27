import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tooltip from '@mui/material/Tooltip'
import { formatDate, formatDateTime } from '../../shared/format'
import type { Client } from './types'

type ClientsTableProps = {
  clients: Client[]
  // Sin acciones, la tabla es de solo lectura.
  onEdit?: (client: Client) => void
  onDelete?: (client: Client) => void
}

export function ClientsTable({ clients, onEdit, onDelete }: ClientsTableProps) {
  const hasActions = onEdit !== undefined || onDelete !== undefined

  return (
    <TableContainer component={Paper}>
      <Table aria-label="Clientes">
        <TableHead>
          <TableRow>
            <TableCell>Identificación</TableCell>
            <TableCell>Nombres</TableCell>
            <TableCell>Apellidos</TableCell>
            <TableCell>Correo electrónico</TableCell>
            <TableCell>Fecha de nacimiento</TableCell>
            <TableCell>Fecha de creación</TableCell>
            <TableCell>Última modificación</TableCell>
            {hasActions && <TableCell align="right">Acciones</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id} hover>
              <TableCell>
                {client.identificationType} {client.identificationNumber}
              </TableCell>
              <TableCell>{client.firstName}</TableCell>
              <TableCell>{client.lastName}</TableCell>
              <TableCell>{client.email}</TableCell>
              <TableCell>{formatDate(client.birthDate)}</TableCell>
              <TableCell>{formatDateTime(client.createdAt)}</TableCell>
              <TableCell>{formatDateTime(client.updatedAt)}</TableCell>
              {hasActions && (
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  {onEdit && (
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        onClick={() => onEdit(client)}
                        aria-label={`Editar a ${client.firstName} ${client.lastName}`}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {onDelete && (
                    <Tooltip title="Eliminar">
                      <IconButton
                        size="small"
                        onClick={() => onDelete(client)}
                        aria-label={`Eliminar a ${client.firstName} ${client.lastName}`}
                        sx={{ '&:hover': { color: 'error.main' } }}
                      >
                        <DeleteOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
