import dayjs from 'dayjs';


/**
 * Formatea una fecha a formato DD/MM/YYYY
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} Fecha formateada o "—" si no es válida
 */
export function formatearFecha(fecha) {
  if (!fecha) return '—';
  const d = dayjs(fecha);
  return d.isValid() ? d.format('DD/MM/YYYY') : '—';
}

/**
 * Formatea una hora a formato HH:mm
 * @param {string} hora - Hora en formato "HH:mm:ss" o "HH:mm"
 * @returns {string} Hora formateada o "—" si no es válida
 */
export function formatearHora(hora) {
  if (!hora) return '—';
  
  // Si viene en formato "HH:mm:ss" o "HH:mm"
  const parsed = dayjs(hora, ['HH:mm:ss', 'HH:mm'], true);
  return parsed.isValid() ? parsed.format('HH:mm') : '—';
}

/**
 * Formatea una fecha completa con hora a formato DD/MM/YYYY HH:mm
 * @param {string|Date} fechaHora - Fecha y hora a formatear
 * @returns {string} Fecha y hora formateada o "—" si no es válida
 */
export function formatearFechaHora(fechaHora) {
  if (!fechaHora) return '—';
  const d = dayjs(fechaHora);
  return d.isValid() ? d.format('DD/MM/YYYY HH:mm') : '—';
}

/**
 * Formatea un rango de horas (horaInicio - horaFin)
 * @param {string} horaInicio - Hora de inicio
 * @param {string} horaFin - Hora de fin (opcional)
 * @returns {string} Rango formateado "HH:mm - HH:mm" o solo "HH:mm"
 */
export function formatearRangoHoras(horaInicio, horaFin) {
  const inicio = formatearHora(horaInicio);
  if (!horaFin) return inicio;
  
  const fin = formatearHora(horaFin);
  return `${inicio} - ${fin}`;
}

/**
 * Formatea una fecha para Excel/PDF (compatible con toLocaleDateString)
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} Fecha formateada en formato local o "—"
 */
export function formatearFechaParaExport(fecha) {
  if (!fecha) return '—';
  try {
    const d = dayjs(fecha);
    return d.isValid() ? d.format('DD/MM/YYYY') : '—';
  } catch {
    return '—';
  }
}