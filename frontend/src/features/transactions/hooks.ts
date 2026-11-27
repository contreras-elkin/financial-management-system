import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { accountKeys } from '../accounts/hooks'
import { transactionsApi } from './api'

export const transactionKeys = {
  all: ['transactions'] as const,
  byAccount: (accountId?: number) => [...transactionKeys.all, 'account', accountId ?? 'none'] as const,
}

// Sin cuenta elegida no se consulta nada.
export function useAccountTransactions(accountId?: number) {
  return useQuery({
    queryKey: transactionKeys.byAccount(accountId),
    queryFn: accountId === undefined ? skipToken : () => transactionsApi.listByAccount(accountId),
  })
}

// Un movimiento cambia los saldos, así que también se refrescan las cuentas.
function useInvalidateAfterMovement() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
      queryClient.invalidateQueries({ queryKey: accountKeys.all }),
    ])
}

export function useDeposit() {
  const invalidate = useInvalidateAfterMovement()
  return useMutation({
    mutationFn: transactionsApi.deposit,
    onSuccess: invalidate,
  })
}

export function useWithdraw() {
  const invalidate = useInvalidateAfterMovement()
  return useMutation({
    mutationFn: transactionsApi.withdraw,
    onSuccess: invalidate,
  })
}

export function useTransfer() {
  const invalidate = useInvalidateAfterMovement()
  return useMutation({
    mutationFn: transactionsApi.transfer,
    onSuccess: invalidate,
  })
}
