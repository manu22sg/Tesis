import { success, error, notFound } from '../utils/responseHandler.js';
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { crearEvaluacion, obtenerEvaluaciones, obtenerEvaluacionPorId, actualizarEvaluacion, eliminarEvaluacion } from '../services/evaluacionServices.js';

export async function postCrearEvaluacion(req, res) {
  const [data, err] = await crearEvaluacion(req.body);
  if (err) return error(res, err, err.includes('no encontrada') ? 404 : 400);
  return success(res, data, 'Evaluación creada', 201);
}

export async function getEvaluaciones(req, res) {
  const { page = 1, limit = 10, q, jugadorId, sesionId, desde, hasta } = req.query;
  
  const filtros = {
    page: parseInt(page),
    limit: parseInt(limit)
  };
  
  if (q) filtros.q = q;
  if (jugadorId) filtros.jugadorId = parseInt(jugadorId);
  if (sesionId) filtros.sesionId = parseInt(sesionId);
  if (desde) filtros.desde = desde;
  if (hasta) filtros.hasta = hasta;
  
  // Si el rol es estudiante, forzar su propio jugadorId
  if (req.user?.rol === 'estudiante' && req.user?.jugadorId) {
    filtros.jugadorId = req.user.jugadorId;
  }
  
  const [data, err] = await obtenerEvaluaciones(filtros);
  if (err) return error(res, err);
  return success(res, data, 'Evaluaciones obtenidas');
}

export async function getEvaluacionPorId(req, res) {
  const [data, err] = await obtenerEvaluacionPorId(parseInt(req.params.id));
  if (err) return notFound(res, err);
  return success(res, data, 'Evaluación encontrada');
}

export async function patchEvaluacion(req, res) {
  const id = parseInt(req.params.id);
  const [data, err] = await actualizarEvaluacion(id, req.body);
  if (err) return error(res, err, err.includes('no encontrada') ? 404 : 400);
  return success(res, data, 'Evaluación actualizada');
}

export async function deleteEvaluacion(req, res) {
  const [ok, err] = await eliminarEvaluacion(parseInt(req.params.id));
  if (err) return error(res, err, err.includes('no encontrada') ? 404 : 400);
  return success(res, { eliminado: !!ok }, 'Evaluación eliminada');
}

export async function getEvaluacionesPorJugador(req, res) {
  const jugadorId = parseInt(req.params.jugadorId, 10);
  const { page = 1, limit = 10, desde, hasta, sesionId } = req.query;
  
  const filtros = {
    page: parseInt(page),
    limit: parseInt(limit),
    jugadorId
  };
  
  if (desde) filtros.desde = desde;
  if (hasta) filtros.hasta = hasta;
  if (sesionId) filtros.sesionId = parseInt(sesionId);

  const [data, err] = await obtenerEvaluaciones(filtros);
  if (err) return error(res, err);
  return success(res, data, 'Evaluaciones del jugador obtenidas');
}

export async function getMisEvaluaciones(req, res) {
  const jugadorId = req.user.jugadorId;
  const { page = 1, limit = 10, desde, hasta, sesionId } = req.query;
  
  const filtros = {
    page: parseInt(page),
    limit: parseInt(limit),
    jugadorId
  };
  
  if (desde) filtros.desde = desde;
  if (hasta) filtros.hasta = hasta;
  if (sesionId) filtros.sesionId = parseInt(sesionId);

  const [data, err] = await obtenerEvaluaciones(filtros);
  if (err) return error(res, err);
  return success(res, data, 'Tus evaluaciones');
}

export async function exportarEvaluacionesExcel(req, res) {
  try {
    const { jugadorId, sesionId, desde, hasta, q } = req.query; // ✅ Ya validado

    const filtros = {
      page: 1,
      limit: 5000
    };
    
    if (jugadorId) filtros.jugadorId = parseInt(jugadorId);
    if (sesionId) filtros.sesionId = parseInt(sesionId);
    if (desde) filtros.desde = desde;
    if (hasta) filtros.hasta = hasta;
    if (q) filtros.q = q;

    // Si es estudiante, solo ve sus evaluaciones
    if (req.user?.rol === 'estudiante' && req.user?.jugadorId) {
      filtros.jugadorId = req.user.jugadorId;
    }

    const [resultado, err] = await obtenerEvaluaciones(filtros);

    if (err) {
      return res.status(500).json({
        success: false,
        message: err
      });
    }

    const evaluaciones = resultado.evaluaciones || [];

    if (evaluaciones.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hay evaluaciones para exportar"
      });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Sistema de Gestión Deportiva";
    const sheet = workbook.addWorksheet("Evaluaciones");

    if (sesionId && !jugadorId) {
      sheet.columns = [
        { header: "Jugador", key: "jugador", width: 30 },
        { header: "RUT", key: "rut", width: 15 },
        { header: "Técnica", key: "tecnica", width: 10 },
        { header: "Táctica", key: "tactica", width: 10 },
        { header: "Actitudinal", key: "actitudinal", width: 12 },
        { header: "Física", key: "fisica", width: 10 },
        { header: "Promedio", key: "promedio", width: 10 },
        { header: "Fecha Registro", key: "fechaRegistro", width: 15 }
      ];

      evaluaciones.forEach(e => {
        const jugadorNombre = e.jugador?.usuario?.nombre 
          ? `${e.jugador.usuario.nombre} ${e.jugador.usuario.apellido || ''}`.trim()
          : "—";
        
        const notas = [e.tecnica, e.tactica, e.actitudinal, e.fisica].filter(n => n !== null && n !== undefined);
        const promedio = notas.length > 0 ? (notas.reduce((acc, val) => acc + val, 0) / notas.length).toFixed(2) : "—";

        sheet.addRow({
          jugador: jugadorNombre,
          rut: e.jugador?.usuario?.rut || "—",
          tecnica: e.tecnica ?? "—",
          tactica: e.tactica ?? "—",
          actitudinal: e.actitudinal ?? "—",
          fisica: e.fisica ?? "—",
          promedio: promedio,
          fechaRegistro: e.fechaRegistro ? new Date(e.fechaRegistro).toLocaleDateString('es-CL') : "—"
        });
      });
    } else {
      sheet.columns = [
        { header: "Sesión", key: "sesion", width: 25 },
        { header: "Fecha Sesión", key: "fechaSesion", width: 15 },
        { header: "Hora Inicio", key: "horaInicio", width: 12 },
        { header: "Hora Fin", key: "horaFin", width: 12 },
        { header: "Técnica", key: "tecnica", width: 10 },
        { header: "Táctica", key: "tactica", width: 10 },
        { header: "Actitudinal", key: "actitudinal", width: 12 },
        { header: "Física", key: "fisica", width: 10 },
        { header: "Promedio", key: "promedio", width: 10 },
        { header: "Fecha Registro", key: "fechaRegistro", width: 15 }
      ];

      evaluaciones.forEach(e => {
        const notas = [e.tecnica, e.tactica, e.actitudinal, e.fisica].filter(n => n !== null && n !== undefined);
        const promedio = notas.length > 0 ? (notas.reduce((acc, val) => acc + val, 0) / notas.length).toFixed(2) : "—";

        sheet.addRow({
          sesion: e.sesion?.tipoSesion || e.sesion?.nombre || "—",
          fechaSesion: e.sesion?.fecha || "—",
          horaInicio: e.sesion?.horaInicio || "—",
          horaFin: e.sesion?.horaFin || "—",
          tecnica: e.tecnica ?? "—",
          tactica: e.tactica ?? "—",
          actitudinal: e.actitudinal ?? "—",
          fisica: e.fisica ?? "—",
          promedio: promedio,
          fechaRegistro: e.fechaRegistro ? new Date(e.fechaRegistro).toLocaleDateString('es-CL') : "—"
        });
      });
    }

    sheet.getRow(1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="evaluaciones_${sesionId ? `sesion_${sesionId}` : `jugador_${jugadorId}`}_${Date.now()}.xlsx"`
    );
    res.setHeader("Content-Length", buffer.length);

    return res.send(buffer);

  } catch (error) {
    console.error("Error exportando evaluaciones a Excel:", error);
    return res.status(500).json({
      success: false,
      message: "Error al exportar evaluaciones",
      error: error.message
    });
  }
}

export async function exportarEvaluacionesPDF(req, res) {
  try {
    const { jugadorId, sesionId, desde, hasta, q } = req.query; // ✅ Ya validado

    const filtros = {
      page: 1,
      limit: 5000
    };
    
    if (jugadorId) filtros.jugadorId = parseInt(jugadorId);
    if (sesionId) filtros.sesionId = parseInt(sesionId);
    if (desde) filtros.desde = desde;
    if (hasta) filtros.hasta = hasta;
    if (q) filtros.q = q;

    // Si es estudiante, solo ve sus evaluaciones
    if (req.user?.rol === 'estudiante' && req.user?.jugadorId) {
      filtros.jugadorId = req.user.jugadorId;
    }

    const [resultado, err] = await obtenerEvaluaciones(filtros);

    if (err) {
      return res.status(500).json({
        success: false,
        message: err
      });
    }

    const evaluaciones = resultado.evaluaciones || [];

    if (evaluaciones.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hay evaluaciones para exportar"
      });
    }

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="evaluaciones_${sesionId ? `sesion_${sesionId}` : `jugador_${jugadorId}`}_${Date.now()}.pdf"`
    );

    doc.pipe(res);

    doc.fontSize(18).font("Helvetica-Bold").text("Evaluaciones", { align: "center" });
    doc.moveDown(1);

    evaluaciones.forEach((e, index) => {
      if (doc.y > 680) doc.addPage();

      if (sesionId && !jugadorId) {
        const jugadorNombre = e.jugador?.usuario?.nombre 
          ? `${e.jugador.usuario.nombre} ${e.jugador.usuario.apellido || ''}`.trim()
          : "Usuario Desconocido";

        doc.fontSize(12).font("Helvetica-Bold").text(jugadorNombre);

        const rut = e.jugador?.usuario?.rut || "—";
        const notas = [e.tecnica, e.tactica, e.actitudinal, e.fisica].filter(n => n !== null && n !== undefined);
        const promedio = notas.length > 0 ? (notas.reduce((acc, val) => acc + val, 0) / notas.length).toFixed(2) : "—";

        doc.font("Helvetica").fontSize(10).text(`
RUT: ${rut}
Técnica: ${e.tecnica ?? "—"}
Táctica: ${e.tactica ?? "—"}
Actitudinal: ${e.actitudinal ?? "—"}
Física: ${e.fisica ?? "—"}
Promedio: ${promedio}
Fecha Registro: ${e.fechaRegistro ? new Date(e.fechaRegistro).toLocaleDateString('es-CL') : "—"}
        `);
      } else {
        doc.fontSize(12).font("Helvetica-Bold").text(e.sesion?.tipoSesion || e.sesion?.nombre || "Sesión Desconocida");

        const fechaSesion = e.sesion?.fecha || "—";
        const horaInicio = e.sesion?.horaInicio || "—";
        const horaFin = e.sesion?.horaFin || "—";
        const notas = [e.tecnica, e.tactica, e.actitudinal, e.fisica].filter(n => n !== null && n !== undefined);
        const promedio = notas.length > 0 ? (notas.reduce((acc, val) => acc + val, 0) / notas.length).toFixed(2) : "—";

        doc.font("Helvetica").fontSize(10).text(`
Sesión: ${fechaSesion} - ${horaInicio} a ${horaFin}
Técnica: ${e.tecnica ?? "—"}
Táctica: ${e.tactica ?? "—"}
Actitudinal: ${e.actitudinal ?? "—"}
Física: ${e.fisica ?? "—"}
Promedio: ${promedio}
Fecha Registro: ${e.fechaRegistro ? new Date(e.fechaRegistro).toLocaleDateString('es-CL') : "—"}
        `);
      }

      if (index < evaluaciones.length - 1) {
        doc.moveTo(40, doc.y).lineTo(550, doc.y).strokeColor("#CCCCCC").stroke();
        doc.moveDown(1);
      }
    });

    doc.end();

  } catch (error) {
    console.error("Error exportando evaluaciones a PDF:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Error al exportar evaluaciones"
      });
    }
  }
}