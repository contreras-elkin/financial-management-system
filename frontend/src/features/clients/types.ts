/**
 * Contrato de la API de clientes, espejo de los DTO del backend
 * (ClientResponse, CreateClientRequest y UpdateClientRequest).
 * Las fechas viajan como texto ISO: birthDate es 'YYYY-MM-DD' y
 * createdAt/updatedAt son 'YYYY-MM-DDTHH:mm:ss' sin zona horaria.
 */
export const identificationTypes = ['CC', 'CE', 'PA'] as const

export type IdentificationType = (typeof identificationTypes)[number]

export type Client = {
  id: number
  identificationType: IdentificationType
  identificationNumber: string
  firstName: string
  lastName: string
  email: string
  birthDate: string
  createdAt: string
  updatedAt: string
}

export type CreateClientInput = {
  identificationType: IdentificationType
  identificationNumber: string
  firstName: string
  lastName: string
  email: string
  birthDate: string
}

/** La identificación no se puede modificar, por eso no forma parte de la actualización. */
export type UpdateClientInput = Omit<CreateClientInput, 'identificationType' | 'identificationNumber'>
