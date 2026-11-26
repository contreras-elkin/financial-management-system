import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { clientsApi } from './api'
import type { UpdateClientInput } from './types'

/**
 * Claves de caché de los clientes. Centralizarlas evita escribir el mismo arreglo
 * en varios sitios y que una invalidación no coincida con la consulta.
 */
export const clientKeys = {
  all: ['clients'] as const,
}

export function useClients() {
  return useQuery({
    queryKey: clientKeys.all,
    queryFn: clientsApi.list,
  })
}

/**
 * Después de cada mutación exitosa se invalida la lista para que se vuelva a pedir.
 * Se devuelve la promesa de la invalidación: así la mutación sigue "pendiente" hasta que
 * la lista se actualiza, y quien la usa (por ejemplo, un diálogo) no se cierra antes.
 */
function useInvalidateClients() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: clientKeys.all })
}

export function useCreateClient() {
  const invalidate = useInvalidateClients()
  return useMutation({
    mutationFn: clientsApi.create,
    onSuccess: invalidate,
  })
}

export function useUpdateClient() {
  const invalidate = useInvalidateClients()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateClientInput }) => clientsApi.update(id, input),
    onSuccess: invalidate,
  })
}

export function useDeleteClient() {
  const invalidate = useInvalidateClients()
  return useMutation({
    mutationFn: clientsApi.remove,
    onSuccess: invalidate,
  })
}
