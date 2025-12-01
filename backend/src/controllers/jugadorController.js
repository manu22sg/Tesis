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
      page = 1,           
      limit = 50,         
      estado, 
      carreraId,
      carreraNombre,
      anioIngreso, 
      q,
      grupoId,
      posicion,
      posicionSecundaria, 
      piernaHabil
    } = req.query;

    const filtros = {};
    
    if (estado) filtros.estado = estado;
   if (q !== undefined && q.trim().length > 0 && q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'El parámetro de búsqueda "q" debe tener al menos 2 caracteres'
      });
    }
    if (q && q.trim().length >= 2) filtros.q = q.trim();


    if (anioIngreso) filtros.anioIngreso = parseInt(anioIngreso);
    if (grupoId) filtros.grupoId = parseInt(grupoId);
    
    if (carreraId) {
      filtros.carreraId = parseInt(carreraId);
    } else if (carreraNombre) {
      filtros.carreraNombre = carreraNombre;
    }
    
    if (posicion) filtros.posicion = posicion;
    if (posicionSecundaria) filtros.posicionSecundaria = posicionSecundaria; 
    if (piernaHabil) filtros.piernaHabil = piernaHabil;

    const [resultado, err] = await obtenerTodosJugadores(
      parseInt(page),     
      parseInt(limit),    
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
      estado, carreraId, carreraNombre, anioIngreso, q,
      grupoId, posicion, posicionSecundaria, piernaHabil,
      mobile
    } = req.query;

    const isMobile = mobile === "true";

    const filtros = {};
    if (estado) filtros.estado = estado;
    if (q) filtros.q = q;
    if (anioIngreso) filtros.anioIngreso = parseInt(anioIngreso);
    if (grupoId) filtros.grupoId = parseInt(grupoId);
    if (carreraId) filtros.carreraId = parseInt(carreraId);
    else if (carreraNombre) filtros.carreraNombre = carreraNombre;
    if (posicion) filtros.posicion = posicion;
    if (posicionSecundaria) filtros.posicionSecundaria = posicionSecundaria;
    if (piernaHabil) filtros.piernaHabil = piernaHabil;

    const [resultado, err] = await obtenerTodosJugadores(1, 5000, filtros);

    if (err) {
      return res.status(500).json({ success: false, message: err });
    }

    const jugadores = resultado.jugadores || [];

    if (jugadores.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hay jugadores para exportar"
      });
    }

    // EXCEL
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Jugadores");

    sheet.columns = [
      { header: "Nombre", key: "nombre", width: 30 },
      { header: "RUT", key: "rut", width: 15 },
      { header: "Correo", key: "email", width: 25 },
      { header: "Posición", key: "posicion", width: 15 },
      { header: "Posición Secundaria", key: "posicionSecundaria", width: 20 },
      { header: "Carrera", key: "carrera", width: 25 },
      { header: "Año Ingreso", key: "anioIngreso", width: 12 },
      { header: "Pierna Hábil", key: "piernaHabil", width: 12 },
      { header: "Altura", key: "altura", width: 10 },
      { header: "Peso", key: "peso", width: 10 },
      { header: "Estado", key: "estado", width: 12 },
      { header: "Grupos", key: "grupos", width: 35 }
    ];

    sheet.getRow(1).font = { bold: true };

    jugadores.forEach(j => {
      const grupos = (j.jugadorGrupos || [])
        .map(g => g.grupo?.nombre)
        .filter(Boolean)
        .join(", ");

      sheet.addRow({
nombre: `${(j.usuario?.nombre || "").trim()} ${(j.usuario?.apellido || "").trim()}`.trim(),
        rut: j.usuario?.rut || "—",
        email: j.usuario?.email || "—",
        posicion: j.posicion || "—",
        posicionSecundaria: j.posicionSecundaria || "—",
        carrera: j.usuario?.carrera?.nombre || "—",
        anioIngreso: j.anioIngreso || "—",
        piernaHabil: j.piernaHabil || "—",
        altura: j.altura || "—",
        peso: j.peso || "—",
        estado: formatearEstado(j.estado),
        grupos: grupos || "—"
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    // 📱 MOBILE (React Native / Expo)
    if (isMobile) {
      return res.json({
        success: true,
        fileName: `jugadores_${Date.now()}.xlsx`,
        base64: Buffer.from(buffer).toString("base64")
      });
    }

    // 💻 PC (descarga directa)
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="jugadores_${Date.now()}.xlsx"`
    );

    return res.send(buffer);

  } catch (error) {
    console.error("Error exportando jugadores Excel:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno al exportar jugadores"
    });
  }
}

export async function exportarJugadoresPDF(req, res) {
  try {
    const { 
      estado, carreraId, carreraNombre, anioIngreso, q,
      grupoId, posicion, posicionSecundaria, piernaHabil,
      mobile
    } = req.query;

    const isMobile = mobile === "true";

    const filtros = {};
    if (estado) filtros.estado = estado;
    if (q) filtros.q = q;
    if (anioIngreso) filtros.anioIngreso = parseInt(anioIngreso);
    if (grupoId) filtros.grupoId = parseInt(grupoId);
    if (carreraId) filtros.carreraId = parseInt(carreraId);
    else if (carreraNombre) filtros.carreraNombre = carreraNombre;
    if (posicion) filtros.posicion = posicion;
    if (posicionSecundaria) filtros.posicionSecundaria = posicionSecundaria;
    if (piernaHabil) filtros.piernaHabil = piernaHabil;

    const [resultado, err] = await obtenerTodosJugadores(1, 5000, filtros);

    if (err) {
      return res.status(500).json({ success: false, message: err });
    }

    const jugadores = resultado.jugadores || [];

    if (jugadores.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hay jugadores para exportar"
      });
    }

    // PDF
    const doc = new PDFDocument({ margin: 40 });
    let chunks = [];

    // Si es mobile → guardamos en memoria
    if (isMobile) {
      doc.on("data", chunk => chunks.push(chunk));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(chunks);
        return res.json({
          success: true,
          fileName: `jugadores_${Date.now()}.pdf`,
          base64: pdfBuffer.toString("base64")
        });
      });
    } else {
      // PC → descarga directa
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="jugadores_${Date.now()}.pdf"`
      );
      doc.pipe(res);
    }

    // TITULO
    doc.fontSize(18).font("Helvetica-Bold")
       .text("Listado de Jugadores", { align: "center" });
    doc.moveDown(2);

    // CONTENIDO POR JUGADOR
    jugadores.forEach((j, index) => {

      if (doc.y > 700) doc.addPage();

      doc.fontSize(12).font("Helvetica-Bold")
.text(`${(j.usuario?.nombre || "").trim()} ${(j.usuario?.apellido || "").trim()}`.trim());

      const grupos = (j.jugadorGrupos || [])
        .map(g => g.grupo?.nombre)
        .join(", ") || "—";

      doc.font("Helvetica").fontSize(10).text(`
RUT: ${j.usuario?.rut || "—"}
Correo: ${j.usuario?.email || "—"}
Posición: ${j.posicion || "—"} ${j.posicionSecundaria ? `/ ${j.posicionSecundaria}` : ""}
Carrera: ${j.usuario?.carrera?.nombre || "—"}
Año ingreso: ${j.anioIngreso || "—"}
Pierna hábil: ${j.piernaHabil || "—"}
Altura: ${j.altura ? j.altura + " cm" : "—"}
Peso: ${j.peso ? j.peso + " kg" : "—"}
Estado: ${formatearEstado(j.estado)}
Grupos: ${grupos}
      `);

      if (index < jugadores.length - 1) {
        doc.moveTo(40, doc.y)
           .lineTo(550, doc.y)
           .strokeColor("#CCCCCC")
           .stroke();
        doc.moveDown(1);
      }
    });

    doc.end();

  } catch (error) {
    console.error("Error exportando jugadores PDF:", error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Error interno al exportar PDF"
      });
    }
  }
}


function formatearEstado(estado) {
  const estados = {
    activo: "Activo",
    inactivo: "Inactivo",
    lesionado: "Lesionado",
    suspendido: "Suspendido"
  };
  return estados[estado] || estado || "—";
}