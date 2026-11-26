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
