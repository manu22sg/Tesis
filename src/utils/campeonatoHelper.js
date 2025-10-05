const FORMATOS_JUEGO = {
  '5vs5': { jugadores: 5, capacidadCancha: 10 },
  '6vs6': { jugadores: 6, capacidadCancha: 12 },
  '7vs7': { jugadores: 7, capacidadCancha: 14 },
  '11vs11': { jugadores: 11, capacidadCancha: 22 },
};

export const ESTADOS_CAMPEONATO = {
  PLANIFICACION: 'planificacion',
  INSCRIPCION: 'inscripcion',
  EN_CURSO: 'en_curso',
  FINALIZADO: 'finalizado',
  CANCELADO: 'cancelado',
};

export const MODALIDADES = {
  MASCULINA: 'masculina',
  FEMENINA: 'femenina',
  MIXTA: 'mixta',
  ACADEMICOS: 'academicos',
};

export const FASES = {
  TREINTAIDOSAVOS: '32avos',
  DIECISEISAVOS: '16avos',
  OCTAVOS: 'octavos',
  CUARTOS: 'cuartos',
  SEMIFINAL: 'semifinal',
  FINAL: 'final',
};
export function formatearResultadoPartido(partido) {
  const resultado = {
    equipo1: partido.equipo1?.nombre || 'TBD',
    equipo2: partido.equipo2?.nombre || 'TBD',
    golesEquipo1: partido.golesEquipo1,
    golesEquipo2: partido.golesEquipo2,
  };

  if (partido.definidoPorPenales) {
    resultado.texto = `${resultado.equipo1} ${resultado.golesEquipo1} (${partido.penalesEquipo1}) - ${resultado.golesEquipo2} (${partido.penalesEquipo2}) ${resultado.equipo2}`;
    resultado.detalle = 'Definido por penales';
  } else {
    resultado.texto = `${resultado.equipo1} ${resultado.golesEquipo1} - ${resultado.golesEquipo2} ${resultado.equipo2}`;
    resultado.detalle = 'Tiempo regular';
  }

  return resultado;
}

export const ESTADOS_PARTIDO = {
  PROGRAMADO: 'programado',
  EN_CURSO: 'en_curso',
  FINALIZADO: 'finalizado',
  SUSPENDIDO: 'suspendido',
  APLAZADO: 'aplazado',
};

export function obtenerConfiguracionFormato(formatoJuego) {
  const config = FORMATOS_JUEGO[formatoJuego];
  
  if (!config) {
    throw new Error(
      `Formato de juego inválido: ${formatoJuego}. Valores permitidos: ${Object.keys(FORMATOS_JUEGO).join(', ')}`
    );
  }
  
  return config;
}

export function validarFormatoJuego(formatoJuego) {
  return Object.keys(FORMATOS_JUEGO).includes(formatoJuego);
}

export function esPotenciaDeDos(numero) {
  return numero > 0 && (numero & (numero - 1)) === 0;
}

export function calcularFaseSegunEquipos(numeroEquipos) {
  if (numeroEquipos === 2) return FASES.FINAL;
  if (numeroEquipos === 4) return FASES.SEMIFINAL;
  if (numeroEquipos === 8) return FASES.CUARTOS;
  if (numeroEquipos === 16) return FASES.OCTAVOS;
  if (numeroEquipos === 32) return FASES.DIECISEISAVOS;
  if (numeroEquipos === 64) return FASES.TREINTAIDOSAVOS;
  throw new Error('Número de equipos debe ser 2, 4, 8, 16, 32 o 64');
}

export function barajarArray(array) {
  const copia = [...array];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export function obtenerFormatosJuego() {
  return Object.keys(FORMATOS_JUEGO);
}

export function calcularSiguienteFase(faseActual) {
  const fases = Object.values(FASES);
  const indiceActual = fases.indexOf(faseActual);
  
  if (indiceActual === -1 || indiceActual === fases.length - 1) {
    return null; // Ya es la final
  }
  
  return fases[indiceActual + 1];
}