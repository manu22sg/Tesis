import { success, error, notFound, conflict } from '../utils/responseHandler.js';
import {
  crearAlineacion,
  obtenerAlineacionPorSesion,
  agregarJugadorAlineacion,
  actualizarAlineacionJugador,
  quitarJugadorDeAlineacion,
  eliminarAlineacion,
  actualizarPosicionesJugadores,
     

} from '../services/alineacionServices.js';
import { generarAlineacionInteligente, obtenerFormacionesDisponibles } from '../services/alineacionInteligenteservices.js';
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";


export async function postCrearAlineacion(req, res) {
  const [data, err] = await crearAlineacion(req.body);
  if (err) return error(res, err, err.includes('Ya existe') || err.includes('No se puede repetir') ? 409 : 400);
  return success(res, data, 'Alineación creada', 201);
}

export async function getAlineacionPorSesion(req, res) {
  const sesionId = parseInt(req.params.sesionId, 10);
  const [data, err] = await obtenerAlineacionPorSesion(sesionId);
  if (err) return notFound(res, err);
  return success(res, data, 'Alineación de la sesión');
}

export async function postAgregarJugador(req, res) {
  const [data, err] = await agregarJugadorAlineacion(req.body);
  if (err) return error(res, err, err.includes('ya está') ? 409 : 400);
  return success(res, data, 'Jugador agregado a la alineación', 201);
}

export async function patchAlineacionJugador(req, res) {
  const [data, err] = await actualizarAlineacionJugador(req.body);
  if (err) return error(res, err, err.includes('no encontrado') ? 404 : 400);
  return success(res, data, 'Registro de alineación actualizado');
}

export async function deleteAlineacionJugador(req, res) {
  const alineacionId = parseInt(req.params.alineacionId, 10);
  const jugadorId    = parseInt(req.params.jugadorId, 10);
  const [ok, err] = await quitarJugadorDeAlineacion(alineacionId, jugadorId);
  if (err) return error(res, err, err.includes('no encontrado') ? 404 : 400);
  return success(res, { eliminado: !!ok }, 'Jugador removido de la alineación');
}

export async function deleteAlineacion(req, res) {
  const id = parseInt(req.params.id, 10);
  const [ok, err] = await eliminarAlineacion(id);
  if (err) return error(res, err, err.includes('no encontrada') ? 404 : 400);
  return success(res, { eliminada: !!ok }, 'Alineación eliminada');
}

export async function patchActualizarPosiciones(req, res) {
  const { alineacionId, jugadores } = req.body;
  
  const [data, err] = await actualizarPosicionesJugadores(alineacionId, jugadores);
  if (err) return error(res, err, 400);
  return success(res, data, 'Posiciones actualizadas');
}


export async function exportarAlineacionExcel(req, res) {
  try {
    const sesionId = parseInt(req.params.sesionId, 10);
    
    const [alineacion, err] = await obtenerAlineacionPorSesion(sesionId);
    
    if (err) {
      return res.status(404).json({
        success: false,
        message: err
      });
    }

    const jugadores = alineacion.jugadores || [];

    if (jugadores.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hay jugadores en la alineación para exportar"
      });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Sistema de Gestión Deportiva";
    const sheet = workbook.addWorksheet("Alineación");

    // Información de la sesión - Fila 1
    sheet.mergeCells('A1:E1');
    sheet.getCell('A1').value = `Alineación`;
    sheet.getCell('A1').font = { bold: true, size: 14 };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    // Fila 2 - Fecha y tipo
    let currentRow = 2;
    if (alineacion.sesion) {
      sheet.mergeCells(`A${currentRow}:E${currentRow}`);
      sheet.getCell(`A${currentRow}`).value = `Fecha: ${formatearFechaExcel(alineacion.sesion.fecha)} | Tipo: ${alineacion.sesion.tipoSesion}`;
      sheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
      currentRow++;

      // Cancha o Ubicación Externa
      sheet.mergeCells(`A${currentRow}:E${currentRow}`);
      const lugar = alineacion.sesion.cancha?.nombre 
        ? `Cancha: ${alineacion.sesion.cancha.nombre}`
        : alineacion.sesion.ubicacionExterna 
          ? `Lugar: ${alineacion.sesion.ubicacionExterna}`
          : 'Lugar: No especificado';
      sheet.getCell(`A${currentRow}`).value = lugar;
      sheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
      currentRow++;

      // Grupo
      if (alineacion.sesion.grupo?.nombre) {
        sheet.mergeCells(`A${currentRow}:E${currentRow}`);
        sheet.getCell(`A${currentRow}`).value = `Grupo: ${alineacion.sesion.grupo.nombre}`;
        sheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
        currentRow++;
      }
    }

    // Fila vacía
    currentRow++;

    // 🔥 Headers manualmente (sin usar sheet.columns que crea una fila automáticamente)
    const headerRow = sheet.getRow(currentRow);
    headerRow.values = ['Dorsal', 'Jugador', 'RUT', 'Posición', 'Comentario'];
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9D9D9' }
    };
    
    // Ajustar anchos de columnas
    sheet.getColumn(1).width = 10;  // Dorsal
    sheet.getColumn(2).width = 30;  // Jugador
    sheet.getColumn(3).width = 15;  // RUT
    sheet.getColumn(4).width = 25;  // Posición
    sheet.getColumn(5).width = 40;  // Comentario

    currentRow++;

    // Datos de jugadores ordenados por dorsal
    const jugadoresOrdenados = [...jugadores].sort((a, b) => {
      const ordenA = a.orden || 999;
      const ordenB = b.orden || 999;
      return ordenA - ordenB;
    });

    jugadoresOrdenados.forEach(j => {
      const row = sheet.getRow(currentRow);
      row.values = [
        j.orden || "—",
        j.jugador?.usuario?.nombre || "—",
        j.jugador?.usuario?.rut || "—",
        j.posicion || "—",
        j.comentario || "—"
      ];
      currentRow++;
    });

    // Ajustar bordes (desde la fila del header hasta el final)
    const headerRowNumber = alineacion.sesion?.grupo?.nombre ? 6 : 5;
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber >= headerRowNumber) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="alineacion_sesion_${sesionId}_${Date.now()}.xlsx"`
    );
    res.setHeader("Content-Length", buffer.length);

    return res.send(buffer);

  } catch (error) {
    console.error("Error exportando alineación a Excel:", error);
    return res.status(500).json({
      success: false,
      message: "Error al exportar alineación",
      error: error.message
    });
  }
}

export async function exportarAlineacionPDF(req, res) {
  try {
    const sesionId = parseInt(req.params.sesionId, 10);
    
    const [alineacion, err] = await obtenerAlineacionPorSesion(sesionId);
    
    if (err) {
      return res.status(404).json({
        success: false,
        message: err
      });
    }

    const jugadores = alineacion.jugadores || [];

    if (jugadores.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hay jugadores en la alineación para exportar"
      });
    }

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="alineacion_sesion_${sesionId}_${Date.now()}.pdf"`
    );

    doc.pipe(res);

    // Título
    doc.fontSize(18).font("Helvetica-Bold").text("Alineación", { align: "center" });
    doc.moveDown(0.5);

    // Información de la sesión
    if (alineacion.sesion) {
      doc.fontSize(11).font("Helvetica")
        .text(`Sesión: ${formatearFechaExcel(alineacion.sesion.fecha)} | ${alineacion.sesion.tipoSesion}`, { align: "center" });
      
      if (alineacion.sesion.cancha?.nombre) {
        doc.text(`Cancha: ${alineacion.sesion.cancha.nombre}`, { align: "center" });
      } else if (alineacion.sesion.ubicacionExterna) {
        doc.text(`Lugar: ${alineacion.sesion.ubicacionExterna}`, { align: "center" });
      }

      
      if (alineacion.sesion.grupo?.nombre) {
        doc.text(`Grupo: ${alineacion.sesion.grupo.nombre}`, { align: "center" });
      }
    }

    doc.moveDown(1);

    // Línea separadora
    doc.moveTo(40, doc.y).lineTo(550, doc.y).strokeColor("#CCCCCC").stroke();
    doc.moveDown(1);

    // Ordenar jugadores por dorsal
    const jugadoresOrdenados = [...jugadores].sort((a, b) => {
      const ordenA = a.orden || 999;
      const ordenB = b.orden || 999;
      return ordenA - ordenB;
    });

    // Lista de jugadores
    jugadoresOrdenados.forEach((j, index) => {
      if (doc.y > 700) doc.addPage();

      const dorsal = j.orden ? `#${j.orden}` : "—";
      
      doc.fontSize(12).font("Helvetica-Bold")
       .text(`${dorsal} - ${j.jugador?.usuario?.nombre || "Jugador"} ${j.jugador?.usuario?.apellido ? j.jugador?.usuario?.apellido : ""}`, { continued: false });

      doc.font("Helvetica").fontSize(10).text(`
RUT: ${j.jugador?.usuario?.rut || "—"}
Posición: ${j.posicion || "—"}
${j.comentario ? `Comentario: ${j.comentario}` : ""}
      `);

      if (index < jugadoresOrdenados.length - 1) {
        doc.moveTo(40, doc.y).lineTo(550, doc.y).strokeColor("#EEEEEE").stroke();
        doc.moveDown(0.5);
      }
    });

    // Footer
    doc.moveDown(2);
    doc.fontSize(9).font("Helvetica").fillColor("#999999")
      .text(`Total de jugadores: ${jugadores.length}`, { align: "center" });

    doc.end();

  } catch (error) {
    console.error("Error exportando alineación a PDF:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Error al exportar alineación"
      });
    }
  }
}

// Función auxiliar
function formatearFechaExcel(fecha) {
  if (!fecha) return "—";
  const d = new Date(fecha);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const anio = d.getFullYear();
  return `${dia}/${mes}/${anio}`;
}


export async function postGenerarAlineacionInteligente(req, res) {
  try {
    const { sesionId, grupoId, tipoAlineacion, formacion } = req.body;

    const [alineacion, err, status] = await generarAlineacionInteligente({
      sesionId,
      grupoId,
      tipoAlineacion,
      formacion
    });

    if (err) {
      // err puede ser un string o un objeto
      const message = typeof err === 'string' ? err : err.message;
      const extra = typeof err === 'object' ? err : null;

      return error(res, message, status || 400, extra);
    }

    return success(res, alineacion, 'Alineación inteligente generada exitosamente', 201);

  } catch (e) {
    console.error('postGenerarAlineacionInteligente:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}


export async function getFormacionesDisponibles(req, res) {
  try {
    const { tipo } = req.params; // 'ofensiva' | 'defensiva'
    
    if (!['ofensiva', 'defensiva'].includes(tipo)) {
      return error(res, 'Tipo debe ser "ofensiva" o "defensiva"', 400);
    }
    
    const formaciones = obtenerFormacionesDisponibles(tipo);
    return success(res, formaciones, `Formaciones ${tipo}s disponibles`);
    
  } catch (e) {
    console.error('getFormacionesDisponibles:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}
