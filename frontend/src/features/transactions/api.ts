import { http } from '../../shared/api/http'
import type { DepositInput, Transaction, TransferInput, WithdrawalInput } from './types'

const PATH = '/transactions'

export const transactionsApi = {
  listByAccount: (accountId: number) => http.get<Transaction[]>(`/accounts/${accountId}/transactions`),
  deposit: (input: DepositInput) => http.post<Transaction>(`${PATH}/deposits`, input),
  withdraw: (input: WithdrawalInput) => http.post<Transaction>(`${PATH}/withdrawals`, input),
  // Devuelve [débito en el origen, crédito en el destino].
  transfer: (input: TransferInput) => http.post<Transaction[]>(`${PATH}/transfers`, input),
}
