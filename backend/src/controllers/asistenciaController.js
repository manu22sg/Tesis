import {
  actualizarAsistencia,
  eliminarAsistencia,
  listarAsistenciasDeSesion,
  marcarAsistenciaPorToken,registrarAsistenciaManual
} from "../services/asistenciaServices.js";
import { success, error } from "../utils/responseHandler.js";
import JugadorSchema from "../entity/Jugador.js";
import { AppDataSource } from '../config/config.db.js';
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";


export async function postMarcarAsistenciaPorToken(req, res) {
  try {
    const usuarioId = req.user.id;

    // 1) Verificar que el usuario tenga perfil de jugador
    const jugadorRepo = AppDataSource.getRepository(JugadorSchema);
    const jugador = await jugadorRepo.findOne({ where: { usuarioId } });
    if (!jugador) {
      return error(res, "Este usuario no tiene perfil de jugador", 400);
    }

    // 2) Desestructurar y normalizar body
    let { token, estado, latitud, longitud, origen } = req.body;

    if (!token || typeof token !== "string" || !token.trim()) {
      return error(res, "Debe proporcionar un token válido", 400);
    }
    token = token.trim().toUpperCase();

    // 3) Determinar si realmente tenemos coordenadas válidas
    const latNum = Number(latitud);
    const lonNum = Number(longitud);
    const tieneLat = latitud !== null && latitud !== undefined && latitud !== "" && Number.isFinite(latNum);
    const tieneLon = longitud !== null && longitud !== undefined && longitud !== "" && Number.isFinite(lonNum);

    // 4) Construir params sólo con campos relevantes
    const params = {
      token,
      jugadorId: jugador.id,
      estado,
      origen: origen || "jugador",
      ...(tieneLat && { latitud: latNum }),
      ...(tieneLon && { longitud: lonNum }),
    };

    const [resultado, err, status = 200] = await marcarAsistenciaPorToken(params);
    if (err) return error(res, err, status);

    return success(res, resultado, "Asistencia registrada correctamente", status);
  } catch (e) {
    console.error("postMarcarAsistenciaPorToken:", e);
    return error(res, "Error interno del servidor", 500);
  }
}

export async function actualizarAsistenciaController(req, res) {
  const id = parseInt(req.params.id);
  const { estado, latitud, longitud, origen } = req.body;

  const [data, err, status] = await actualizarAsistencia(id, { estado, latitud, longitud, origen });
  if (err) return error(res, err, status || 400);
  return success(res, data, "Asistencia actualizada correctamente");
}

export async function eliminarAsistenciaController(req, res) {
  const id = parseInt(req.params.id);
  const [ok, err, status] = await eliminarAsistencia(id);
  if (err) return error(res, err, status || 400);
  return success(res, { removed: true }, "Asistencia eliminada correctamente");
}

export async function listarAsistenciasDeSesionController(req, res) {
  const sesionId = parseInt(req.params.id);
  const { pagina, limite, estado } = req.query;
  const [data, err, status] = await listarAsistenciasDeSesion(sesionId, { pagina, limite, estado });
  if (err) return error(res, err, status || 400);
  return success(res, data, "Asistencias obtenidas correctamente");
}

export async function exportarAsistenciasExcel(req, res) {
  try {
    const sesionId = parseInt(req.query.sesionId);
    if (!sesionId || isNaN(sesionId)) {
      return res.status(400).json({ 
        success: false, 
        message: "sesionId válido es requerido" 
      });
    }


    const ua = (req.headers["user-agent"] || "").toLowerCase();
    const accept = (req.headers["accept"] || "").toLowerCase();

    const isMobile =
      ua.includes("okhttp") ||           // Android via Expo
      accept.includes("application/json");// Expo pide JSON


    const [result, err, status] = await listarAsistenciasDeSesion(sesionId, {
      pagina: 1,
      limite: 5000
    });

    if (err) {
      return res.status(status || 400).json({
        success: false,
        message: err
      });
    }

    if (!result?.asistencias?.length) {
      return res.status(404).json({
        success: false,
        message: "No hay asistencias registradas para esta sesión"
      });
    }

    const asistencias = result.asistencias;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Asistencias");

    sheet.columns = [
      { header: "Jugador", key: "jugador", width: 30 },
      { header: "RUT", key: "rut", width: 15 },
      { header: "Correo", key: "email", width: 25 },
      { header: "Estado", key: "estado", width: 12 },
      { header: "Origen", key: "origen", width: 12 },
      { header: "Fecha Registro", key: "fecha", width: 18 },
      { header: "Latitud", key: "latitud", width: 12 },
      { header: "Longitud", key: "longitud", width: 12 }
    ];

    sheet.getRow(1).font = { bold: true };

    asistencias.forEach(a => {
      sheet.addRow({
        jugador: a.jugador?.usuario?.nombre || "Desconocido",
        rut: a.jugador?.usuario?.rut || "—",
        email: a.jugador?.usuario?.email || "—",
        estado: a.estado,
        origen: a.origen,
        fecha: a.fechaRegistro,
        latitud: a.latitud || "—",
        longitud: a.longitud || "—"
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    

    if (isMobile) {
      const base64 = buffer.toString("base64");


      return res.json({
        success: true,
        base64,
        fileName: `asistencias_sesion_${sesionId}.xlsx`
      });
    }

    // 🖥️ WEB → enviar archivo binario
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="asistencias_sesion_${sesionId}.xlsx"`
    );
    return res.send(buffer);

  } catch (error) {
    console.error("Error exportando Excel:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error al exportar asistencias",
      error: error.message 
    });
  }
}




export async function exportarAsistenciasPDF(req, res) {
  try {
    const sesionId = parseInt(req.query.sesionId);
    
    if (!sesionId || isNaN(sesionId)) {
      return res.status(400).json({ 
        success: false, 
        message: "sesionId válido es requerido" 
      });
    }

    const estado = req.query.estado || null;


    const [result, err, status] = await listarAsistenciasDeSesion(sesionId, {
      pagina: 1,
      limite: 5000,
      estado
    });


    if (err) {
      return res.status(status || 400).json({
        success: false,
        message: err
      });
    }

    if (!result || !result.asistencias || result.asistencias.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hay asistencias registradas para esta sesión"
      });
    }

    const asistencias = result.asistencias;

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="asistencias_sesion_${sesionId}_${Date.now()}.pdf"`
    );

    doc.pipe(res);

    doc.fontSize(18).font("Helvetica-Bold").text("Listado de Asistencias", { align: "center" });
    doc.moveDown(1);

    asistencias.forEach((a, index) => {
      if (doc.y > 700) doc.addPage();

      doc.fontSize(12).font("Helvetica-Bold").text(a.jugador?.usuario?.nombre || "Jugador Desconocido");

      doc.font("Helvetica").fontSize(10).text(`
RUT: ${a.jugador?.usuario?.rut || "—"}
Correo: ${a.jugador?.usuario?.email || "—"}
Estado: ${a.estado}
Origen: ${a.origen}
Fecha Registro: ${formatoFechaHoraCL(a.fechaRegistro)}
Latitud: ${a.latitud || "—"}
Longitud: ${a.longitud || "—"}
      `);

      if (index < asistencias.length - 1) {
        doc.moveTo(40, doc.y).lineTo(550, doc.y).strokeColor("#CCCCCC").stroke();
        doc.moveDown(1);
      }
    });

    doc.end();

  } catch (error) {
    console.error("Error exportando PDF:", error);
    console.error("Stack:", error.stack);
    
    // Solo enviar JSON si no se ha enviado el PDF
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        message: "Error al exportar asistencias" 
      });
    }
  }
}



function formatoFechaHoraCL(fecha) {
  if (!fecha) return "—";
  const d = new Date(fecha);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const anio = d.getFullYear();

  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');

  return `${dia}/${mes}/${anio} ${hh}:${mm}`;
}

export async function registrarAsistenciaManualController(req, res) {
  try {
    const { sesionId, jugadorId, estado, observacion } = req.body;
    const entrenadorId = req.user.id; 

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: "Usuario no autenticado correctamente"
      });
    }

    if (!sesionId || !jugadorId) {
      return res.status(400).json({
        message: "Faltan campos requeridos: sesionId y jugadorId"
      });
    }

    const [asistencia, error, codigo] = await registrarAsistenciaManual({
      sesionId,
      jugadorId,
      estado,
      entrenadorId,
      observacion
    });

    if (error) {
      return res.status(codigo).json({ message: error });
    }

    return res.status(codigo).json({
      message: "Asistencia registrada correctamente",
      data: asistencia
    });

  } catch (error) {
    console.error("Error en registrarAsistenciaManualController:", error);
    return res.status(500).json({
      message: "Error interno del servidor"
    });
  }
}