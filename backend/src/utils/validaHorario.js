const toMin = t => { const [h,m]=t.split(':').map(Number); return h*60+m; };

export default function validaHorario({ horaInicio, horaFin }, helpers, cfg) {
  const { inicio, fin, duracionBloque } = cfg; 
  const i = toMin(horaInicio), f = toMin(horaFin);
  const minInicio = toMin(inicio), minFin = toMin(fin);

  if (i < minInicio || f > minFin)
    return helpers.error('any.invalid', { message: `Horario fuera del funcionamiento (${inicio} - ${fin})` });
  if (f <= i)
    return helpers.error('any.invalid', { message: 'La hora fin debe ser mayor a la hora inicio' });

  const dur = f - i;
  if (dur < 30)
    return helpers.error('any.invalid', { message: 'La sesión no debe durar al menos 30 minutos' });
  if (dur > 180)
    return helpers.error('any.invalid', { message: 'La sesión no puede durar más de 3 horas' });

  if (duracionBloque && dur % duracionBloque !== 0)
    return helpers.error('any.invalid', { message: `La duración debe ser múltiplo de ${duracionBloque} minutos` });

  return true;
}
