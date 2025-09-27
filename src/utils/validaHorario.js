const validaHorario = ({ horaInicio, horaFin }, helpers) => {
  const i = toMin(horaInicio);
  const f = toMin(horaFin);
  const minInicio = toMin(HORARIO_FUNCIONAMIENTO.inicio);
  const minFin = toMin(HORARIO_FUNCIONAMIENTO.fin);

  if (i < minInicio || f > minFin) {
    return helpers.error('any.invalid', {
      message: `Horario fuera del funcionamiento (${HORARIO_FUNCIONAMIENTO.inicio} - ${HORARIO_FUNCIONAMIENTO.fin})`
    });
  }
  if (f <= i) {
    return helpers.error('any.invalid', {
      message: 'La hora fin debe ser mayor a la hora inicio'
    });
  }
  const dur = f - i;
  if (dur < 30) {
    return helpers.error('any.invalid', {
      message: 'El entrenamiento debe durar al menos 30 minutos'
    });
  }
  if (dur > 180) {
    return helpers.error('any.invalid', {
      message: 'El entrenamiento no puede durar más de 3 horas'
    });
  }
  return true;
};

export default validaHorario;