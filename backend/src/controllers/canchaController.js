import { 
  crearCancha, 
  obtenerCanchas, 
  obtenerCanchaPorId, 
  actualizarCancha, 
  eliminarCancha,
  reactivarCancha 
} from '../services/canchaServices.js';
import { success, error, notFound, conflict } from '../utils/responseHandler.js';
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

// POST /api/canchas - Crear nueva cancha
export async function postCrearCancha(req, res) {
  try {
    const [cancha, err] = await crearCancha(req.body);
    if (err) {
      if (err.includes('Ya existe una cancha')) return conflict(res, err);
      return error(res, err, 500);
    }
    return success(res, cancha, 'Cancha creada exitosamente', 201);
  } catch (e) {
    console.error('postCrearCancha:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}

//  GET /api/canchas - Obtener todas las canchas
export async function getCanchas(req, res) {
  try {
    const filtros = {
      estado: req.query.estado || undefined,
      q: req.query.q || undefined,
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 20
    };

    const [result, err] = await obtenerCanchas(filtros);
    if (err) return error(res, err, 500);

    const { canchas, pagination } = result;
    const msg = canchas.length
      ? `${canchas.length} cancha(s) — Página ${pagination.currentPage}/${pagination.totalPages}`
      : 'No se encontraron canchas';

  
    return res.status(200).json({
      success: true,
      message: msg,
      data: {
        canchas,
        pagination
      }
    });
  } catch (e) {
    console.error('getCanchas:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}


// POST /api/canchas/detalle - Obtener cancha por ID
export async function getCanchaPorId(req, res) {
  try {
    const { id } = req.body;
    const [cancha, err] = await obtenerCanchaPorId(id);
    if (err) {
      if (err === 'Cancha no encontrada') return notFound(res, err);
      return error(res, err, 500);
    }
    return success(res, cancha, 'Cancha encontrada');
  } catch (e) {
    console.error('getCanchaPorId:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}

// PATCH /api/canchas - Actualizar cancha
export async function patchActualizarCancha(req, res) {
  try {
    const { id, ...datosActualizacion } = req.body;
    const [cancha, err] = await actualizarCancha(id, datosActualizacion);
    if (err) {
      if (err === 'Cancha no encontrada') return notFound(res, err);
      if (err.includes('Ya existe una cancha')) return conflict(res, err);
      return error(res, err, 500);
    }
    return success(res, cancha, 'Cancha actualizada exitosamente');
  } catch (e) {
    console.error('patchActualizarCancha:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}

// DELETE /api/canchas/eliminar - Eliminar cancha
export async function deleteCancha(req, res) {
  try {
    const { id } = req.body;
    const [cancha, err] = await eliminarCancha(id);
    if (err) {
      if (err === 'Cancha no encontrada') return notFound(res, err);
      if (err.includes('reservas activas')) return conflict(res, err);
      return error(res, err, 500);
    }
    return success(res, cancha, 'Cancha eliminada exitosamente');
  } catch (e) {
    console.error('deleteCancha:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}

// PATCH /api/canchas/reactivar - Reactivar cancha
export async function patchReactivarCancha(req, res) {
  try {
    const { id } = req.body;
    const [cancha, err] = await reactivarCancha(id);
    if (err) {
      if (err === 'Cancha no encontrada') return notFound(res, err);
      if (err.includes('Solo se pueden reactivar')) return conflict(res, err);
      return error(res, err, 500);
    }
    return success(res, cancha, 'Cancha reactivada exitosamente');
  } catch (e) {
    console.error('patchReactivarCancha:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}

export async function exportarCanchasExcel(req, res) {
  try {
    const filtros = {
      estado: req.query.estado || undefined,
      q: req.query.q || undefined,
      page: 1,
      limit: 5000 // Exportar todas
    };

    const [result, err] = await obtenerCanchas(filtros);
    
    if (err) {
      return res.status(500).json({
        success: false,
        message: err
      });
    }

    const { canchas } = result;

    if (!canchas || canchas.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hay canchas para exportar"
      });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Sistema de Gestión Deportiva";
    const sheet = workbook.addWorksheet("Canchas");

    sheet.columns = [
      { header: "Nombre", key: "nombre", width: 30 },
      { header: "Descripción", key: "descripcion", width: 40 },
      { header: "Capacidad Máxima", key: "capacidad", width: 18 },
      { header: "Estado", key: "estado", width: 18 }
    ];

    sheet.getRow(1).font = { bold: true };

    canchas.forEach(c => {
      sheet.addRow({
        nombre: c.nombre || "—",
        descripcion: c.descripcion || "Sin descripción",
        capacidad: c.capacidadMaxima || "—",
        estado: formatearEstado(c.estado)
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="canchas_${Date.now()}.xlsx"`
    );
    res.setHeader("Content-Length", buffer.length);

    return res.send(buffer);

  } catch (error) {
    console.error("Error exportando canchas a Excel:", error);
    return res.status(500).json({
      success: false,
      message: "Error al exportar canchas",
      error: error.message
    });
  }
}

// GET /api/canchas/pdf - Exportar canchas a PDF
export async function exportarCanchasPDF(req, res) {
  try {
    const filtros = {
      estado: req.query.estado || undefined,
      q: req.query.q || undefined,
      page: 1,
      limit: 5000
    };

    const [result, err] = await obtenerCanchas(filtros);

    if (err) {
      return res.status(500).json({
        success: false,
        message: err
      });
    }

    const { canchas } = result;

    if (!canchas || canchas.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hay canchas para exportar"
      });
    }

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="canchas_${Date.now()}.pdf"`
    );

    doc.pipe(res);

    doc.fontSize(18).font("Helvetica-Bold").text("Listado de Canchas", { align: "center" });
    doc.moveDown(1);

    canchas.forEach((c, index) => {
      if (doc.y > 700) doc.addPage();

      doc.fontSize(14).font("Helvetica-Bold").text(c.nombre || "Cancha sin nombre");

      doc.font("Helvetica").fontSize(10).text(`
Descripción: ${c.descripcion || "Sin descripción"}
Capacidad Máxima: ${c.capacidadMaxima || "—"} personas
Estado: ${formatearEstado(c.estado)}
      `);

      if (index < canchas.length - 1) {
        doc.moveTo(40, doc.y).lineTo(550, doc.y).strokeColor("#CCCCCC").stroke();
        doc.moveDown(1);
      }
    });

    doc.end();

  } catch (error) {
    console.error("Error exportando canchas a PDF:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Error al exportar canchas"
      });
    }
  }
}

// Función auxiliar para formatear el estado
function formatearEstado(estado) {
  const estados = {
    disponible: "Disponible",
    mantenimiento: "En Mantenimiento",
    fuera_servicio: "Fuera de Servicio"
  };
  return estados[estado] || estado;
}
