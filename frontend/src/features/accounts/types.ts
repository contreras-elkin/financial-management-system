// Espejo de AccountResponse y CreateAccountRequest del backend.
export const accountTypes = ['SAVINGS', 'CHECKING'] as const

export type AccountType = (typeof accountTypes)[number]

export const accountTypeLabels: Record<AccountType, string> = {
  SAVINGS: 'Ahorros',
  CHECKING: 'Corriente',
}

export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'CANCELLED'

export const accountStatusLabels: Record<AccountStatus, string> = {
  ACTIVE: 'Activa',
  INACTIVE: 'Inactiva',
  CANCELLED: 'Cancelada',
}

export type Account = {
  id: number
  type: AccountType
  number: string
  status: AccountStatus
  balance: number
  gmfExempt: boolean
  clientId: number
  createdAt: string
  updatedAt: string
}

export type OpenAccountInput = {
  clientId: number
  type: AccountType
  gmfExempt: boolean
}

// Cada una corresponde a un endpoint PATCH /accounts/{id}/{acción}.
export type AccountStatusAction = 'activate' | 'inactivate' | 'cancel'
