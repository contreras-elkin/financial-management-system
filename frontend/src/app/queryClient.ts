import { QueryClient } from '@tanstack/react-query'
import type { ApiError } from '../shared/api/ApiError'

/**
 * Todas las peticiones pasan por shared/api/http, que traduce cualquier fallo a ApiError.
 * Registrarlo como error por defecto tipa `error` en useQuery y useMutation sin conversiones.
 */
declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiError
  }
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  })
}
