import { accountTypeLabels, type Account } from './types'

export function accountLabel(account: Account, clientName: string) {
  return `${account.number} · ${accountTypeLabels[account.type]} · ${clientName}`
}
