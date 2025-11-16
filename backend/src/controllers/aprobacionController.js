import { 
  aprobarReserva,
  rechazarReserva,
  obtenerReservasPendientes,
  obtenerEstadisticasReservas
} from '../services/aprobacionServices.js';
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { success, error, notFound, conflict } from '../utils/responseHandler.js';



// PATCH /api/reservas/aprobar - Aprobar una reserva
 
export async function patchAprobarReserva(req, res) {
  try {
    const { id, observacion } = req.body;
    const entrenadorId = req.user?.id; // Viene del middleware de autenticación
    const userId = entrenadorId;

    const [reserva, err] = await aprobarReserva(id, userId, observacion);

    if (err) {
      if (err === 'Reserva no encontrada') {
        return notFound(res, err);
      }
      
      if (err.includes('No se puede aprobar') || err.includes('estado')) {
        return conflict(res, err);
      }
      
      return error(res, err, 500);
    }

    return success(res, reserva, 'Reserva aprobada exitosamente');

  } catch (e) {
    console.error('patchAprobarReserva:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}


 // PATCH /api/reservas/rechazar - Rechazar una reserva
 
export async function patchRechazarReserva(req, res) {
  try {
    const { id, motivoRechazo } = req.body;
    const entrenadorId = req.user?.id; // Viene del middleware de autenticación
    
    // Para testing sin auth, usar ID fijo
    const userId = entrenadorId || 1; // Cambiar cuando tengas auth

    const [reserva, err] = await rechazarReserva(id, userId, motivoRechazo);

    if (err) {
      if (err === 'Reserva no encontrada') {
        return notFound(res, err);
      }
      
      if (err.includes('No se puede rechazar') || err.includes('estado')) {
        return conflict(res, err);
      }
      
      return error(res, err, 500);
    }

    return success(res, reserva, 'Reserva rechazada exitosamente');

  } catch (e) {
    console.error('patchRechazarReserva:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}


 //GET /api/reservas/pendientes - Obtener reservas pendientes de aprobación
 
export async function getReservasPendientes(req, res) {
  try {
    const filtros = {
      estado: req.query.estado || undefined,
      fecha: req.query.fecha || undefined,
      canchaId: req.query.canchaId ? parseInt(req.query.canchaId) : undefined,
      usuarioId: req.query.usuarioId ? parseInt(req.query.usuarioId) : undefined,
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 10
    };

    const [result, err] = await obtenerReservasPendientes(filtros);

    if (err) {
      return error(res, err, 500);
    }

    const { reservas, pagination } = result;

    const mensaje = reservas.length > 0 ? 
      `${reservas.length} reserva(s) - Página ${pagination.currentPage} de ${pagination.totalPages}` : 
      'No hay reservas';

    return success(res, { reservas, pagination }, mensaje);

  } catch (e) {
    console.error('getReservasPendientes:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}


//  PATCH /api/reservas/cambiar-estado - Cambiar estado de reserva (función genérica)
 


 // POST /api/reservas/estadisticas - Obtener estadísticas para dashboard
export async function getEstadisticasReservas(req, res) {
  try {
    const [estadisticas, err] = await obtenerEstadisticasReservas();

    if (err) {
      return error(res, err, 500);
    }

    return success(res, estadisticas, 'Estadísticas de reservas obtenidas');

  } catch (e) {
    console.error('getEstadisticasReservas:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}

export async function exportarReservasExcel(req, res) {
  try {
    const filtros = {
      estado: req.query.estado || undefined,
      fecha: req.query.fecha || undefined,
      canchaId: req.query.canchaId ? parseInt(req.query.canchaId) : undefined,
      usuarioId: req.query.usuarioId ? parseInt(req.query.usuarioId) : undefined,
      page: 1,
      limit: 5000 
    };

    const [result, err] = await obtenerReservasPendientes(filtros);

    if (err) {
      return res.status(500).json({
        success: false,
        message: err
      });
    }

    const { reservas } = result;

    if (!reservas || reservas.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hay reservas para exportar"
      });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Sistema de Gestión Deportiva";
    const sheet = workbook.addWorksheet("Reservas");

    sheet.columns = [
      { header: "Usuario", key: "usuario", width: 30 },
      { header: "RUT", key: "rut", width: 15 },
      { header: "Cancha", key: "cancha", width: 25 },
      { header: "Fecha Reserva", key: "fecha", width: 15 },
      { header: "Hora Inicio", key: "horaInicio", width: 12 },
      { header: "Hora Fin", key: "horaFin", width: 12 },
      { header: "Estado", key: "estado", width: 15 },
      { header: "Participantes", key: "participantes", width: 15 },
      { header: "Lista Participantes", key: "listaParticipantes", width: 40 },
    ];

    sheet.getRow(1).font = { bold: true };

    reservas.forEach(r => {
      sheet.addRow({
        usuario: `${r.usuario?.nombre || ""} ${r.usuario?.apellido || ""}`.trim() || "—",
        rut: r.usuario?.rut || "—",
        cancha: r.cancha?.nombre || "—",
        fecha: formatearFechaExcel(r.fechaReserva),
        horaInicio: formatearHora(r.horaInicio) || "—",
        horaFin: formatearHora(r.horaFin) || "—",
        estado: formatearEstado(r.estado),
        participantes: r.participantes?.length || 0,
       listaParticipantes: r.participantes
  ?.map(p => `${p.usuario?.nombre} ${p.usuario?.apellido || ''}`.trim())
  .join(", ") || "—",


      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="reservas_${Date.now()}.xlsx"`
    );
    res.setHeader("Content-Length", buffer.length);

    return res.send(buffer);

  } catch (error) {
    console.error("Error exportando reservas a Excel:", error);
    return res.status(500).json({
      success: false,
      message: "Error al exportar reservas",
      error: error.message
    });
  }
}

// GET /api/aprobacion/pdf - Exportar reservas a PDF
export async function exportarReservasPDF(req, res) {
  try {
    const filtros = {
      estado: req.query.estado || undefined,
      fecha: req.query.fecha || undefined,
      canchaId: req.query.canchaId ? parseInt(req.query.canchaId) : undefined,
      usuarioId: req.query.usuarioId ? parseInt(req.query.usuarioId) : undefined,
      page: 1,
      limit: 5000
    };

    const [result, err] = await obtenerReservasPendientes(filtros);

    if (err) {
      return res.status(500).json({
        success: false,
        message: err
      });
    }

    const { reservas } = result;

    if (!reservas || reservas.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hay reservas para exportar"
      });
    }

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="reservas_${Date.now()}.pdf"`
    );

    doc.pipe(res);

    doc.fontSize(18).font("Helvetica-Bold").text("Listado de Reservas", { align: "center" });
    doc.moveDown(1);

    reservas.forEach((r, index) => {
      if (doc.y > 700) doc.addPage();

doc.fontSize(12)
   .font("Helvetica-Bold")
   .text(
     `${r.usuario?.nombre || ""} ${r.usuario?.apellido || ""}`.trim() || "Usuario Desconocido"
   );

      doc.font("Helvetica").fontSize(10).text(`
RUT: ${r.usuario?.rut || "—"}
Cancha: ${r.cancha?.nombre || "—"}
Fecha: ${formatearFechaExcel(r.fechaReserva)}
Horario: ${formatearHora(r.horaInicio)} - ${formatearHora(r.horaFin)}
Estado: ${formatearEstado(r.estado)}
Participantes: ${r.participantes?.length || 0} personas
Nombres: ${
  r.participantes
    ?.map(p => `${p.usuario?.nombre} ${p.usuario?.apellido || ''}`.trim())
    .join(", ") || "—"
}

      `);

      if (index < reservas.length - 1) {
        doc.moveTo(40, doc.y).lineTo(550, doc.y).strokeColor("#CCCCCC").stroke();
        doc.moveDown(1);
      }
    });

    doc.end();

  } catch (error) {
    console.error("Error exportando reservas a PDF:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Error al exportar reservas"
      });
    }
  }
}

// Funciones auxiliares
function formatearEstado(estado) {
  const estados = {
    pendiente: "Pendiente",
    aprobada: "Aprobada",
    rechazada: "Rechazada",
    completada: "Completada",
    expirada: "Expirada",
    cancelada: "Cancelada"
  };
  return estados[estado] || estado;
}

function formatearFechaExcel(fecha) {
  if (!fecha) return "—";
  const d = new Date(fecha);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const anio = d.getFullYear();
  return `${dia}/${mes}/${anio}`;
}
function formatearHora(horaStr) {
  if (!horaStr) return "—";

  const [h, m] = horaStr.split(":");

  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');

  return `${hh}:${mm}`;
}

