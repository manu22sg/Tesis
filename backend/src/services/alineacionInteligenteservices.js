import { AppDataSource } from '../config/config.db.js';
import JugadorSchema from '../entity/Jugador.js';
import EstadisticaBasicaSchema from '../entity/EstadisticaBasica.js';
import AlineacionSchema from '../entity/Alineacion.js';
import AlineacionJugadorSchema from '../entity/AlineacionJugador.js';

// ===========================
// MAPEOS
// ===========================
const MAPEO_POSICIONES = {
  'Portero': 'POR',

  'Defensa Central': 'DEF',
  'Defensa Central Derecho': 'DEF',
  'Defensa Central Izquierdo': 'DEF',
  'Lateral Derecho': 'DEF',
  'Lateral Izquierdo': 'DEF',

  'Mediocentro Defensivo': 'MED',
  'Mediocentro': 'MED',
  'Mediocentro Ofensivo': 'MED',

  'Extremo Derecho': 'DEL',
  'Extremo Izquierdo': 'DEL',
  'Delantero Centro': 'DEL'
};

// ===========================
// FORMACIONES 
// ===========================
const FORMACIONES = {
  ofensiva: [
    { 
      nombre: '4-3-3', 
      distribucion: { POR: 1, DEF: 4, MED: 3, DEL: 3 },
      posicionesEspecificas: [
        'Portero',

        // DEF (4)
        'Lateral Derecho',
        'Defensa Central Derecho',
        'Defensa Central Izquierdo',
        'Lateral Izquierdo',

        // MED (3)
        'Mediocentro',
        'Mediocentro',
        'Mediocentro Ofensivo',

        // DEL (3)
        'Extremo Derecho',
        'Delantero Centro',
        'Extremo Izquierdo'
      ]
    },

    { 
      nombre: '3-4-3', 
      distribucion: { POR: 1, DEF: 3, MED: 4, DEL: 3 },
      posicionesEspecificas: [
        'Portero',

        // DEF (3)
        'Defensa Central Derecho',
        'Defensa Central',
        'Defensa Central Izquierdo',

        // MED (4)
        'Mediocentro Defensivo',
        'Mediocentro',
        'Mediocentro Ofensivo',
        'Mediocentro',

        // DEL (3)
        'Extremo Izquierdo',
        'Delantero Centro',
        'Extremo Derecho'
      ]
    },

    { 
      nombre: '4-2-4', 
      distribucion: { POR: 1, DEF: 4, MED: 2, DEL: 4 },
      posicionesEspecificas: [
        'Portero',

        // DEF (4)
        'Lateral Derecho',
        'Defensa Central Derecho',
        'Defensa Central Izquierdo',
        'Lateral Izquierdo',

        // MED (2)
        'Mediocentro Defensivo',
        'Mediocentro',

        // DEL (4)
        'Extremo Derecho',
        'Delantero Centro',
        'Delantero Centro',
        'Extremo Izquierdo'
      ]
    }
  ],

  defensiva: [
    { 
      nombre: '5-4-1', 
      distribucion: { POR: 1, DEF: 5, MED: 4, DEL: 1 },
      posicionesEspecificas: [
        'Portero',

        // DEF (5)
        'Lateral Derecho',
        'Defensa Central Derecho',
        'Defensa Central',
        'Defensa Central Izquierdo',
        'Lateral Izquierdo',

        // MED (4)
        'Mediocentro Defensivo',
        'Mediocentro',
        'Mediocentro',
        'Mediocentro Ofensivo',

        // DEL (1)
        'Delantero Centro'
      ]
    },

    { 
      nombre: '5-3-2', 
      distribucion: { POR: 1, DEF: 5, MED: 3, DEL: 2 },
      posicionesEspecificas: [
        'Portero',

        // DEF (5)
        'Lateral Derecho',
        'Defensa Central Derecho',
        'Defensa Central',
        'Defensa Central Izquierdo',
        'Lateral Izquierdo',

        // MED (3)
        'Mediocentro Defensivo',
        'Mediocentro',
        'Mediocentro Defensivo',

        // DEL (2)
        'Delantero Centro',
        'Delantero Centro'
      ]
    },

    { 
      nombre: '4-5-1', 
      distribucion: { POR: 1, DEF: 4, MED: 5, DEL: 1 },
      posicionesEspecificas: [
        'Portero',

        // DEF (4)
        'Lateral Derecho',
        'Defensa Central Derecho',
        'Defensa Central Izquierdo',
        'Lateral Izquierdo',

        // MED (5)
        'Mediocentro Defensivo',
        'Mediocentro Defensivo',
        'Mediocentro',
        'Mediocentro Ofensivo',
        'Mediocentro',

        // DEL (1)
        'Delantero Centro'
      ]
    }
  ]
};
/**
 * Obtener estadísticas acumuladas de un jugador
 */
async function obtenerEstadisticasAcumuladas(jugadorId, ultimasSesiones = 10) {
  const estadisticaRepo = AppDataSource.getRepository(EstadisticaBasicaSchema);
  
  const estadisticas = await estadisticaRepo
    .createQueryBuilder('e')
    .where('e.jugadorId = :jugadorId', { jugadorId })
    .orderBy('e.fechaRegistro', 'DESC')
    .limit(ultimasSesiones)
    .getMany();
  
  if (estadisticas.length === 0) {
    return {
      goles: 0,
      asistencias: 0,
      tirosAlArco: 0,
      tirosTotales: 0,
      regatesExitosos: 0,
      regatesIntentados: 0,
      pasesCompletados: 0,
      pasesIntentados: 0,
      intercepciones: 0,
      recuperaciones: 0,
      duelosGanados: 0,
      duelosTotales: 0,
      despejes: 0,
      atajadas: 0,
      golesRecibidos: 0,
      arcosInvictos: 0,
      tarjetasAmarillas: 0,
      tarjetasRojas: 0,
      minutosJugados: 0
    };
  }
  
  // Sumar todas las estadísticas
  return estadisticas.reduce((acc, est) => ({
    goles: acc.goles + (est.goles || 0),
    asistencias: acc.asistencias + (est.asistencias || 0),
    tirosAlArco: acc.tirosAlArco + (est.tirosAlArco || 0),
    tirosTotales: acc.tirosTotales + (est.tirosTotales || 0),
    regatesExitosos: acc.regatesExitosos + (est.regatesExitosos || 0),
    regatesIntentados: acc.regatesIntentados + (est.regatesIntentados || 0),
    pasesCompletados: acc.pasesCompletados + (est.pasesCompletados || 0),
    pasesIntentados: acc.pasesIntentados + (est.pasesIntentados || 0),
    intercepciones: acc.intercepciones + (est.intercepciones || 0),
    recuperaciones: acc.recuperaciones + (est.recuperaciones || 0),
    duelosGanados: acc.duelosGanados + (est.duelosGanados || 0),
    duelosTotales: acc.duelosTotales + (est.duelosTotales || 0),
    despejes: acc.despejes + (est.despejes || 0),
    atajadas: acc.atajadas + (est.atajadas || 0),
    golesRecibidos: acc.golesRecibidos + (est.golesRecibidos || 0),
    arcosInvictos: acc.arcosInvictos + (est.arcosInvictos || 0),
    tarjetasAmarillas: acc.tarjetasAmarillas + (est.tarjetasAmarillas || 0),
    tarjetasRojas: acc.tarjetasRojas + (est.tarjetasRojas || 0),
    minutosJugados: acc.minutosJugados + (est.minutosJugados || 0)
  }), {
    goles: 0,
    asistencias: 0,
    tirosAlArco: 0,
    tirosTotales: 0,
    regatesExitosos: 0,
    regatesIntentados: 0,
    pasesCompletados: 0,
    pasesIntentados: 0,
    intercepciones: 0,
    recuperaciones: 0,
    duelosGanados: 0,
    duelosTotales: 0,
    despejes: 0,
    atajadas: 0,
    golesRecibidos: 0,
    arcosInvictos: 0,
    tarjetasAmarillas: 0,
    tarjetasRojas: 0,
    minutosJugados: 0
  });
}

/**
 * Calcular puntaje de un jugador según tipo de alineación
 */
function calcularPuntaje(estadisticas, tipoPosicion, tipoAlineacion) {
  const stats = estadisticas;
  let score = 0;
  
  // Precisiones (evitar división por cero)
  const precisionPases = stats.pasesIntentados > 0 
    ? (stats.pasesCompletados / stats.pasesIntentados) * 100 
    : 0;
  const precisionTiros = stats.tirosTotales > 0 
    ? (stats.tirosAlArco / stats.tirosTotales) * 100 
    : 0;
  const efectividadDuelos = stats.duelosTotales > 0 
    ? (stats.duelosGanados / stats.duelosTotales) * 100 
    : 0;
  const efectividadRegates = stats.regatesIntentados > 0 
    ? (stats.regatesExitosos / stats.regatesIntentados) * 100 
    : 0;

  if (tipoAlineacion === 'ofensiva') {
    switch (tipoPosicion) {
      case 'POR':
        score = (stats.arcosInvictos * 15) 
              + (stats.atajadas * 5) 
              + (stats.minutosJugados / 90 * 3)
              - (stats.golesRecibidos * 3);
        break;
        
      case 'DEF':
        score = (precisionPases * 0.5)
              + (stats.recuperaciones * 10)
              + (stats.intercepciones * 8)
              + (stats.asistencias * 20)
              + (stats.minutosJugados / 90 * 5)
              - (stats.tarjetasRojas * 100)
              - (stats.tarjetasAmarillas * 15);
        break;
        
      case 'MED':
        score = (stats.goles * 30)
              + (stats.asistencias * 40)
              + (precisionPases * 0.8)
              + (stats.regatesExitosos * 10)
              + (stats.recuperaciones * 5)
              + (stats.minutosJugados / 90 * 5)
              - (stats.tarjetasRojas * 100)
              - (stats.tarjetasAmarillas * 15);
        break;
        
      case 'DEL':
        score = (stats.goles * 50)
              + (stats.asistencias * 25)
              + (precisionTiros * 0.5)
              + (stats.regatesExitosos * 15)
              + (stats.minutosJugados / 90 * 5)
              - (stats.tarjetasRojas * 100)
              - (stats.tarjetasAmarillas * 15);
        break;
    }
  } else { // defensiva
    switch (tipoPosicion) {
      case 'POR':
        score = (stats.arcosInvictos * 30)
              + (stats.atajadas * 10)
              - (stats.golesRecibidos * 5)
              + (stats.minutosJugados / 90 * 10);
        break;
        
      case 'DEF':
        score = (stats.intercepciones * 15)
              + (stats.recuperaciones * 15)
              + (efectividadDuelos * 0.8)
              + (stats.despejes * 5)
              + (stats.minutosJugados / 90 * 10)
              - (stats.tarjetasRojas * 150)
              - (stats.tarjetasAmarillas * 30);
        break;
        
      case 'MED':
        score = (stats.recuperaciones * 20)
              + (stats.intercepciones * 15)
              + (stats.duelosGanados * 10)
              + (precisionPases * 0.3)
              + (stats.minutosJugados / 90 * 8)
              - (stats.tarjetasRojas * 150)
              - (stats.tarjetasAmarillas * 30);
        break;
        
      case 'DEL':
        score = (stats.recuperaciones * 10)
              + (stats.duelosGanados * 8)
              + (stats.goles * 20)
              + (stats.minutosJugados / 90 * 3)
              - (stats.tarjetasRojas * 150);
        break;
    }
  }
  
  return Math.max(0, score); // No permitir puntajes negativos
}

/**
 * Generar alineación inteligente
 */
export async function generarAlineacionInteligente({ 
  sesionId, 
  grupoId, 
  tipoAlineacion,
  formacion
}) {
  try {
    const jugadorRepo = AppDataSource.getRepository(JugadorSchema);
    const alineacionRepo = AppDataSource.getRepository(AlineacionSchema);

    // 1. PRIMERO: Obtener y validar jugadores (esto es lo más crítico)
    const jugadores = await jugadorRepo.find({
      where: { 
        estado: 'activo',
        jugadorGrupos: { grupoId }
      },
      relations: ['jugadorGrupos', 'usuario']
    });
    
    if (jugadores.length < 11) {
      return [
        null, 
        `Se necesitan al menos 11 jugadores activos. Solo hay ${jugadores.length} disponibles`, 
        400
      ];
    }

    // 2. DESPUÉS: Verificar si ya existe una alineación
    const alineacionExistente = await alineacionRepo.findOne({
      where: { sesionId },
      relations: ['jugadores']
    });

    if (alineacionExistente) {
      const tieneJugadores = (alineacionExistente.jugadores?.length || 0) > 0;

      return [
        null,
        {
          message: 'Ya existe una alineación para esta sesión',
          tieneAlineacion: true,
          tieneJugadores: tieneJugadores
        },
        409
      ];
    }
    
    // 3. Obtener formación seleccionada
    const formaciones = FORMACIONES[tipoAlineacion];
    const formacionSeleccionada = formaciones.find(f => f.nombre === formacion);
    
    if (!formacionSeleccionada) {
      return [null, 'Formación no válida para el tipo de alineación seleccionado', 400];
    }
    
    // 4. Obtener estadísticas y calcular puntajes para cada jugador
    const jugadoresConPuntaje = await Promise.all(
      jugadores.map(async (jugador) => {
        const estadisticas = await obtenerEstadisticasAcumuladas(jugador.id);
        const tipoPosicion = MAPEO_POSICIONES[jugador.posicion];
        const puntaje = calcularPuntaje(estadisticas, tipoPosicion, tipoAlineacion);
        
        return {
          ...jugador,
          estadisticasAcumuladas: estadisticas,
          tipoPosicion,
          puntaje
        };
      })
    );
    
    // 5. Agrupar jugadores por tipo de posición
    const jugadoresPorTipo = {
      POR: jugadoresConPuntaje.filter(j => j.tipoPosicion === 'POR').sort((a, b) => b.puntaje - a.puntaje),
      DEF: jugadoresConPuntaje.filter(j => j.tipoPosicion === 'DEF').sort((a, b) => b.puntaje - a.puntaje),
      MED: jugadoresConPuntaje.filter(j => j.tipoPosicion === 'MED').sort((a, b) => b.puntaje - a.puntaje),
      DEL: jugadoresConPuntaje.filter(j => j.tipoPosicion === 'DEL').sort((a, b) => b.puntaje - a.puntaje)
    };
    
    // 6. Seleccionar jugadores según la formación
    const { distribucion, posicionesEspecificas } = formacionSeleccionada;
    const jugadoresSeleccionados = [];
    
    // Seleccionar según distribución
    for (const [tipo, cantidad] of Object.entries(distribucion)) {
      const disponibles = jugadoresPorTipo[tipo];
      
      if (disponibles.length < cantidad) {
        return [null, `No hay suficientes jugadores de tipo ${tipo}. Se necesitan ${cantidad}, hay ${disponibles.length}`, 400];
      }
      
      for (let i = 0; i < cantidad; i++) {
        jugadoresSeleccionados.push({
          jugador: disponibles[i],
          posicion: posicionesEspecificas[jugadoresSeleccionados.length],
          orden: jugadoresSeleccionados.length + 1,
          puntaje: disponibles[i].puntaje
        });
      }
    }
    
    // 7. Crear la alineación
    const alineacion = alineacionRepo.create({
      sesionId,
      generadaAuto: true
    });
    
    const alineacionGuardada = await alineacionRepo.save(alineacion);
    
    // 8. Crear registros de jugadores en la alineación
    const alineacionJugadorRepo = AppDataSource.getRepository(AlineacionJugadorSchema);
    const registrosJugadores = jugadoresSeleccionados.map(js => 
      alineacionJugadorRepo.create({
        alineacionId: alineacionGuardada.id,
        jugadorId: js.jugador.id,
        posicion: js.posicion,
        orden: js.orden,
        comentario: `Seleccionado automáticamente (Score: ${Math.round(js.puntaje)})`
      })
    );
    
    await alineacionJugadorRepo.save(registrosJugadores);
    
    // 9. Retornar alineación completa con relaciones
    const alineacionCompleta = await alineacionRepo.findOne({
      where: { id: alineacionGuardada.id },
      relations: ['sesion', 'jugadores', 'jugadores.jugador', 'jugadores.jugador.usuario']
    });
    
    return [alineacionCompleta, null, 201];
    
  } catch (error) {
    console.error('Error generando alineación inteligente:', error);
    return [null, 'Error interno del servidor', 500];
  }
}

// Exportar formaciones disponibles
export function obtenerFormacionesDisponibles(tipoAlineacion) {
  return FORMACIONES[tipoAlineacion] || [];
}