// utils/validaHorario.js

const toMin = t => { 
  const [h, m] = t.split(':').map(Number); 
  return h * 60 + m; 
};

/**
 * Valida horarios según configuración
 * Solo reservas con bloques:
 * 09:00-10:00
 * 10:10-11:10
 * 11:20-12:20
 * 12:30-13:30
 * 13:40-14:40
 * 14:50-15:50
 * 16:00-17:00
 */
export default function validaHorario(value, helpers, cfg) {
  const { 
    inicio, 
    fin, 
    duracionBloque, 
    validarBloques = false 
  } = cfg;
  
  const horaInicio = value.horaInicio || value.inicio;
  const horaFin = value.horaFin || value.fin;

  const i = toMin(horaInicio);
  const f = toMin(horaFin);
  const minInicio = toMin(inicio);
  const minFin = toMin(fin);

  // 1️⃣ Validar rango horario general
  if (i < minInicio || f > minFin) {
    return helpers.error('any.invalid', { 
      message: `Horario fuera del funcionamiento (${inicio} - ${fin})` 
    });
  }

  // 2️⃣ Fin > inicio
  if (f <= i) {
    return helpers.error('any.invalid', { 
      message: 'La hora fin debe ser mayor a la hora inicio' 
    });
  }

  const dur = f - i;

  // 3️⃣ Validar duración exacta (1 hora)
  if (duracionBloque && dur !== duracionBloque) {
    return helpers.error('any.invalid', { 
      message: `La duración debe ser exactamente ${duracionBloque} minutos` 
    });
  }

  // 4️⃣ BLOQUES exactos (para reservas)
  if (validarBloques) {
    const bloquesValidos = [
      ['09:00', '10:00'],
      ['10:10', '11:10'],
      ['11:20', '12:20'],
      ['12:30', '13:30'],
      ['13:40', '14:40'],
      ['14:50', '15:50'],
      ['16:00', '17:00']
    ];

    const esValido = bloquesValidos.some(([hIni, hFin]) =>
      horaInicio === hIni && horaFin === hFin
    );

    if (!esValido) {
      return helpers.error('any.invalid', { 
        message: 
          'Horarios válidos: 09:00-10:00, 10:10-11:10, 11:20-12:20, 12:30-13:30, 13:40-14:40, 14:50-15:50, 16:00-17:00'
      });
    }
  }

  return true;
}
