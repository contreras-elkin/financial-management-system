import type { Client } from './types'

export function fullName(client: Client) {
  return `${client.firstName} ${client.lastName}`
}
