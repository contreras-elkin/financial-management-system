import { z } from 'zod'
import { identificationTypes } from './types'

/**
 * Reglas del formulario de clientes. Replican las del backend (dominio Client, DTO y
 * restricciones de la BD) para avisar al usuario antes de enviar; el backend sigue
 * siendo quien decide y vuelve a validar todo.
 */
export const LEGAL_AGE = 18
const MIN_NAME_LENGTH = 2

/** Misma expresión que Client.EMAIL_PATTERN y la restricción ck_clients_email_format. */
const EMAIL_PATTERN = /^[\w.+-]+@[\w-]+(\.[\w-]+)*\.[A-Za-z]{2,}$/

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function name(label: string) {
  return z
    .string()
    .trim()
    .min(MIN_NAME_LENGTH, `${label} debe tener al menos ${MIN_NAME_LENGTH} caracteres`)
    .max(100, `${label} no puede superar los 100 caracteres`)
}

function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** Comprueba que el texto sea una fecha real (descarta, por ejemplo, 2026-02-31). */
function isRealDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false
  }
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

/**
 * Fecha límite para ser mayor de edad: hoy, LEGAL_AGE años atrás. Las fechas ISO se
 * comparan como texto, y el resultado coincide con Period.between del backend, incluido
 * el caso de quien nació un 29 de febrero. Se calcula en cada validación, no al cargar
 * el módulo, para que no quede desactualizada si la aplicación sigue abierta al día siguiente.
 */
function legalAgeLimit(): string {
  const today = new Date()
  return toIsoDate(new Date(today.getFullYear() - LEGAL_AGE, today.getMonth(), today.getDate()))
}

const birthDate = z
  .string()
  .min(1, 'La fecha de nacimiento es obligatoria')
  .refine(isRealDate, 'La fecha de nacimiento no es válida')
  .refine((value) => value < toIsoDate(new Date()), 'La fecha de nacimiento debe ser anterior a hoy')
  .refine((value) => value <= legalAgeLimit(), `El cliente debe ser mayor de edad (${LEGAL_AGE} años o más)`)

export const createClientSchema = z.object({
  identificationType: z.enum(identificationTypes, { error: 'Selecciona el tipo de identificación' }),
  identificationNumber: z
    .string()
    .trim()
    .min(1, 'El número de identificación es obligatorio')
    .max(20, 'El número de identificación no puede superar los 20 caracteres'),
  firstName: name('El nombre'),
  lastName: name('El apellido'),
  email: z
    .string()
    .trim()
    .min(1, 'El correo electrónico es obligatorio')
    .max(150, 'El correo electrónico no puede superar los 150 caracteres')
    .regex(EMAIL_PATTERN, 'El correo debe tener el formato usuario@dominio.com'),
  birthDate,
})

/** Al editar no se envía la identificación: es inmutable. */
export const updateClientSchema = createClientSchema.omit({
  identificationType: true,
  identificationNumber: true,
})

export type CreateClientValues = z.infer<typeof createClientSchema>
export type UpdateClientValues = z.infer<typeof updateClientSchema>
