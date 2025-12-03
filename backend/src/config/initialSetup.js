"use strict";
import UsuarioSchema from "../entity/Usuario.js";
import { AppDataSource } from "./config.db.js";
import { hashPassword } from "../services/authServices.js";

// Función para generar contraseña aleatoria
function generateRandomPassword(length = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function createUsers() {
  try {
    const userRepository = AppDataSource.getRepository(UsuarioSchema);
    const count = await userRepository.count();
    if (count > 0) return;

    // Generar contraseñas para usuarios especiales
    const entrenadorPassword = generateRandomPassword();
    const admin = generateRandomPassword();

    // Mostrar contraseñas en consola
    console.log(" CONTRASEÑAS GENERADAS1:");
    console.log(`   Entrenador (alex@ubiobio.cl): ${entrenadorPassword}`);
    console.log(`   admin (admin@ubiobio.cl): ${admin}`);
    console.log("     GUARDE ESTAS CONTRASEÑAS EN UN LUGAR SEGURO");
    console.log("");

    await Promise.all([
      // Entrenador con contraseña random
      userRepository.save(
        userRepository.create({
          rut: "9273206-1",
          nombre: "Alex",
          apellido: "Barrales",
          email: "alex@ubiobio.cl",
          password: await hashPassword(entrenadorPassword),
          rol: "entrenador",
          estado: "activo",
          sexo: "Masculino",
          verificado: true
        }),
      ),
      userRepository.save(
        userRepository.create({
          rut: "98.765.432-1",
          nombre: "Administrador",
          email: "admin@ubiobio.cl",
          password: await hashPassword(admin),
          rol: "administrador",
          estado: "activo",
        }),
      ),
      // Usuarios de prueba con contraseña fija
      userRepository.save(
        userRepository.create({
          rut: "20.111.111-1",
          nombre: "Estudiante Prueba",
          email: "estudiante@alumnos.ubiobio.cl",
          password: await hashPassword("user1234"),
          rol: "estudiante",
          estado: "activo",
        }),
      ),
      userRepository.save(
        userRepository.create({
          rut: "20.222.222-2",
          nombre: "Academico Prueba",
          email: "academico@ubiobio.cl",
          password: await hashPassword("user1234"),
          rol: "academico",
          estado: "activo",
        }),
      ),
    ]);
    
    console.log("* => Usuarios creados exitosamente");
  } catch (error) {
    console.error("Error al crear usuarios:", error);
  }
}

export { createUsers };