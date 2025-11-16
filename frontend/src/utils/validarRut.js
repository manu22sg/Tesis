export function validarRut(rut) {
  if (!rut) return false;

  // Limpiar formato
  rut = rut.replace(/\./g, "").replace(/-/g, "").toUpperCase();

  // Debe tener al menos 2 caracteres (cuerpo + DV)
  if (rut.length < 2) return false;

  const cuerpo = rut.slice(0, -1);
  const dv = rut.slice(-1);

  let suma = 0;
  let multiplo = 2;

  // Recorrer cuerpo de derecha a izquierda
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += multiplo * parseInt(cuerpo[i]);
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }

  const dvEsperado = 11 - (suma % 11);
  const dvFinal = dvEsperado === 11 ? "0" :
                  dvEsperado === 10 ? "K" :
                  dvEsperado.toString();

  return dvFinal === dv;
}
