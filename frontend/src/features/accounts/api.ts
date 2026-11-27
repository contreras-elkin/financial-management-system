import { http } from '../../shared/api/http'
import type { Account, AccountStatusAction, OpenAccountInput } from './types'

const PATH = '/accounts'

export const accountsApi = {
  list: (clientId?: number) => http.get<Account[]>(clientId === undefined ? PATH : `${PATH}?clientId=${clientId}`),
  open: (input: OpenAccountInput) => http.post<Account>(PATH, input),
  changeStatus: (id: number, action: AccountStatusAction) => http.patch<Account>(`${PATH}/${id}/${action}`),
}
