

/**
 * Calcula la distancia entre dos coordenadas GPS usando la fórmula de Haversine.
 * @param {number} lat1 - Latitud del punto 1 (en grados)
 * @param {number} lon1 - Longitud del punto 1 (en grados)
 * @param {number} lat2 - Latitud del punto 2 (en grados)
 * @param {number} lon2 - Longitud del punto 2 (en grados)
 * @returns {number} Distancia en metros
 */
export function calcularDistanciaMetros(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // radio medio de la Tierra en metros
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) ** 2 +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Determina si un punto (jugador) está dentro de un radio dado
 * respecto a una ubicación de referencia (token o cancha).
 * @param {number} latJugador
 * @param {number} lonJugador
 * @param {number} latReferencia
 * @param {number} lonReferencia
 * @param {number} radioPermitidoMetros
 * @returns {{ dentro: boolean, distancia: number }}
 */
export function estaDentroDelRadio(latJugador, lonJugador, latReferencia, lonReferencia, radioPermitidoMetros = 100) {
  const distancia = calcularDistanciaMetros(latJugador, lonJugador, latReferencia, lonReferencia);
  return {
    dentro: distancia <= radioPermitidoMetros,
    distancia
  };
}
