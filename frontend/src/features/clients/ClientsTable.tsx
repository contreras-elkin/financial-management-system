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
  /** Si se pasa, cada fila muestra la acción de editar. */
  onEdit?: (client: Client) => void
}

/**
 * Componente de presentación: solo pinta los clientes que recibe.
 * No sabe de dónde vienen los datos, así que se reutiliza y se prueba sin HTTP.
 */
export function ClientsTable({ clients, onEdit }: ClientsTableProps) {
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
            <TableCell>Última modificación</TableCell>
            {onEdit && <TableCell align="right">Acciones</TableCell>}
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
              <TableCell>{formatDateTime(client.updatedAt)}</TableCell>
              {onEdit && (
                <TableCell align="right">
                  <Button
                    size="small"
                    onClick={() => onEdit(client)}
                    aria-label={`Editar a ${client.firstName} ${client.lastName}`}
                  >
                    Editar
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
