import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { 
  formatearFecha, 
  obtenerNombreCompleto,
  separarTitularesSuplentes 
} from '../utils/alineacionUtils.js';

/**
 * Genera un archivo Excel de la alineación
 */
export async function generarExcelAlineacion(alineacion) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SportUBB";
  const sheet = workbook.addWorksheet("Alineación");

  // Información de la sesión - Fila 1
  sheet.mergeCells('A1:E1');
  sheet.getCell('A1').value = 'Alineación';
  sheet.getCell('A1').font = { bold: true, size: 14 };
  sheet.getCell('A1').alignment = { horizontal: 'center' };

  let currentRow = 2;

  // Información de la sesión
  if (alineacion.sesion) {
    sheet.mergeCells(`A${currentRow}:E${currentRow}`);
    sheet.getCell(`A${currentRow}`).value = 
      `Fecha: ${formatearFecha(alineacion.sesion.fecha)} | Tipo: ${alineacion.sesion.tipoSesion}`;
    sheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
    currentRow++;

    // Lugar
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

  // Estadísticas
  if (alineacion.estadisticas) {
    sheet.mergeCells(`A${currentRow}:E${currentRow}`);
    sheet.getCell(`A${currentRow}`).value = 
      `Titulares: ${alineacion.estadisticas.titulares} | Suplentes: ${alineacion.estadisticas.suplentes}`;
    sheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
    sheet.getCell(`A${currentRow}`).font = { italic: true };
    currentRow++;
  }

  currentRow++; // Fila vacía

  // Ajustar anchos
  sheet.getColumn(1).width = 10;  // Dorsal
  sheet.getColumn(2).width = 30;  // Jugador
  sheet.getColumn(3).width = 15;  // RUT
  sheet.getColumn(4).width = 25;  // Posición
  sheet.getColumn(5).width = 40;  // Comentario

  // Separar titulares y suplentes
  const { titulares, suplentes } = separarTitularesSuplentes(alineacion.jugadores);

  // TITULARES
  if (titulares.length > 0) {
    const headerTitularesRow = sheet.getRow(currentRow);
    headerTitularesRow.values = ['', 'TITULARES', '', '', ''];
    headerTitularesRow.font = { bold: true, size: 12 };
    headerTitularesRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4CAF50' }
    };
    currentRow++;

    const headerRow = sheet.getRow(currentRow);
    headerRow.values = ['Dorsal', 'Jugador', 'RUT', 'Posición', 'Comentario'];
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9D9D9' }
    };
    currentRow++;

    titulares.forEach(j => {
      const row = sheet.getRow(currentRow);
      row.values = [
        j.orden || '—',
        obtenerNombreCompleto(j),
        j.jugador?.usuario?.rut || '—',
        j.posicion || '—',
        j.comentario || '—'
      ];
      currentRow++;
    });

    currentRow++; // Espacio entre secciones
  }

  // SUPLENTES
  if (suplentes.length > 0) {
    const headerSuplentesRow = sheet.getRow(currentRow);
    headerSuplentesRow.values = ['', 'SUPLENTES', '', '', ''];
    headerSuplentesRow.font = { bold: true, size: 12 };
    headerSuplentesRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFC107' }
    };
    currentRow++;

    const headerRow = sheet.getRow(currentRow);
    headerRow.values = ['Dorsal', 'Jugador', 'RUT', 'Posición', 'Comentario'];
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9D9D9' }
    };
    currentRow++;

    suplentes.forEach(j => {
      const row = sheet.getRow(currentRow);
      row.values = [
        j.orden || '—',
        obtenerNombreCompleto(j),
        j.jugador?.usuario?.rut || '—',
        j.posicion || '—',
        j.comentario || '—'
      ];
      currentRow++;
    });
  }

  // Bordes a todas las celdas con contenido
  const startRow = alineacion.sesion?.grupo?.nombre ? 6 : 5;
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber >= startRow) {
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

  return await workbook.xlsx.writeBuffer();
}

/**
 * Genera un archivo PDF de la alineación
 */
export function generarPDFAlineacion(alineacion, outputStream) {
  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(outputStream);

  // Título
  doc.fontSize(18).font("Helvetica-Bold").text("Alineación", { align: "center" });
  doc.moveDown(0.5);

  // Información de la sesión
  if (alineacion.sesion) {
    doc.fontSize(11).font("Helvetica")
      .text(`Sesión: ${formatearFecha(alineacion.sesion.fecha)} | ${alineacion.sesion.tipoSesion}`, 
        { align: "center" });
    
    if (alineacion.sesion.cancha?.nombre) {
      doc.text(`Cancha: ${alineacion.sesion.cancha.nombre}`, { align: "center" });
    } else if (alineacion.sesion.ubicacionExterna) {
      doc.text(`Lugar: ${alineacion.sesion.ubicacionExterna}`, { align: "center" });
    }

    if (alineacion.sesion.grupo?.nombre) {
      doc.text(`Grupo: ${alineacion.sesion.grupo.nombre}`, { align: "center" });
    }

    // Estadísticas
    if (alineacion.estadisticas) {
      doc.text(
        `Titulares: ${alineacion.estadisticas.titulares} | Suplentes: ${alineacion.estadisticas.suplentes}`,
        { align: "center" }
      );
    }
  }

  doc.moveDown(1);
  doc.moveTo(40, doc.y).lineTo(550, doc.y).strokeColor("#CCCCCC").stroke();
  doc.moveDown(1);

  const { titulares, suplentes } = separarTitularesSuplentes(alineacion.jugadores);

  // TITULARES
  if (titulares.length > 0) {
    doc.fontSize(14).font("Helvetica-Bold").fillColor("#4CAF50")
      .text("TITULARES", { align: "left" });
    doc.moveDown(0.5);

    titulares.forEach((j, index) => {
      if (doc.y > 700) doc.addPage();

      const dorsal = j.orden ? `#${j.orden}` : "—";
      const nombreCompleto = obtenerNombreCompleto(j);
      
      doc.fontSize(12).font("Helvetica-Bold").fillColor("#000000")
         .text(`${dorsal} - ${nombreCompleto}`, { continued: false });

      doc.font("Helvetica").fontSize(10).text(`
RUT: ${j.jugador?.usuario?.rut || "—"}
Posición: ${j.posicion || "—"}
${j.comentario ? `Comentario: ${j.comentario}` : ""}
      `);

      if (index < titulares.length - 1) {
        doc.moveTo(40, doc.y).lineTo(550, doc.y).strokeColor("#EEEEEE").stroke();
        doc.moveDown(0.5);
      }
    });

    doc.moveDown(1);
  }

  // SUPLENTES
  if (suplentes.length > 0) {
    if (doc.y > 650) doc.addPage();

    doc.fontSize(14).font("Helvetica-Bold").fillColor("#FFC107")
      .text("SUPLENTES", { align: "left" });
    doc.moveDown(0.5);

    suplentes.forEach((j, index) => {
      if (doc.y > 700) doc.addPage();

      const dorsal = j.orden ? `#${j.orden}` : "—";
      const nombreCompleto = obtenerNombreCompleto(j);
      
      doc.fontSize(12).font("Helvetica-Bold").fillColor("#000000")
         .text(`${dorsal} - ${nombreCompleto}`, { continued: false });

      doc.font("Helvetica").fontSize(10).text(`
RUT: ${j.jugador?.usuario?.rut || "—"}
Posición: ${j.posicion || "—"}
${j.comentario ? `Comentario: ${j.comentario}` : ""}
      `);

      if (index < suplentes.length - 1) {
        doc.moveTo(40, doc.y).lineTo(550, doc.y).strokeColor("#EEEEEE").stroke();
        doc.moveDown(0.5);
      }
    });
  }

  // Footer
  doc.moveDown(2);
  doc.fontSize(9).font("Helvetica").fillColor("#999999")
    .text(`Total de jugadores: ${alineacion.jugadores.length}`, { align: "center" });

  doc.end();
}