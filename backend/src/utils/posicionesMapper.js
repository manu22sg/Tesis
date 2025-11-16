export const MAPEO_POSICIONES = {
  'Portero': 'POR',
  'Defensa Central' : 'DEF',
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

export function obtenerTipoPosicion(posicion) {
  return MAPEO_POSICIONES[posicion] || null;
}
