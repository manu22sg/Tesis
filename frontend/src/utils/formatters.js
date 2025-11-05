
export const formatearFecha = (fecha) => {
  if (!fecha) return '';
  
  // Si es string en formato YYYY-MM-DD o ISO, extraer directamente
  if (typeof fecha === 'string') {
    // Formato YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss
    const match = fecha.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, año, mes, dia] = match;
      return `${dia}/${mes}/${año}`;
    }
  }
  
  // Si es un objeto Date o no coincide con el patrón anterior
  const d = new Date(fecha);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const año = d.getFullYear();
  return `${dia}/${mes}/${año}`;
};


export const formatearHora = (hora) => {
  if (!hora) return '';
  return hora.substring(0, 5);
};


export const formatearFechaHora = (fecha, hora) => {
  const fechaFormateada = formatearFecha(fecha);
  const horaFormateada = formatearHora(hora);
  return `${fechaFormateada} - ${horaFormateada}`;
};


export const formatearRangoHoras = (horaInicio, horaFin) => {
  const inicio = formatearHora(horaInicio);
  const fin = formatearHora(horaFin);
  return `${inicio} - ${fin}`;
};