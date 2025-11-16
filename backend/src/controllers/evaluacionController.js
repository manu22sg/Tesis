import { success, error, notFound } from '../utils/responseHandler.js';
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

import { crearEvaluacion, obtenerEvaluaciones, obtenerEvaluacionPorId, actualizarEvaluacion, eliminarEvaluacion } from '../services/evaluacionServices.js';

export async function postCrearEvaluacion(req,res){
  const [data, err] = await crearEvaluacion(req.body);
  if (err) return error(res, err, err.includes('no encontrada')?404:400);
  return success(res, data, 'Evaluación creada', 201);
}
export async function getEvaluaciones(req, res) {
  // Convertir query params a números
  const filtros = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
  };
  
  // Agregar filtros opcionales
  if (req.query.q) filtros.q = req.query.q; 
  if (req.query.jugadorId) filtros.jugadorId = parseInt(req.query.jugadorId);
  if (req.query.sesionId) filtros.sesionId = parseInt(req.query.sesionId);
  if (req.query.desde) filtros.desde = req.query.desde;
  if (req.query.hasta) filtros.hasta = req.query.hasta;
  
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
  const filtros = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
    jugadorId
  };
  
  if (req.query.desde) filtros.desde = req.query.desde;
  if (req.query.hasta) filtros.hasta = req.query.hasta;
  if (req.query.sesionId) filtros.sesionId = parseInt(req.query.sesionId);

  const [data, err] = await obtenerEvaluaciones(filtros);
  if (err) return error(res, err);
  return success(res, data, 'Evaluaciones del jugador obtenidas');
}

// GET /evaluaciones/mias (estudiante)
export async function getMisEvaluaciones(req, res) {
  const jugadorId = req.user.jugadorId;
  const filtros = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
    jugadorId
  };
  
  if (req.query.desde) filtros.desde = req.query.desde;
  if (req.query.hasta) filtros.hasta = req.query.hasta;
  if (req.query.sesionId) filtros.sesionId = parseInt(req.query.sesionId);

  const [data, err] = await obtenerEvaluaciones(filtros);
  if (err) return error(res, err);
  return success(res, data, 'Tus evaluaciones');
}


export async function exportarEvaluacionesExcel(req, res) {
  try {
    const { 
      jugadorId,
      sesionId,
      desde,
      hasta,
      q
    } = req.query;

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

    sheet.columns = [
      { header: "Jugador", key: "jugador", width: 30 },
      { header: "RUT", key: "rut", width: 15 },
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

    sheet.getRow(1).font = { bold: true };

    evaluaciones.forEach(e => {
      const jugadorNombre = e.jugador?.usuario?.nombre 
        ? `${e.jugador.usuario.nombre} ${e.jugador.usuario.apellido || ''}`.trim()
        : "—";
      
      const rut = e.jugador?.usuario?.rut || "—";
      
      const fechaSesion = e.sesion?.fecha || "—";
      const horaInicio = e.sesion?.horaInicio || "—";
      const horaFin = e.sesion?.horaFin || "—";
      
      const tecnica = e.tecnica ?? "—";
      const tactica = e.tactica ?? "—";
      const actitudinal = e.actitudinal ?? "—";
      const fisica = e.fisica ?? "—";
      
      // Calcular promedio
      let promedio = "—";
      const notas = [e.tecnica, e.tactica, e.actitudinal, e.fisica].filter(n => n !== null && n !== undefined);
      if (notas.length > 0) {
        const suma = notas.reduce((acc, val) => acc + val, 0);
        promedio = (suma / notas.length).toFixed(2);
      }
      
      const fechaRegistro = e.fechaRegistro ? new Date(e.fechaRegistro).toLocaleDateString('es-CL') : "—";

      sheet.addRow({
        jugador: jugadorNombre,
        rut: rut,
        fechaSesion: fechaSesion,
        horaInicio: horaInicio,
        horaFin: horaFin,
        tecnica: tecnica,
        tactica: tactica,
        actitudinal: actitudinal,
        fisica: fisica,
        promedio: promedio,
        fechaRegistro: fechaRegistro
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="evaluaciones_${Date.now()}.xlsx"`
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

// GET /api/evaluaciones/pdf - Exportar evaluaciones a PDF
export async function exportarEvaluacionesPDF(req, res) {
  try {
    const { 
      jugadorId,
      sesionId,
      desde,
      hasta,
      q
    } = req.query;

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
      `attachment; filename="evaluaciones_${Date.now()}.pdf"`
    );

    doc.pipe(res);

    doc.fontSize(18).font("Helvetica-Bold").text("Evaluaciones de Jugadores", { align: "center" });
    doc.moveDown(1);

    evaluaciones.forEach((e, index) => {
      if (doc.y > 680) doc.addPage();

      const jugadorNombre = e.jugador?.usuario?.nombre 
        ? `${e.jugador.usuario.nombre} ${e.jugador.usuario.apellido || ''}`.trim()
        : "Usuario Desconocido";

      doc.fontSize(12).font("Helvetica-Bold").text(jugadorNombre);

      const rut = e.jugador?.usuario?.rut || "—";
      const fechaSesion = e.sesion?.fecha || "—";
      const horaInicio = e.sesion?.horaInicio || "—";
      const horaFin = e.sesion?.horaFin || "—";
      
      const tecnica = e.tecnica ?? "—";
      const tactica = e.tactica ?? "—";
      const actitudinal = e.actitudinal ?? "—";
      const fisica = e.fisica ?? "—";
      
      // Calcular promedio
      let promedio = "—";
      const notas = [e.tecnica, e.tactica, e.actitudinal, e.fisica].filter(n => n !== null && n !== undefined);
      if (notas.length > 0) {
        const suma = notas.reduce((acc, val) => acc + val, 0);
        promedio = (suma / notas.length).toFixed(2);
      }
      
      const fechaRegistro = e.fechaRegistro ? new Date(e.fechaRegistro).toLocaleDateString('es-CL') : "—";

      doc.font("Helvetica").fontSize(10).text(`
RUT: ${rut}
Sesión: ${fechaSesion} - ${horaInicio} a ${horaFin}
Técnica: ${tecnica}
Táctica: ${tactica}
Actitudinal: ${actitudinal}
Física: ${fisica}
Promedio: ${promedio}
Fecha Registro: ${fechaRegistro}
      `);

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
