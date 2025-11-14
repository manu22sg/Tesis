"use strict";
import CarreraSchema from "../entity/Carrera.js";
import { AppDataSource } from "./config.db.js";

/**
 * Carreras de la Universidad del Bío-Bío - Campus Concepción
 * Ordenadas alfabéticamente
 */
const carrerasUBB = [
  { nombre: "Arquitectura" },
  { nombre: "Contador Público y Auditor" },
  { nombre: "Derecho" },
  { nombre: "Diseño Industrial" },
  { nombre: "Ingeniería Civil" },
  { nombre: "Ingeniería Civil Eléctrica" },
  { nombre: "Ingeniería Civil en Automatización" },
  { nombre: "Ingeniería Civil en Informática" },
  { nombre: "Ingeniería Civil Industrial" },
  { nombre: "Ingeniería Civil Mecánica" },
  { nombre: "Ingeniería Civil Química" },
  { nombre: "Ingeniería Comercial" },
  { nombre: "Ingeniería de Ejecución en Computación e Informática" },
  { nombre: "Ingeniería Eléctrica" },
  { nombre: "Ingeniería Electrónica" },
  { nombre: "Ingeniería en Construcción" },
  { nombre: "Ingeniería Estadística" },
  { nombre: "Ingeniería Mecánica" },
  { nombre: "Programa de Bachillerato en Ciencias" },
  { nombre: "Trabajo Social" },
  { nombre: "Otro" },
];

async function createCarreras() {
  try {
    const carreraRepository = AppDataSource.getRepository(CarreraSchema);
    
    // Verificar si ya existen carreras
    const count = await carreraRepository.count();
    if (count > 0) {
      return;
    }


    // Crear todas las carreras
    const carrerasCreadas = await Promise.all(
      carrerasUBB.map((carreraData) =>
        carreraRepository.save(carreraRepository.create(carreraData))
      )
    );

  } catch (error) {
    console.error("Error al crear carreras:", error);
    throw error;
  }
}

export { createCarreras };