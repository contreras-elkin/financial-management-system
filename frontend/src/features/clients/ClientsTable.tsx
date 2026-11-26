import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import { formatDate, formatDateTime } from '../../shared/format'
import type { Client } from './types'

type ClientsTableProps = {
  clients: Client[]
  /** Cada acción que se pase aparece como un botón en la fila; sin acciones, la tabla es de solo lectura. */
  onEdit?: (client: Client) => void
  onDelete?: (client: Client) => void
}

/**
 * Componente de presentación: solo pinta los clientes que recibe.
 * No sabe de dónde vienen los datos, así que se reutiliza y se prueba sin HTTP.
 */
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
                    <Button
                      size="small"
                      onClick={() => onEdit(client)}
                      aria-label={`Editar a ${client.firstName} ${client.lastName}`}
                    >
                      Editar
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      size="small"
                      color="error"
                      onClick={() => onDelete(client)}
                      aria-label={`Eliminar a ${client.firstName} ${client.lastName}`}
                    >
                      Eliminar
                    </Button>
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
