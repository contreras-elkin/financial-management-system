import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import { formatCurrency, formatDateTime } from '../../shared/format'
import { transactionTypeLabels, type Transaction } from './types'

type TransactionsTableProps = {
  transactions: Transaction[]
  accountNumber: (accountId: number) => string
}

export function TransactionsTable({ transactions, accountNumber }: TransactionsTableProps) {
  return (
    <TableContainer component={Paper}>
      <Table aria-label="Movimientos">
        <TableHead>
          <TableRow>
            <TableCell>Fecha</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell>Contraparte</TableCell>
            <TableCell align="right">Monto</TableCell>
            <TableCell align="right">Saldo</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map((transaction) => {
            const isCredit = transaction.direction === 'CREDIT'
            return (
              <TableRow key={transaction.id} hover>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(transaction.createdAt)}</TableCell>
                <TableCell>{typeLabel(transaction)}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>
                  {transaction.counterpartyAccountId === null ? '—' : accountNumber(transaction.counterpartyAccountId)}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ whiteSpace: 'nowrap', fontWeight: 500, color: isCredit ? 'success.main' : 'error.main' }}
                >
                  {isCredit ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  {formatCurrency(transaction.balanceAfter)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

// En una transferencia la dirección dice si la cuenta envió o recibió el dinero.
function typeLabel(transaction: Transaction) {
  if (transaction.type !== 'TRANSFER') return transactionTypeLabels[transaction.type]
  return transaction.direction === 'DEBIT' ? 'Transferencia enviada' : 'Transferencia recibida'
}
