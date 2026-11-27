// Espejo de TransactionResponse y de los requests de movimientos del backend.
export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER'

export const transactionTypeLabels: Record<TransactionType, string> = {
  DEPOSIT: 'Consignación',
  WITHDRAWAL: 'Retiro',
  TRANSFER: 'Transferencia',
}

export type TransactionDirection = 'CREDIT' | 'DEBIT'

export type Transaction = {
  id: number
  accountId: number
  type: TransactionType
  direction: TransactionDirection
  amount: number
  balanceAfter: number
  counterpartyAccountId: number | null
  reference: string
  createdAt: string
}

export type DepositInput = {
  accountId: number
  amount: number
}

export type WithdrawalInput = DepositInput

export type TransferInput = {
  sourceAccountId: number
  targetAccountId: number
  amount: number
}
