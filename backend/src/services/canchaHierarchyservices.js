import { AppDataSource } from '../config/config.db.js';
import CanchaSchema from '../entity/Cancha.js';

// 🎯 CONSTANTE: Capacidad de la cancha principal
export const CAPACIDAD_CANCHA_PRINCIPAL = 64;

/**
 * Verifica si una cancha es la Principal (completa)
 */
export function esCanchaPrincipal(cancha) {
  return cancha.capacidadMaxima === CAPACIDAD_CANCHA_PRINCIPAL;
}

/**
 * Verifica si una cancha es una división
 */
export function esDivision(cancha) {
  return cancha.capacidadMaxima < CAPACIDAD_CANCHA_PRINCIPAL;
}

/**
 * Obtiene la cancha principal del complejo
 */
export async function obtenerCanchaPrincipal() {
  const canchaRepo = AppDataSource.getRepository(CanchaSchema);
  return await canchaRepo.findOne({
    where: { capacidadMaxima: CAPACIDAD_CANCHA_PRINCIPAL, estado: 'disponible' }
  });
}

/**
 * Obtiene todas las canchas del complejo (Principal + Divisiones)
 */
export async function obtenerTodasCanchasComplejo() {
  const canchaRepo = AppDataSource.getRepository(CanchaSchema);
  return await canchaRepo.find({
    where: { estado: 'disponible' },
    order: { capacidadMaxima: 'DESC' } // Principal primero
  });
}

/**
 * Obtiene todas las divisiones (canchas que NO son la principal)
 */
export async function obtenerDivisiones() {
  const canchaRepo = AppDataSource.getRepository(CanchaSchema);
  const canchas = await canchaRepo.find({ where: { estado: 'disponible' } });
  return canchas.filter(c => esDivision(c));
}