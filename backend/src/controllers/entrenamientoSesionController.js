import {
  crearEntrenamiento,
  obtenerEntrenamientos,
  obtenerEntrenamientoPorId,
  actualizarEntrenamiento,
  eliminarEntrenamiento,
  obtenerEntrenamientosPorSesion,
  reordenarEntrenamientos,
  duplicarEntrenamiento,
  obtenerEstadisticasEntrenamientos,
  asignarEntrenamientosASesion
} from '../services/entrenamientoSesionServices.js';
import { success, error, notFound } from '../utils/responseHandler.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import dayjs from 'dayjs';



export async function crearEntrenamientoController(req, res) {
  try {
    const [entrenamiento, errorMsg] = await crearEntrenamiento(req.body);

    if (errorMsg) {
      if (errorMsg.includes('no encontrada') || errorMsg.includes('no encontrado')) {
        return notFound(res, errorMsg);
      }
      if (errorMsg.includes('Ya existe')) {
        return error(res, errorMsg, 409); // Conflict
      }
      return error(res, errorMsg, 400);
    }

    const mensaje = entrenamiento.sesionId
      ? 'Entrenamiento creado correctamente en la sesión'
      : 'Entrenamiento global creado correctamente';

    return success(res, entrenamiento, mensaje, 201);
  } catch (err) {
    console.error('Error en crearEntrenamientoController:', err);
    return error(res, 'Error interno del servidor', 500);
  }
}



export async function obtenerEntrenamientosController(req, res) {
  try {
    const filtros = {
      page: req.query.page,
      limit: req.query.limit,
      q: req.query.q,
      sesionId: req.query.sesionId,
    };

    const [resultado, errorMsg] = await obtenerEntrenamientos(filtros);

    if (errorMsg) {
      return error(res, errorMsg, 500);
    }

    const mensaje = resultado.entrenamientos.length > 0
      ? 'Entrenamientos obtenidos correctamente'
      : 'No se encontraron entrenamientos con los filtros aplicados';

    return success(res, resultado, mensaje, 200);
  } catch (err) {
    console.error('Error en obtenerEntrenamientosController:', err);
    return error(res, 'Error interno del servidor', 500);
  }
}


export async function obtenerEntrenamientoPorIdController(req, res) {
  try {
    const { id } = req.params;

    const [entrenamiento, errorMsg] = await obtenerEntrenamientoPorId(parseInt(id));

    if (errorMsg) {
      return notFound(res, errorMsg);
    }

    return success(res, entrenamiento, 'Entrenamiento obtenido correctamente', 200);
  } catch (err) {
    console.error('Error en obtenerEntrenamientoPorIdController:', err);
    return error(res, 'Error interno del servidor', 500);
  }
}


export async function actualizarEntrenamientoController(req, res) {
  try {
    const { id } = req.params;

    const [entrenamiento, errorMsg] = await actualizarEntrenamiento(parseInt(id), req.body);

    if (errorMsg) {
      // Manejar diferentes tipos de errores
      if (errorMsg.includes('no encontrada') || errorMsg.includes('no encontrado')) {
        return notFound(res, errorMsg);
      }
      if (errorMsg.includes('Ya existe')) {
        return error(res, errorMsg, 409); // Conflict
      }
      if (errorMsg.includes('no puede estar vacío') || errorMsg.includes('pasadas')) {
        return error(res, errorMsg, 400); // Bad Request
      }
      return error(res, errorMsg, 400);
    }

    return success(res, entrenamiento, 'Entrenamiento actualizado correctamente', 200);
  } catch (err) {
    console.error('Error en actualizarEntrenamientoController:', err);
    return error(res, 'Error interno del servidor', 500);
  }
}


export async function eliminarEntrenamientoController(req, res) {
  try {
    const { id } = req.params;

    const [resultado, errorMsg] = await eliminarEntrenamiento(parseInt(id));

    if (errorMsg) {
      return notFound(res, errorMsg);
    }

    return success(res, null, resultado.message, 200);
  } catch (err) {
    console.error('Error en eliminarEntrenamientoController:', err);
    return error(res, 'Error interno del servidor', 500);
  }
}


export async function obtenerEntrenamientosPorSesionController(req, res) {
  try {
    const { sesionId } = req.params;

    const [entrenamientos, errorMsg] = await obtenerEntrenamientosPorSesion(parseInt(sesionId));

    if (errorMsg) {
      return notFound(res, errorMsg);
    }

    const mensaje = entrenamientos.length > 0
      ? `${entrenamientos.length} entrenamiento(s) encontrado(s) para la sesión`
      : 'No hay entrenamientos registrados para esta sesión';

    return success(res, entrenamientos, mensaje, 200);
  } catch (err) {
    console.error('Error en obtenerEntrenamientosPorSesionController:', err);
    return error(res, 'Error interno del servidor', 500);
  }
}

export async function reordenarEntrenamientosController(req, res) {
  try {
    const { sesionId, entrenamientos } = req.body;

    const [actualizados, errorMsg] = await reordenarEntrenamientos(sesionId, entrenamientos);

    if (errorMsg) {
      if (errorMsg.includes('no encontrada')) {
        return notFound(res, errorMsg);
      }
      return error(res, errorMsg, 400);
    }

    return success(
      res,
      { entrenamientosActualizados: actualizados.length, entrenamientos: actualizados },
      'Entrenamientos reordenados correctamente',
      200
    );
  } catch (err) {
    console.error('Error en reordenarEntrenamientosController:', err);
    return error(res, 'Error interno del servidor', 500);
  }
}

export async function duplicarEntrenamientoController(req, res) {
  try {
    const { id } = req.params;
    const { nuevaSesionId } = req.body;

    const [duplicado, errorMsg] = await duplicarEntrenamiento(
      parseInt(id),
      nuevaSesionId ? parseInt(nuevaSesionId) : null
    );

    if (errorMsg) {
      if (errorMsg.includes('no encontrado')) {
        return notFound(res, errorMsg);
      }
      return error(res, errorMsg, 400);
    }

    return success(res, duplicado, 'Entrenamiento duplicado correctamente', 201);
  } catch (err) {
    console.error('Error en duplicarEntrenamientoController:', err);
    return error(res, 'Error interno del servidor', 500);
  }
}
export async function obtenerEstadisticasController(req, res) {
  try {
    const { sesionId } = req.query;

    const [estadisticas, errorMsg] = await obtenerEstadisticasEntrenamientos(
      sesionId ? parseInt(sesionId) : null
    );

    if (errorMsg) {
      return error(res, errorMsg, 500);
    }

    const mensaje = sesionId
      ? `Estadísticas de entrenamientos para la sesión ${sesionId}`
      : 'Estadísticas generales de entrenamientos';

    return success(res, estadisticas, mensaje, 200);
  } catch (err) {
    console.error('Error en obtenerEstadisticasController:', err);
    return error(res, 'Error interno del servidor', 500);
  }
}

export async function asignarEntrenamientosController(req, res) {
  try {
    const { sesionId } = req.params;
    const { ids } = req.body;

    const [result, err] = await asignarEntrenamientosASesion(sesionId, ids);
    if (err) return error(res, err);

    return success(res, result, 'Entrenamientos asignados correctamente');
  } catch (err) {
    return error(res, err.message);
  }
}


export async function exportarEntrenamientosExcel(req, res) {
  try {
    const { mobile, q, sesionId } = req.query;
    const isMobile = mobile === 'true';

    const filtros = {
      q: q || null,
      sesionId: sesionId || null,
      page: 1,
      limit: 5000
    };

    const [result, err] = await obtenerEntrenamientos(filtros);
    if (err) {
      return res.status(400).json({ success: false, message: err });
    }

    const entrenamientos = result.entrenamientos;

    if (!entrenamientos || entrenamientos.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hay entrenamientos para exportar"
      });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Gestión Deportiva';
    workbook.created = new Date();
    workbook.modified = new Date();

    const sheet = workbook.addWorksheet("Entrenamientos");

    sheet.columns = [
      { header: "Orden", key: "orden", width: 10 },
      { header: "Título", key: "titulo", width: 30 },
      { header: "Descripción", key: "descripcion", width: 50 },
      { header: "Duración (min)", key: "duracionMin", width: 15 },
      { header: "Sesión", key: "sesion", width: 40 },
      { header: "Tipo", key: "tipo", width: 15 },
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

    entrenamientos.forEach(e => {
      let sesionInfo = 'Global';
      
      if (e.sesion) {
        // ✅ Formatear fecha y horas correctamente
        const fecha = e.sesion.fecha 
          ? dayjs(e.sesion.fecha).format('DD/MM/YYYY') 
          : 'Sin fecha';
        
        const horaInicio = e.sesion.horaInicio 
          ? e.sesion.horaInicio.slice(0, 5) // HH:mm
          : '';
        
        const horaFin = e.sesion.horaFin 
          ? e.sesion.horaFin.slice(0, 5) // HH:mm
          : '';
        
        const tipoSesion = e.sesion.tipoSesion || 'Sesión';
        
        sesionInfo = `${tipoSesion} - ${fecha} ${horaInicio}-${horaFin}`;
      } else if (e.sesionId) {
        sesionInfo = `Sesión #${e.sesionId}`;
      }

      sheet.addRow({
        orden: e.orden || '—',
        titulo: e.titulo,
        descripcion: e.descripcion || '—',
        duracionMin: e.duracionMin || '—',
        sesion: sesionInfo,
        tipo: e.sesionId ? 'Asignado' : 'Global',
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
        fileName: `entrenamientos_${fecha}.xlsx`,
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
      `attachment; filename="entrenamientos_${fecha}.xlsx"`
    );

    return res.send(buffer);

  } catch (error) {
    console.error("Error exportando entrenamientos a Excel:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error al exportar entrenamientos a Excel" 
    });
  }
}

export async function exportarEntrenamientosPDF(req, res) {
  try {
    const { mobile, q, sesionId } = req.query;
    const isMobile = mobile === 'true';

    const filtros = {
      q: q || null,
      sesionId: sesionId || null,
      page: 1,
      limit: 5000
    };

    const [result, err] = await obtenerEntrenamientos(filtros);
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: err 
      });
    }

    const entrenamientos = result.entrenamientos;

    if (!entrenamientos || entrenamientos.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hay entrenamientos para exportar"
      });
    }

    const doc = new PDFDocument({ 
      margin: 40, 
      size: "A4",
      info: {
        Title: 'Listado de Entrenamientos',
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
          fileName: `entrenamientos_${Date.now()}.pdf`,
          base64: pdfBuffer.toString("base64")
        });
      });
    } else {
      // 💻 WEB
      res.setHeader("Content-Type", "application/pdf");
      const fecha = new Date().toISOString().split('T')[0];
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="entrenamientos_${fecha}.pdf"`
      );
      doc.pipe(res);
    }

    // Título principal
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .text("Listado de Entrenamientos", { align: "center" });
    
    doc.fontSize(10)
       .font('Helvetica')
       .text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, { align: "center" });
    
    doc.moveDown(2);

    // Procesar cada entrenamiento
    entrenamientos.forEach((e, index) => {
      // Verificar si necesitamos nueva página
      if (index > 0 && doc.y > 650) {
        doc.addPage();
      }

      // ✅ Formatear información de sesión
      let sesionInfo = 'Global';
      
      if (e.sesion) {
        const fecha = e.sesion.fecha 
          ? dayjs(e.sesion.fecha).format('DD/MM/YYYY') 
          : 'Sin fecha';
        
        const horaInicio = e.sesion.horaInicio 
          ? e.sesion.horaInicio.slice(0, 5) 
          : '';
        
        const horaFin = e.sesion.horaFin 
          ? e.sesion.horaFin.slice(0, 5) 
          : '';
        
        const tipoSesion = e.sesion.tipoSesion || 'Sesión';
        
        sesionInfo = `${tipoSesion} - ${fecha} ${horaInicio}-${horaFin}`;
      } else if (e.sesionId) {
        sesionInfo = `Sesión #${e.sesionId}`;
      }

      const tipo = e.sesionId ? 'Asignado a sesión' : 'Entrenamiento global';

      // Encabezado del entrenamiento
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#1890FF')
         .text(`${e.orden || '—'}. ${e.titulo}`, { continued: false });

      doc.moveDown(0.5);

      // Detalles
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#000000');

      const detalles = [
        `Descripción: ${e.descripcion || '—'}`,
        `Duración: ${e.duracionMin ? `${e.duracionMin} minutos` : '—'}`,
        `Sesión: ${sesionInfo}`,
        `Tipo: ${tipo}`
      ];

      detalles.forEach(detalle => {
        doc.text(detalle);
      });

      doc.moveDown(1);

      // Línea separadora
      if (index < entrenamientos.length - 1) {
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
    console.error("Error exportando entrenamientos a PDF:", error);
    if (!res.headersSent) {
      return res.status(500).json({ 
        success: false, 
        message: "Error al exportar entrenamientos a PDF" 
      });
    }
  }
}