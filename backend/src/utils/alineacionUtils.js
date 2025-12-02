
export function clasificarJugador(jugador) {
  const { posicionX, posicionY, orden } = jugador;
  
  // Prioridad 1: Si tiene posición en cancha, es titular
  if (posicionX !== null && posicionY !== null) {
    return 'titular';
  }
  
  // Prioridad 2: Si orden 1-11, es titular (aunque no tenga posición aún)
  if (orden >= 1 && orden <= 11) {
    return 'titular';
  }
  
  // Prioridad 3: Si orden 12+, es suplente
  if (orden >= 12) {
    return 'suplente';
  }
  
  // Sin definir
  return 'sin_definir';
}

/**
 * Separa jugadores en titulares y suplentes
 */
export function separarTitularesSuplentes(jugadores = []) {
  const titulares = [];
  const suplentes = [];
  const sinDefinir = [];
  
  jugadores.forEach(jugador => {
    const tipo = clasificarJugador(jugador);
    
    if (tipo === 'titular') {
      titulares.push(jugador);
    } else if (tipo === 'suplente') {
      suplentes.push(jugador);
    } else {
      sinDefinir.push(jugador);
    }
  });
  
  return {
    titulares: titulares.sort((a, b) => (a.orden || 999) - (b.orden || 999)),
    suplentes: suplentes.sort((a, b) => (a.orden || 999) - (b.orden || 999)),
    sinDefinir: sinDefinir.sort((a, b) => (a.orden || 999) - (b.orden || 999)),
  };
}

/**
 * Ordena jugadores: titulares primero, luego suplentes, luego sin definir
 */
export function ordenarJugadoresPorTipo(jugadores = []) {
  return jugadores.sort((a, b) => {
    const tipoA = clasificarJugador(a);
    const tipoB = clasificarJugador(b);
    
    const prioridad = { titular: 1, suplente: 2, sin_definir: 3 };
    
    if (prioridad[tipoA] !== prioridad[tipoB]) {
      return prioridad[tipoA] - prioridad[tipoB];
    }
    
    // Mismo tipo: ordenar por dorsal
    return (a.orden || 999) - (b.orden || 999);
  });
}

/**
 * Valida que un jugador pueda ser titular
 */
export function validarTitular(jugadores, nuevoOrden) {
  const titularesActuales = jugadores.filter(j => clasificarJugador(j) === 'titular');
  
  // Si ya hay 11 titulares y el nuevo orden es 1-11
  if (titularesActuales.length >= 11 && nuevoOrden >= 1 && nuevoOrden <= 11) {
    return {
      valido: false,
      mensaje: 'Ya hay 11 titulares. Debe remover uno primero o asignar un orden mayor a 11.'
    };
  }
  
  return { valido: true };
}

/**
 * Formatea fecha para exportaciones
 */
export function formatearFecha(fecha) {
  if (!fecha) return '—';
  
  // Si la fecha es string en formato YYYY-MM-DD
  if (typeof fecha === 'string' && fecha.match(/^\d{4}-\d{2}-\d{2}/)) {
    const [anio, mes, dia] = fecha.split('-').map(Number);
    return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${anio}`;
  }
  
  // Si es un objeto Date o timestamp
  const d = new Date(fecha);
  const dia = String(d.getUTCDate()).padStart(2, '0');
  const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
  const anio = d.getUTCFullYear();
  return `${dia}/${mes}/${anio}`;
}

/**
 * Obtiene el nombre completo del jugador
 */
export function obtenerNombreCompleto(jugador) {
  const nombre = jugador?.jugador?.usuario?.nombre || '';
  const apellido = jugador?.jugador?.usuario?.apellido || '';
  return `${nombre.trim()} ${apellido.trim()}`.trim() || 'Sin nombre';
}

/**
 * Obtiene estadísticas de la alineación
 */
export function obtenerEstadisticasAlineacion(jugadores = []) {
  const { titulares, suplentes, sinDefinir } = separarTitularesSuplentes(jugadores);
  
  return {
    total: jugadores.length,
    titulares: titulares.length,
    suplentes: suplentes.length,
    sinDefinir: sinDefinir.length,
    tieneTitularesCompletos: titulares.length === 11,
    posicionesPorLlenar: Math.max(0, 11 - titulares.length)
  };
}