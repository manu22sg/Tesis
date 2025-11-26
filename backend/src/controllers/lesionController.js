import { success, error, notFound } from '../utils/responseHandler.js';
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { crearLesion, obtenerLesiones, obtenerLesionPorId, actualizarLesion, eliminarLesion } from '../services/lesionServices.js';

export async function postCrearLesion(req, res) {
  const [data, err] = await crearLesion(req.body);
  if (err) return error(res, err, err.includes('no encontrada') ? 404 : 400);
  return success(res, data, 'Lesión registrada', 201);
}

export async function getLesiones(req, res) {
  const { page = 1, limit = 10, jugadorId, desde, hasta, q } = req.query; // ✅ Cambio aquí
  
  const filtros = {
    page: parseInt(page),     // ✅ Mapeo
    limit: parseInt(limit)    // ✅ Mapeo
  };
  
  if (jugadorId) filtros.jugadorId = parseInt(jugadorId);
  if (desde) filtros.desde = desde;
  if (hasta) filtros.hasta = hasta;
  if (q) filtros.q = q;
  
  // Si es estudiante, forzar su jugadorId
  if (req.user?.rol === 'estudiante' && req.user?.jugadorId) {
    filtros.jugadorId = req.user.jugadorId;
  }
  
  const [data, err] = await obtenerLesiones(filtros);
  if (err) return error(res, err);
  return success(res, data, 'Lesiones obtenidas');
}

export async function getLesionPorId(req, res) {
  const [data, err] = await obtenerLesionPorId(parseInt(req.params.id));
  if (err) return notFound(res, err);
  return success(res, data, 'Lesión encontrada');
}

export async function patchLesion(req, res) {
  const id = parseInt(req.params.id, 10);
  const payload = req.body;
  const [data, err] = await actualizarLesion(id, payload);
  if (err) return error(res, err, err.includes('no encontrada') ? 404 : 400);
  return success(res, data, 'Lesión actualizada');
}

export async function deleteLesion(req, res) {
  const [ok, err] = await eliminarLesion(parseInt(req.params.id));
  if (err) return error(res, err, err.includes('no encontrada') ? 404 : 400);
  return success(res, { eliminado: !!ok }, 'Lesión eliminada');
}



export async function exportarLesionesExcel(req, res) {
  try {
    const { jugadorId, desde, hasta, q } = req.query; // ✅ Ya validado

    const filtros = {
      page: 1,
      limit: 5000
    };
    
    if (jugadorId) filtros.jugadorId = parseInt(jugadorId);
    if (desde) filtros.desde = desde;
    if (hasta) filtros.hasta = hasta;
    if (q) filtros.q = q;

    // Si es estudiante, solo ve sus lesiones
    if (req.user?.rol === 'estudiante' && req.user?.jugadorId) {
      filtros.jugadorId = req.user.jugadorId;
    }

    const [resultado, err] = await obtenerLesiones(filtros);

    if (err) {
      return res.status(500).json({
        success: false,
        message: err
      });
    }

    const lesiones = resultado.lesiones || [];

    if (lesiones.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hay lesiones para exportar"
      });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Sistema de Gestión Deportiva";
    const sheet = workbook.addWorksheet("Lesiones");

    sheet.columns = [
      { header: "Jugador", key: "jugador", width: 30 },
      { header: "RUT", key: "rut", width: 15 },
      { header: "Diagnóstico", key: "diagnostico", width: 50 },
      { header: "Fecha Inicio", key: "fechaInicio", width: 15 },
      { header: "Fecha Alta Estimada", key: "fechaAltaEstimada", width: 20 },
      { header: "Fecha Alta Real", key: "fechaAltaReal", width: 20 },
      { header: "Estado", key: "estado", width: 15 },
      { header: "Días de Lesión", key: "diasLesion", width: 15 }
    ];

    sheet.getRow(1).font = { bold: true };

    lesiones.forEach(l => {
      const jugadorNombre = l.jugador?.usuario?.nombre 
        ? `${l.jugador.usuario.nombre} ${l.jugador.usuario.apellido || ''}`.trim()
        : "—";
      
      const rut = l.jugador?.usuario?.rut || "—";
      const fechaInicio = l.fechaInicio || "—";
      const fechaAltaEstimada = l.fechaAltaEstimada || "—";
      const fechaAltaReal = l.fechaAltaReal || "—";
      const estado = l.fechaAltaReal ? "Recuperado" : "Activa";
      
      let diasLesion = "—";
      if (l.fechaInicio) {
        const inicio = new Date(l.fechaInicio);
        const fin = l.fechaAltaReal ? new Date(l.fechaAltaReal) : new Date();
        const diffTime = Math.abs(fin - inicio);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        diasLesion = diffDays;
      }

      sheet.addRow({
        jugador: jugadorNombre,
        rut: rut,
        diagnostico: l.diagnostico || "—",
        fechaInicio: formatearFechaExcel(fechaInicio),
        fechaAltaEstimada: formatearFechaExcel(fechaAltaEstimada),
        fechaAltaReal: formatearFechaExcel(fechaAltaReal),
        estado: estado,
        diasLesion: diasLesion
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="lesiones_${Date.now()}.xlsx"`
    );
    res.setHeader("Content-Length", buffer.length);

    return res.send(buffer);

  } catch (error) {
    console.error("Error exportando lesiones a Excel:", error);
    return res.status(500).json({
      success: false,
      message: "Error al exportar lesiones",
      error: error.message
    });
  }
}

export async function exportarLesionesPDF(req, res) {
  try {
    const { jugadorId, desde, hasta, q } = req.query; // ✅ Ya validado

    const filtros = {
      page: 1,
      limit: 5000
    };
    
    if (jugadorId) filtros.jugadorId = parseInt(jugadorId);
    if (desde) filtros.desde = desde;
    if (hasta) filtros.hasta = hasta;
    if (q) filtros.q = q;

    // Si es estudiante, solo ve sus lesiones
    if (req.user?.rol === 'estudiante' && req.user?.jugadorId) {
      filtros.jugadorId = req.user.jugadorId;
    }

    const [resultado, err] = await obtenerLesiones(filtros);

    if (err) {
      return res.status(500).json({
        success: false,
        message: err
      });
    }

    const lesiones = resultado.lesiones || [];

    if (lesiones.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hay lesiones para exportar"
      });
    }

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="lesiones_${Date.now()}.pdf"`
    );

    doc.pipe(res);

    doc.fontSize(18).font("Helvetica-Bold").text("Listado de Lesiones", { align: "center" });
    doc.moveDown(1);

    lesiones.forEach((l, index) => {
      if (doc.y > 700) doc.addPage();

      const jugadorNombre = l.jugador?.usuario?.nombre 
        ? `${l.jugador.usuario.nombre} ${l.jugador.usuario.apellido || ''}`.trim()
        : "Usuario Desconocido";

      doc.fontSize(12).font("Helvetica-Bold").text(jugadorNombre);

      const rut = l.jugador?.usuario?.rut || "—";
      const diagnostico = l.diagnostico || "—";
      const fechaInicio = l.fechaInicio || "—";
      const fechaAltaEstimada = l.fechaAltaEstimada || "—";
      const fechaAltaReal = l.fechaAltaReal || "—";
      const estado = l.fechaAltaReal ? "Recuperado" : "Activa";

      let diasLesion = "—";
      if (l.fechaInicio) {
        const inicio = new Date(l.fechaInicio);
        const fin = l.fechaAltaReal ? new Date(l.fechaAltaReal) : new Date();
        const diffTime = Math.abs(fin - inicio);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        diasLesion = `${diffDays} días`;
      }

      doc.font("Helvetica").fontSize(10).text(`
RUT: ${rut}
Diagnóstico: ${diagnostico}
Fecha Inicio: ${formatearFechaExcel(fechaInicio)}
Fecha Alta Estimada: ${formatearFechaExcel(fechaAltaEstimada)}
Fecha Alta Real: ${formatearFechaExcel(fechaAltaReal)}
Estado: ${estado}
Días de Lesión: ${diasLesion}
      `);

      if (index < lesiones.length - 1) {
        doc.moveTo(40, doc.y).lineTo(550, doc.y).strokeColor("#CCCCCC").stroke();
        doc.moveDown(1);
      }
    });

    doc.end();

  } catch (error) {
    console.error("Error exportando lesiones a PDF:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Error al exportar lesiones"
      });
    }
  }
}

function formatearFechaExcel(fecha) {
  if (!fecha || fecha === "—") return "—";
  const d = new Date(fecha);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const anio = d.getFullYear();
  return `${dia}/${mes}/${anio}`;
}