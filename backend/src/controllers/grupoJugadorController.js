import {
  crearGrupo,
  obtenerTodosGrupos,
  obtenerGrupoPorId,
  actualizarGrupo,
  eliminarGrupo,
  // obtenerMiembrosDeGrupo
  obtenerGruposParaExportar
} from "../services/grupoJugadorServices.js";
import { success, error } from "../utils/responseHandler.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

export async function crearGrupoController(req, res) {
  const [grupo, err] = await crearGrupo(req.body);
  if (err) return error(res, err);
  return success(res, grupo, "Grupo creado correctamente");
}

export async function obtenerTodosGruposController(req, res) {
  try {
    
    const filtros = {
      nombre: req.query.nombre || undefined,
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 20
    };


    const [result, err] = await obtenerTodosGrupos(filtros);
    
    if (err) {
      console.error('❌ Controller - Error del servicio:', err);
      return error(res, err, 500);
    }

    

    const { grupos, pagination } = result;
    const msg = grupos.length
      ? `${grupos.length} grupo(s) — Página ${pagination.currentPage}/${pagination.totalPages}`
      : 'No se encontraron grupos';


    // Devolver con la estructura correcta
    return res.status(200).json({
      success: true,
      message: msg,
      data: {
        grupos,
        pagination
      }
    });
  } catch (e) {
    console.error('💥 Controller - Exception:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}


export async function obtenerGrupoPorIdController(req, res) {
  const [grupo, err] = await obtenerGrupoPorId(parseInt(req.params.id));
  if (err) return error(res, err);
  return success(res, grupo, "Grupo obtenido correctamente");
}

export async function actualizarGrupoController(req, res) {
  const [grupo, err] = await actualizarGrupo(parseInt(req.params.id), req.body);
  if (err) return error(res, err);
  return success(res, grupo, "Grupo actualizado correctamente");
}

export async function eliminarGrupoController(req, res) {
  const [ok, err] = await eliminarGrupo(parseInt(req.params.id));
  if (err) return error(res, err);
  return success(res, ok, "Grupo eliminado correctamente");
}

export async function obtenerMiembrosDeGrupoController(req, res) {
  const grupoId = parseInt(req.params.id);
  const { pagina, limite, estado, carrera, anioIngreso } = req.query;

  const [resultado, err] = await obtenerMiembrosDeGrupo(
    grupoId, pagina, limite, { estado, carrera, anioIngreso }
  );
  if (err) return error(res, err);
  return success(res, resultado, "Miembros obtenidos correctamente");
}


export async function exportarGruposExcel(req, res) {
  try {
    const filtros = {
      nombre: req.query.nombre || req.query.q || null,
    };

    const [grupos, err] = await obtenerGruposParaExportar(filtros);
    if (err) {
      return res.status(400).json({ success: false, message: err });
    }

    const workbook = new ExcelJS.Workbook();
    
    // Metadatos del archivo
    workbook.creator = 'Sistema de Gestión Deportiva';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    const sheet = workbook.addWorksheet("Grupos y Jugadores");

    // Configuración de columnas
    sheet.columns = [
      { header: "Grupo", key: "grupo", width: 25 },
      { header: "Descripción", key: "descripcion", width: 35 },
      { header: "Total Miembros", key: "totalMiembros", width: 15 },
      { header: "Nombre Jugador", key: "nombreJugador", width: 30 },
      { header: "RUT", key: "rut", width: 15 },
      { header: "Email", key: "email", width: 30 },
      { header: "Carrera", key: "carrera", width: 30 },
      { header: "Teléfono", key: "telefono", width: 15 },
      { header: "Año Ingreso", key: "anioIngreso", width: 12 },
      { header: "Estado", key: "estado", width: 12 },
    ];

    // Estilo del encabezado
    sheet.getRow(1).font = { bold: true, size: 12 };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1890FF' }
    };
    sheet.getRow(1).font.color = { argb: 'FFFFFFFF' };
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(1).height = 25;

    // Procesar cada grupo
    grupos.forEach((grupo) => {
      const jugadores = grupo.jugadorGrupos || [];
      const totalMiembros = jugadores.length;

      if (totalMiembros === 0) {
        // Grupo sin jugadores
        sheet.addRow({
          grupo: grupo.nombre,
          descripcion: grupo.descripcion || "",
          totalMiembros: 0,
          nombreJugador: "Sin jugadores",
          rut: "—",
          email: "—",
          carrera: "—",
          telefono: "—",
          anioIngreso: "—",
          estado: "—",
        });
      } else {
        // Agregar fila por cada jugador
        jugadores.forEach((jg, index) => {
          const jugador = jg.jugador;
          const usuario = jugador?.usuario;
          const carrera = usuario?.carrera; // ← Ahora carrera viene de Usuario

          const rowData = {
            // Solo mostrar nombre del grupo en la primera fila
            grupo: index === 0 ? grupo.nombre : "",
            descripcion: index === 0 ? (grupo.descripcion || "") : "",
            totalMiembros: index === 0 ? totalMiembros : "",
            nombreJugador: usuario?.nombre || "Sin nombre",
            rut: usuario?.rut || "—",
            email: usuario?.email || "—",
            carrera: carrera?.nombre || "—", // ← Acceder al nombre de la carrera
            telefono: jugador?.telefono || "—",
            anioIngreso: jugador?.anioIngreso || "—",
            estado: jugador?.estado || "—",
          };

          const row = sheet.addRow(rowData);

          // Resaltar primera fila de cada grupo
          if (index === 0) {
            row.getCell('grupo').font = { bold: true };
            row.getCell('totalMiembros').font = { bold: true };
            row.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF0F2F5' }
            };
          }

          // Colorear estado
          const estadoCell = row.getCell('estado');
          if (jugador?.estado === 'activo') {
            estadoCell.font = { color: { argb: 'FF52C41A' }, bold: true };
          } else {
            estadoCell.font = { color: { argb: 'FF8C8C8C' } };
          }
        });
      }

      // Línea separadora entre grupos (fila vacía)
      sheet.addRow({});
    });

    // Ajustar bordes
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Saltar encabezado
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

    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Headers de respuesta
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    
    const fecha = new Date().toISOString().split('T')[0];
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="grupos_${fecha}.xlsx"`
    );

    return res.send(buffer);
  } catch (error) {
    console.error("Error exportando grupos a Excel:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error al exportar grupos a Excel" });
  }
}

/**
 * Exporta grupos con detalle de jugadores a PDF
 */
export async function exportarGruposPDF(req, res) {
  try {
    const filtros = {
      nombre: req.query.nombre || req.query.q || null,
    };

    const [grupos, err] = await obtenerGruposParaExportar(filtros);
    if (err) {
      return res.status(400).json({ success: false, message: err });
    }

    const doc = new PDFDocument({ 
      margin: 40, 
      size: "A4",
      info: {
        Title: 'Listado de Grupos',
        Author: 'Sistema de Gestión Deportiva'
      }
    });

    res.setHeader("Content-Type", "application/pdf");
    
    const fecha = new Date().toISOString().split('T')[0];
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="grupos_${fecha}.pdf"`
    );

    doc.pipe(res);

    // Título principal
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .text("Listado de Grupos y Jugadores", { align: "center" });
    
    doc.fontSize(10)
       .font('Helvetica')
       .text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, { align: "center" });
    
    doc.moveDown(2);

    // Procesar cada grupo
    grupos.forEach((grupo, index) => {
      // Verificar si necesitamos nueva página
      if (index > 0 && doc.y > 650) {
        doc.addPage();
      }

      const jugadores = grupo.jugadorGrupos || [];
      const totalMiembros = jugadores.length;

      // Encabezado del grupo
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#1890FF')
         .text(`📁 ${grupo.nombre}`, { continued: false });

      if (grupo.descripcion) {
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#666666')
           .text(`   ${grupo.descripcion}`, { continued: false });
      }

      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor('#000000')
         .text(`   Total de miembros: ${totalMiembros}`, { continued: false });

      doc.moveDown(0.5);

      // Listar jugadores
      if (totalMiembros === 0) {
        doc.fontSize(10)
           .font('Helvetica-Oblique')
           .fillColor('#999999')
           .text("   Sin jugadores asignados");
      } else {
        jugadores.forEach((jg, idx) => {
          const jugador = jg.jugador;
          const usuario = jugador?.usuario;
          const carrera = usuario?.carrera; // ← Ahora carrera viene de Usuario

          // Verificar espacio para el jugador
          if (doc.y > 700) {
            doc.addPage();
          }

          doc.fontSize(10)
             .font('Helvetica-Bold')
             .fillColor('#000000')
             .text(`   ${idx + 1}. ${usuario?.nombre || 'Sin nombre'}`, { continued: false });

          doc.fontSize(9)
             .font('Helvetica')
             .fillColor('#666666');

          const detalles = [
            `      RUT: ${usuario?.rut || '—'}`,
            `      Email: ${usuario?.email || '—'}`,
            `      Carrera: ${carrera?.nombre || '—'}`, // ← Acceder al nombre de la carrera
            `      Teléfono: ${jugador?.telefono || '—'}`,
            `      Año Ingreso: ${jugador?.anioIngreso || '—'}`,
            `      Estado: ${(jugador?.estado || '—').toUpperCase()}`,
          ];

          detalles.forEach(detalle => {
            doc.text(detalle);
          });

          doc.moveDown(0.3);
        });
      }

      doc.moveDown(1);
      
      // Línea separadora entre grupos
      if (index < grupos.length - 1) {
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
    console.error("Error exportando grupos a PDF:", error);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Error al exportar grupos a PDF" });
    }
  }
}
