import { z } from 'zod'

// Hasta 13 enteros: con 2 decimales son 15 dígitos, el máximo que un number de JS guarda sin redondear.
const AMOUNT_PATTERN = /^\d{1,13}([.,]\d{1,2})?$/

// El monto se valida como texto para rechazar fracciones de centavo en lugar de redondearlas, como el backend.
export const amountSchema = z
  .string()
  .trim()
  .min(1, 'Ingresa el monto')
  .regex(AMOUNT_PATTERN, 'Ingresa un monto válido, sin puntos de miles y con máximo 2 decimales')
  .refine((value) => toAmount(value) > 0, 'El monto debe ser mayor a $ 0')

export const movementSchema = z.object({ amount: amountSchema })

export type MovementValues = z.infer<typeof movementSchema>

// targetAccountId es texto porque es el valor de un select; se convierte a número al enviar.
export const transferSchema = z.object({
  targetAccountId: z.string().min(1, 'Selecciona la cuenta destino'),
  amount: amountSchema,
})

export type TransferValues = z.infer<typeof transferSchema>

export function toAmount(value: string) {
  return Number(value.trim().replace(',', '.'))
}
