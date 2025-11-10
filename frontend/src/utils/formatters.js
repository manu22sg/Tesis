// Detecta si es un datetime ISO (YYYY-MM-DDTHH:mm...)
const esISODateTime = (v) =>
  typeof v === 'string' && /\d{4}-\d{2}-\d{2}T/.test(v);

export const formatearFecha = (fecha) => {
  if (!fecha) return '';

  // Si viene como ISO o YYYY-MM-DD, ya estás cubriendo el caso:
  if (typeof fecha === 'string') {
    const match = fecha.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, año, mes, dia] = match;
      return `${dia}/${mes}/${año}`;
    }
  }

  // Date u otros formatos válidos
  const d = new Date(fecha);
  if (isNaN(d)) return '';
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const año = d.getFullYear();
  return `${dia}/${mes}/${año}`;
};

export const formatearHora = (hora) => {
  if (!hora) return '';

  // Si me pasan un ISO completo, lo convierto a hora local HH:mm
  if (esISODateTime(hora)) {
    const d = new Date(hora); // convierte desde UTC a hora local (America/Santiago en el navegador)
    if (isNaN(d)) return '';
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  // Si ya viene como "HH:mm:ss" o "HH:mm", corto a HH:mm
  if (typeof hora === 'string') return hora.substring(0, 5);

  // Si viene como Date/number
  const d = new Date(hora);
  if (isNaN(d)) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

// Sube de nivel: soporta (fecha, hora) O un único ISO en el primer arg.
export const formatearFechaHora = (fecha, hora) => {
  // Caso: solo me pasan un ISO completo en "fecha"
  if (fecha && !hora && esISODateTime(fecha)) {
    const d = new Date(fecha);
    if (isNaN(d)) return '';
    const f = formatearFecha(d);
    const h = formatearHora(d);
    return `${f} - ${h}`;
  }

  // Caso clásico: fecha + hora separados
  const fechaFormateada = formatearFecha(fecha);
  const horaFormateada = formatearHora(hora);
  return `${fechaFormateada} - ${horaFormateada}`;
};

export const formatearRangoHoras = (horaInicio, horaFin) => {
  const inicio = formatearHora(horaInicio);
  const fin = formatearHora(horaFin);
  return `${inicio} - ${fin}`;
};
