import { AppDataSource } from "../config/config.db.js";

export const listarCarreras = async (req, res) => {
  try {
    const repo = AppDataSource.getRepository("Carrera");
    const carreras = await repo.find({ order: { nombre: "ASC" } });

    return res.json({
      success: true,
      data: carreras
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: "Error al obtener carreras"
    });
  }
};
