import { http } from '../../shared/api/http'
import type { Client, CreateClientInput, UpdateClientInput } from './types'

const PATH = '/clients'

/** Operaciones HTTP sobre los clientes. Los componentes no la usan directamente, sino a través de los hooks. */
export const clientsApi = {
  list: () => http.get<Client[]>(PATH),
  create: (input: CreateClientInput) => http.post<Client>(PATH, input),
  update: (id: number, input: UpdateClientInput) => http.put<Client>(`${PATH}/${id}`, input),
  remove: (id: number) => http.delete(`${PATH}/${id}`),
}
