import { z } from 'zod'
import { accountTypes } from './types'

// clientId es texto porque es el valor de un select; se convierte a número al enviar.
export const openAccountSchema = z.object({
  clientId: z.string().min(1, 'Selecciona el cliente'),
  type: z.enum(accountTypes, { error: 'Selecciona el tipo de cuenta' }),
  gmfExempt: z.boolean(),
})

export type OpenAccountValues = z.infer<typeof openAccountSchema>
