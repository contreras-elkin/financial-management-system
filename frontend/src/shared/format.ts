/**
 * Formato de fechas para mostrar en pantalla (día/mes/año).
 * Se trabaja sobre el texto ISO en vez de usar `new Date('YYYY-MM-DD')`: ese constructor
 * interpreta la fecha en UTC y, en Colombia (UTC-5), la mostraría un día antes.
 */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split('-')
  return `${day}/${month}/${year}`
}

/** Fecha y hora sin zona, como las envía el backend ('YYYY-MM-DDTHH:mm:ss'). */
export function formatDateTime(isoDateTime: string): string {
  return `${formatDate(isoDateTime)} ${isoDateTime.slice(11, 16)}`
}

// Decimales explícitos: los datos de moneda de Chrome y de Node no coinciden para el COP.
const currency = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatCurrency(amount: number): string {
  return currency.format(amount)
}
