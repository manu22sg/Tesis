import {
  crearSesion,
  obtenerSesiones,
  obtenerSesionPorId,
  actualizarSesion,
  eliminarSesion,
  crearSesionesRecurrentes,
  obtenerSesionesPorEstudiante,
  
} from '../services/sesionServices.js';
import { success, error, notFound, conflict } from '../utils/responseHandler.js';
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { parseDateLocal } from '../utils/dateLocal.js';


export async function postCrearSesion(req, res) {
  try {
    const [sesion, err] = await crearSesion(req.body);
    if (err) {
      if (err.includes('Cancha no encontrada') || 
          err.includes('Grupo no encontrado') ||
          err.includes('Debe especificar una cancha o una ubicación externa')) {
        return error(res, err, 400);
      }
      if (err.includes('Ya existe') || 
          err.includes('Conflicto') || 
          err.includes('Hay una reserva') ||
          err.includes('partido de campeonato')) {
        return conflict(res, err);
      }
      return error(res, err, 500);
    }
    return success(res, sesion, 'Sesión creada exitosamente', 201);
  } catch (e) {
    console.error('postCrearSesion:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}

/** GET /api/sesiones */
export async function getSesiones(req, res) {
  try {
    const filtros = {
      q: req.query.q || '',
      fecha: req.query.fecha || null,
      canchaId: req.query.canchaId || null,
      grupoId: req.query.grupoId || null,
      tipoSesion: req.query.tipoSesion || null,
      horaInicio: req.query.horaInicio || null,
      horaFin: req.query.horaFin || null,
      page: req.query.page,
      limit: req.query.limit,
    };

    if (req.query.jugadorId) {
      filtros.jugadorId = parseInt(req.query.jugadorId);
    }

    const [result, err] = await obtenerSesiones(filtros);
    if (err) return error(res, err, 500);

    const { sesiones, pagination } = result;
    const msg = sesiones.length
      ? `${sesiones.length} sesión(es) — Página ${pagination.currentPage}/${pagination.totalPages}`
      : 'No se encontraron sesiones';

    return success(res, { sesiones, pagination }, msg);
  } catch (e) {
    console.error('getSesiones:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}

export async function getSesionPorId(req, res) {
  try {
    const { id } = req.body;
    const [sesion, err] = await obtenerSesionPorId(id);
    if (err) {
      if (err === 'Sesión no encontrada') return notFound(res, err);
      return error(res, err, 500);
    }
    return success(res, sesion, 'Sesión encontrada');
  } catch (e) {
    console.error('getSesionPorId:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}

export async function patchActualizarSesion(req, res) {
  try {
    const { id, ...rest } = req.body;
    const [sesion, err] = await actualizarSesion(id, rest);
    if (err) {
      if (err === 'Sesión no encontrada') return notFound(res, err);
      if (err.includes('Conflicto') || 
          err.includes('Grupo no encontrado') ||
          err.includes('partido de campeonato') ||
          err.includes('reserva') ||
          err.includes('Debe especificar una cancha o una ubicación externa') ||
          err.includes('No se puede cambiar el grupo')) {
        return conflict(res, err);
      }
      return error(res, err, 500);
    }
    return success(res, sesion, 'Sesión actualizada exitosamente');
  } catch (e) {
    console.error('patchActualizarSesion:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}

export async function deleteSesion(req, res) {
  try {
    const { id } = req.body;
    const [out, err] = await eliminarSesion(id);
    if (err) {
      if (err === 'Sesión no encontrada') return notFound(res, err);
      return error(res, err, 500);
    }
    return success(res, out, 'Sesión eliminada exitosamente');
  } catch (e) {
    console.error('deleteSesion:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}

export async function postSesionesRecurrentes(req, res) {
  try {
    const [resultado, err] = await crearSesionesRecurrentes(req.body);
    if (err) {
      if (err.includes('Debe especificar una cancha o una ubicación externa') ||
          err.includes('Grupo no encontrado') ||
          err.includes('Cancha no encontrada')) {
        return error(res, err, 400);
      }
      return error(res, err, 500);
    }

    const { sesionesCreadas, errores } = resultado;
    let msg = `${sesionesCreadas} sesión(es) creada(s)`;
    if (errores) msg += `. ${errores.length} fecha(s) con conflicto`;
    return success(res, resultado, msg, 201);
  } catch (e) {
    console.error('postSesionesRecurrentes:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}

export async function getSesionesPorEstudiante(req, res) {
  try {
    const usuarioId = req.user.id;
    const { page, limit } = req.query;

    const [result, err] = await obtenerSesionesPorEstudiante(usuarioId, { page, limit });

    if (err) return error(res, err, 400);

    const { sesiones, pagination } = result;
    const msg = sesiones.length
      ? `${sesiones.length} sesión(es) — Página ${pagination?.currentPage}/${pagination?.totalPages}`
      : 'No tienes sesiones registradas';

    return success(res, result, msg);
  } catch (e) {
    console.error('getSesionesPorEstudiante:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}

export async function exportarSesionesExcel(req, res) {
  try {
    const { mobile } = req.query;
    const isMobile = mobile === 'true';

    const [result, err] = await obtenerSesiones({ ...req.query, page: 1, limit: 5000 });
    if (err) {
      return res.status(400).json({ success: false, message: err });
    }

    const sesiones = result.sesiones;

    if (!sesiones || sesiones.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hay sesiones para exportar"
      });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "SPORTUBB";
    workbook.created = new Date();
    workbook.modified = new Date();

    const sheet = workbook.addWorksheet("Sesiones");

    sheet.columns = [
      { header: "Fecha", key: "fecha", width: 12 },
      { header: "Inicio", key: "horaInicio", width: 10 },
      { header: "Fin", key: "horaFin", width: 10 },
      { header: "Tipo", key: "tipoSesion", width: 20 },
      { header: "Grupo", key: "grupo", width: 25 },
      { header: "Cancha / Ubicación", key: "lugar", width: 30 },
      { header: "Token Activo", key: "tokenActivo", width: 12 },
      { header: "Token Vigente", key: "tokenVigente", width: 12 },
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

    sesiones.forEach(s => {
      sheet.addRow({
        fecha: parseDateLocal(s.fecha).toLocaleDateString('es-CL'),
        horaInicio: s.horaInicio?.slice(0, 5),
        horaFin: s.horaFin?.slice(0, 5),
        tipoSesion: s.tipoSesion,
        grupo: s.grupo?.nombre || s.grupo || "—",
        lugar: s.cancha?.nombre || s.ubicacionExterna || "—",
        tokenActivo: s.tokenActivo ? "Sí" : "No",
        tokenVigente: s.tokenVigente ? "Sí" : "No",
      });
    });

    // Agregar bordes a todas las celdas
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
        fileName: `sesiones_${fecha}.xlsx`,
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
      `attachment; filename="sesiones_${fecha}.xlsx"`
    );

    return res.send(buffer);

  } catch (error) {
    console.error("Error exportando sesiones a Excel:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error al exportar sesiones a Excel" 
    });
  }
}

export async function exportarSesionesPDF(req, res) {
  try {
    const { mobile } = req.query;
    const isMobile = mobile === 'true';

    const [result, err] = await obtenerSesiones({ ...req.query, page: 1, limit: 5000 });
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: err 
      });
    }

    const sesiones = result.sesiones;

    if (!sesiones || sesiones.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hay sesiones para exportar"
      });
    }

    const doc = new PDFDocument({ 
      margin: 40, 
      size: "A4",
      info: {
        Title: 'Listado de Sesiones',
        Author: 'SPORTUBB'
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
          fileName: `sesiones_${Date.now()}.pdf`,
          base64: pdfBuffer.toString("base64")
        });
      });
    } else {
      // 💻 WEB
      res.setHeader("Content-Type", "application/pdf");
      const fecha = new Date().toISOString().split('T')[0];
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="sesiones_${fecha}.pdf"`
      );
      doc.pipe(res);
    }

    // Título principal
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .text("Listado de Sesiones", { align: "center" });
    
    doc.fontSize(10)
       .font('Helvetica')
       .text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, { align: "center" });
    
    doc.moveDown(2);

    // Procesar cada sesión
    sesiones.forEach((s, index) => {
      // Verificar si necesitamos nueva página
      if (index > 0 && doc.y > 650) {
        doc.addPage();
      }

      const fecha = parseDateLocal(s.fecha).toLocaleDateString("es-CL");
      const horaInicio = s.horaInicio?.slice(0, 5);
      const horaFin = s.horaFin?.slice(0, 5);
      const nombreGrupo = s.grupo?.nombre || s.grupo || "Sin grupo";
      const nombreLugar = s.cancha?.nombre || s.ubicacionExterna || "—";

      // Encabezado de la sesión
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#1890FF')
         .text(`Sesión del ${fecha} — ${nombreGrupo}`, { continued: false });

      doc.moveDown(0.5);

      // Detalles de la sesión
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#000000');

      const detalles = [
        `Fecha: ${fecha}`,
        `Hora: ${horaInicio} - ${horaFin}`,
        `Tipo: ${s.tipoSesion}`,
        `Grupo: ${nombreGrupo}`,
        `Lugar: ${nombreLugar}`,
        `Token Activo: ${s.tokenActivo ? "Sí" : "No"}`,
        `Token Vigente: ${s.tokenVigente ? "Sí" : "No"}`
      ];

      detalles.forEach(detalle => {
        doc.text(detalle);
      });

      doc.moveDown(1);

      // Línea separadora entre sesiones
      if (index < sesiones.length - 1) {
        doc.moveTo(40, doc.y)
           .lineTo(555, doc.y)
           .strokeColor('#D9D9D9')
           .stroke();
        doc.moveDown(1);
      }
    });

    // Footer en última página
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
    console.error("Error exportando sesiones a PDF:", error);
    if (!res.headersSent) {
      return res.status(500).json({ 
        success: false, 
        message: "Error al exportar sesiones a PDF" 
      });
    }
  }
}
