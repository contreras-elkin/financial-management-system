import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { accountsApi } from './api'
import type { AccountStatusAction } from './types'

// Las listas filtradas cuelgan de 'all': invalidar 'all' las refresca todas.
export const accountKeys = {
  all: ['accounts'] as const,
  list: (clientId?: number) => [...accountKeys.all, 'list', clientId ?? 'all'] as const,
}

export function useAccounts(clientId?: number) {
  return useQuery({
    queryKey: accountKeys.list(clientId),
    queryFn: () => accountsApi.list(clientId),
  })
}

function useInvalidateAccounts() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: accountKeys.all })
}

export function useOpenAccount() {
  const invalidate = useInvalidateAccounts()
  return useMutation({
    mutationFn: accountsApi.open,
    onSuccess: invalidate,
  })
}

export function useChangeAccountStatus() {
  const invalidate = useInvalidateAccounts()
  return useMutation({
    mutationFn: ({ id, action }: { id: number; action: AccountStatusAction }) => accountsApi.changeStatus(id, action),
    onSuccess: invalidate,
  })
}
