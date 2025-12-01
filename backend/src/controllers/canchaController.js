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
    const { mobile } = req.query;
    const isMobile = mobile === 'true';

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

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Sistema de Gestión Deportiva";
    workbook.created = new Date();
    workbook.modified = new Date();

    const sheet = workbook.addWorksheet("Canchas");

    sheet.columns = [
      { header: "Nombre", key: "nombre", width: 30 },
      { header: "Descripción", key: "descripcion", width: 40 },
      { header: "Capacidad Máxima", key: "capacidad", width: 18 },
      { header: "Estado", key: "estado", width: 18 }
    ];

    // Estilos del header
    sheet.getRow(1).font = { bold: true, size: 12 };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1890FF' }
    };
    sheet.getRow(1).font.color = { argb: 'FFFFFFFF' };
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(1).height = 25;

    canchas.forEach(c => {
      sheet.addRow({
        nombre: c.nombre || "—",
        descripcion: c.descripcion || "Sin descripción",
        capacidad: c.capacidadMaxima || "—",
        estado: formatearEstado(c.estado)
      });
    });

    // Agregar bordes
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
            left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
            bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
            right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
          };
        });
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const fecha = new Date().toISOString().split('T')[0];

    // 📱 MOBILE
    if (isMobile) {
      return res.json({
        success: true,
        fileName: `canchas_${fecha}.xlsx`,
        base64: buffer.toString("base64")
      });
    }

    // 💻 WEB
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="canchas_${fecha}.xlsx"`
    );

    return res.send(buffer);

  } catch (error) {
    console.error("Error exportando canchas a Excel:", error);
    return res.status(500).json({
      success: false,
      message: "Error al exportar canchas a Excel"
    });
  }
}

export async function exportarCanchasPDF(req, res) {
  try {
    const { mobile } = req.query;
    const isMobile = mobile === 'true';

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

    const doc = new PDFDocument({ 
      margin: 40,
      size: "A4",
      info: {
        Title: 'Listado de Canchas',
        Author: 'Sistema de Gestión Deportiva'
      }
    });

    let chunks = [];

    // 📱 MOBILE
    if (isMobile) {
      doc.on("data", chunk => chunks.push(chunk));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(chunks);
        return res.json({
          success: true,
          fileName: `canchas_${Date.now()}.pdf`,
          base64: pdfBuffer.toString("base64")
        });
      });
    } else {
      // 💻 WEB
      res.setHeader("Content-Type", "application/pdf");
      const fecha = new Date().toISOString().split('T')[0];
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="canchas_${fecha}.pdf"`
      );
      doc.pipe(res);
    }

    // Título principal
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .text("Listado de Canchas", { align: "center" });
    
    doc.fontSize(10)
       .font('Helvetica')
       .text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, { align: "center" });
    
    doc.moveDown(2);

    canchas.forEach((c, index) => {
      if (doc.y > 650) doc.addPage();

      // Encabezado de la cancha
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#1890FF')
         .text(c.nombre || "Cancha sin nombre", { continued: false });

      doc.moveDown(0.5);

      // Detalles
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#000000');

      const detalles = [
        `Descripción: ${c.descripcion || "Sin descripción"}`,
        `Capacidad Máxima: ${c.capacidadMaxima || "—"} personas`,
        `Estado: ${formatearEstado(c.estado)}`
      ];

      detalles.forEach(detalle => {
        doc.text(detalle);
      });

      doc.moveDown(1);

      // Línea separadora
      if (index < canchas.length - 1) {
        doc.moveTo(40, doc.y)
           .lineTo(555, doc.y)
           .strokeColor('#D9D9D9')
           .stroke();
        doc.moveDown(1);
      }
    });

    // Footer
    doc.fontSize(8)
       .fillColor('#999999')
       .text(
         `Documento generado automáticamente - ${new Date().toLocaleString('es-ES')}`,
         40,
         doc.page.height - 50,
         { align: 'center' }
       );

    doc.end();

  } catch (error) {
    console.error("Error exportando canchas a PDF:", error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Error al exportar canchas a PDF"
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
