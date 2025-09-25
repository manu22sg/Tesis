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
    const superadminPassword = generateRandomPassword();

    // Mostrar contraseñas en consola
    console.log("🔑 CONTRASEÑAS GENERADAS1:");
    console.log(`   Entrenador (alex@ubiobio.cl): ${entrenadorPassword}`);
    console.log(`   Superadmin (superadmin@ubiobio.cl): ${superadminPassword}`);
    console.log("   ⚠️  GUARDA ESTAS CONTRASEÑAS EN UN LUGAR SEGURO");
    console.log("");

    await Promise.all([
      // Entrenador con contraseña random
      userRepository.save(
        userRepository.create({
          rut: "12.345.678-9",
          nombre: "Alex Entrenador",
          email: "alex@ubiobio.cl",
          password: await hashPassword(entrenadorPassword),
          rol: "entrenador",
          estado: "activo",
        }),
      ),
      // Superadmin con contraseña random
      userRepository.save(
        userRepository.create({
          rut: "98.765.432-1",
          nombre: "Super Administrador",
          email: "superadmin@ubiobio.cl",
          password: await hashPassword(superadminPassword),
          rol: "superadmin",
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