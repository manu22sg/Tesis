import {
  crearJugador,
  obtenerTodosJugadores,
  obtenerJugadorPorId,
  actualizarJugador,
  eliminarJugador,
  asignarJugadorAGrupo,
  removerJugadorDeGrupo,
  obtenerEstadisticasPorCarrera
} from '../services/jugadorServices.js';
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

import { success, error, notFound, conflict } from '../utils/responseHandler.js';

export async function crearJugadorController(req, res) {
  try {
    const [jugador, err] = await crearJugador(req.body);
    
    if (err) {
      if (err.includes("ya existe") || err.includes("ya está registrado")) {
        return conflict(res, err);
      }
      return error(res, err, 400);
    }

    return success(res, jugador, "Jugador creado correctamente", 201);
  } catch (err) {
    return error(res, err.message);
  }
}

export async function obtenerTodosJugadoresController(req, res) {
  try {
    const { 
      pagina = 1, 
      limite = 10, 
      estado, 
      carreraId,        // Filtro por ID de carrera (recomendado)
      carreraNombre,    // Filtro por nombre de carrera
      anioIngreso, 
      q,
      grupoId,
      posicion,         // Filtro por posición
      piernaHabil       // Filtro por pierna hábil
    } = req.query;

    const filtros = {};
    
    // Filtros básicos
    if (estado) filtros.estado = estado;
    if (q) filtros.q = q;
    if (anioIngreso) filtros.anioIngreso = parseInt(anioIngreso);
    if (grupoId) filtros.grupoId = parseInt(grupoId);
    
    // Filtros de carrera (usar carreraId preferentemente)
    if (carreraId) {
      filtros.carreraId = parseInt(carreraId);
    } else if (carreraNombre) {
      filtros.carreraNombre = carreraNombre;
    }
    
    // Filtros adicionales
    if (posicion) filtros.posicion = posicion;
    if (piernaHabil) filtros.piernaHabil = piernaHabil;

    const [resultado, err] = await obtenerTodosJugadores(
      parseInt(pagina),
      parseInt(limite),
      filtros
    );

    if (err) {
      return error(res, err);
    }

    return success(res, resultado, "Jugadores obtenidos correctamente");
  } catch (err) {
    console.error("Error en obtenerTodosJugadoresController:", err);
    return error(res, err.message);
  }
}

export async function obtenerJugadorPorIdController(req, res) {
  try {
    const [jugador, err] = await obtenerJugadorPorId(req.params.id);
    
    if (err) {
      if (err.includes("no encontrado")) {
        return notFound(res, err);
      }
      return error(res, err);
    }

    return success(res, jugador, "Jugador obtenido correctamente");
  } catch (err) {
    return error(res, err.message);
  }
}

export async function actualizarJugadorController(req, res) {
  try {
    const [jugador, err] = await actualizarJugador(req.params.id, req.body);
    
    if (err) {
      if (err.includes("no encontrado")) {
        return notFound(res, err);
      }
      return error(res, err, 400);
    }

    return success(res, jugador, "Jugador actualizado correctamente");
  } catch (err) {
    return error(res, err.message);
  }
}

export async function eliminarJugadorController(req, res) {
  try {
    const [mensaje, err] = await eliminarJugador(req.params.id);
    
    if (err) {
      if (err.includes("no encontrado")) {
        return notFound(res, err);
      }
      return error(res, err);
    }

    return success(res, null, mensaje);
  } catch (err) {
    return error(res, err.message);
  }
}

export async function asignarJugadorAGrupoController(req, res) {
  try {
    const { id: jugadorId, grupoId } = req.params;
    const [resultado, err] = await asignarJugadorAGrupo(jugadorId, grupoId);
    
    if (err) {
      if (err.includes("ya está asignado")) {
        return conflict(res, err);
      }
      if (err.includes("no encontrado")) {
        return notFound(res, err);
      }
      return error(res, err, 400);
    }

    return success(res, resultado, "Jugador asignado al grupo correctamente", 201);
  } catch (err) {
    return error(res, err.message);
  }
}

export async function removerJugadorDeGrupoController(req, res) {
  try {
    const { id: jugadorId, grupoId } = req.params;
    const [mensaje, err] = await removerJugadorDeGrupo(jugadorId, grupoId);
    
    if (err) {
      if (err.includes("no está asignado") || err.includes("no encontrado")) {
        return notFound(res, err);
      }
      return error(res, err, 400);
    }

    return success(res, null, mensaje);
  } catch (err) {
    return error(res, err.message);
  }
}

// Nuevo endpoint: Estadísticas por carrera
export async function obtenerEstadisticasPorCarreraController(req, res) {
  try {
    const [estadisticas, err] = await obtenerEstadisticasPorCarrera();
    
    if (err) {
      return error(res, err);
    }

    return success(res, estadisticas, "Estadísticas obtenidas correctamente");
  } catch (err) {
    console.error("Error en obtenerEstadisticasPorCarreraController:", err);
    return error(res, err.message);
  }
}



export async function exportarJugadoresExcel(req, res) {
  try {
    const { 
      estado, 
      carreraId,
      carreraNombre,
      anioIngreso, 
      q,
      grupoId,
      posicion,
      piernaHabil
    } = req.query;

    const filtros = {};
    if (estado) filtros.estado = estado;
    if (q) filtros.q = q;
    if (anioIngreso) filtros.anioIngreso = parseInt(anioIngreso);
    if (grupoId) filtros.grupoId = parseInt(grupoId);
    if (carreraId) filtros.carreraId = parseInt(carreraId);
    else if (carreraNombre) filtros.carreraNombre = carreraNombre;
    if (posicion) filtros.posicion = posicion;
    if (piernaHabil) filtros.piernaHabil = piernaHabil;

    const [resultado, err] = await obtenerTodosJugadores(1, 5000, filtros);

    if (err) {
      return res.status(500).json({
        success: false,
        message: err
      });
    }

    const jugadores = resultado.jugadores || [];

    if (jugadores.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hay jugadores para exportar"
      });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Sistema de Gestión Deportiva";
    const sheet = workbook.addWorksheet("Jugadores");

    sheet.columns = [
      { header: "Nombre", key: "nombre", width: 30 },
      { header: "RUT", key: "rut", width: 15 },
      { header: "Correo", key: "email", width: 30 },
      { header: "Posición", key: "posicion", width: 15 },
      { header: "Carrera", key: "carrera", width: 35 },
      { header: "Año Ingreso", key: "anioIngreso", width: 12 },
      { header: "Pierna Hábil", key: "piernaHabil", width: 12 },
      { header: "Altura (cm)", key: "altura", width: 12 },
      { header: "Peso (kg)", key: "peso", width: 12 },
      { header: "Estado", key: "estado", width: 12 },
      { header: "Grupos", key: "grupos", width: 30 }
    ];

    sheet.getRow(1).font = { bold: true };

    jugadores.forEach(j => {
      const grupos = (j.jugadorGrupos || [])
        .map(jg => jg.grupo?.nombre)
        .filter(Boolean)
        .join(', ') || '—';

      sheet.addRow({
        nombre: `${j.usuario?.nombre || ""} ${j.usuario?.apellido || ""}`.trim() || "—",

        rut: j.usuario?.rut || "—",
        email: j.usuario?.email || "—",
        posicion: j.posicion || "—",
        carrera: j.usuario?.carrera?.nombre || "—",
        anioIngreso: j.anioIngreso || "—",
        piernaHabil: j.piernaHabil || "—",
        altura: j.altura || "—",
        peso: j.peso || "—",
        estado: formatearEstado(j.estado),
        grupos: grupos
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="jugadores_${Date.now()}.xlsx"`
    );
    res.setHeader("Content-Length", buffer.length);

    return res.send(buffer);

  } catch (error) {
    console.error("Error exportando jugadores a Excel:", error);
    return res.status(500).json({
      success: false,
      message: "Error al exportar jugadores",
      error: error.message
    });
  }
}

// GET /api/jugadores/pdf - Exportar jugadores a PDF
export async function exportarJugadoresPDF(req, res) {
  try {
    const { 
      estado, 
      carreraId,
      carreraNombre,
      anioIngreso, 
      q,
      grupoId,
      posicion,
      piernaHabil
    } = req.query;

    const filtros = {};
    if (estado) filtros.estado = estado;
    if (q) filtros.q = q;
    if (anioIngreso) filtros.anioIngreso = parseInt(anioIngreso);
    if (grupoId) filtros.grupoId = parseInt(grupoId);
    if (carreraId) filtros.carreraId = parseInt(carreraId);
    else if (carreraNombre) filtros.carreraNombre = carreraNombre;
    if (posicion) filtros.posicion = posicion;
    if (piernaHabil) filtros.piernaHabil = piernaHabil;

    const [resultado, err] = await obtenerTodosJugadores(1, 5000, filtros);

    if (err) {
      return res.status(500).json({
        success: false,
        message: err
      });
    }

    const jugadores = resultado.jugadores || [];

    if (jugadores.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hay jugadores para exportar"
      });
    }

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="jugadores_${Date.now()}.pdf"`
    );

    doc.pipe(res);

    doc.fontSize(18).font("Helvetica-Bold").text("Listado de Jugadores", { align: "center" });
    doc.moveDown(1);

    jugadores.forEach((j, index) => {
      if (doc.y > 700) doc.addPage();

      doc.fontSize(12)
   .font("Helvetica-Bold")
   .text(
     `${j.usuario?.nombre || ""} ${j.usuario?.apellido || ""}`.trim() || "Usuario Desconocido"
   );

      const grupos = (j.jugadorGrupos || [])
        .map(jg => jg.grupo?.nombre)
        .filter(Boolean)
        .join(', ') || 'Sin grupos';

      doc.font("Helvetica").fontSize(10).text(`
RUT: ${j.usuario?.rut || "—"}
Correo: ${j.usuario?.email || "—"}
Posición: ${j.posicion || "—"}
Carrera: ${j.usuario?.carrera?.nombre || "—"}
Año Ingreso: ${j.anioIngreso || "—"}
Pierna Hábil: ${j.piernaHabil || "—"}
Altura: ${j.altura ? j.altura + ' cm' : "—"}
Peso: ${j.peso ? j.peso + ' kg' : "—"}
Estado: ${formatearEstado(j.estado)}
Grupos: ${grupos}
      `);

      if (index < jugadores.length - 1) {
        doc.moveTo(40, doc.y).lineTo(550, doc.y).strokeColor("#CCCCCC").stroke();
        doc.moveDown(1);
      }
    });

    doc.end();

  } catch (error) {
    console.error("Error exportando jugadores a PDF:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Error al exportar jugadores"
      });
    }
  }
}

// Función auxiliar
function formatearEstado(estado) {
  const estados = {
    activo: "Activo",
    inactivo: "Inactivo",
    lesionado: "Lesionado",
    suspendido: "Suspendido"
  };
  return estados[estado] || estado || "—";
}
