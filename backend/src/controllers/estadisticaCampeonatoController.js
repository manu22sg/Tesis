import * as service from "../services/estadisticaCampeonatoServices.js";
import { success, error, notFound, conflict } from "../utils/responseHandler.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

export const crearEstadistica = async (req, res) => {
  try {
    const data = await service.crearEstadistica(req.body);
    return success(res, data, "Estadística creada correctamente");
  } catch (err) {
    if (err.message.includes("duplicadas") || err.message.includes("ya tiene")) {
      return conflict(res, err.message);
    }
    return error(res, err.message, 400);
  }
};

export const actualizarEstadistica = async (req, res) => {
  try {
    const data = await service.actualizarEstadistica(Number(req.params.id), req.body);
    if (!data) return notFound(res, "Estadística no encontrada");
    return success(res, data, "Estadística actualizada correctamente");
  } catch (err) {
    return error(res, err.message, 400);
  }
};

export const listarEstadisticas = async (req, res) => {
  try {
    const data = await service.listarEstadisticas(req.query);
    return success(res, data, "Listado de estadísticas");
  } catch (err) {
    return error(res, err.message);
  }
};

export const eliminarEstadistica = async (req, res) => {
  try {
    const data = await service.eliminarEstadistica(Number(req.params.id));
    return success(res, data, "Estadística eliminada correctamente");
  } catch (err) {
    if (err.message.includes("no encontrada")) return notFound(res, err.message);
    return error(res, err.message);
  }
};

export const obtenerEstadisticaPorId = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const data = await service.obtenerEstadisticaPorId(id);
    if (!data) return notFound(res, "Estadística no encontrada");
    return success(res, data, "Estadística obtenida correctamente");
  } catch (err) {
    console.error("Error obteniendo estadística:", err);
    return error(res, err.message, 400);
  }
};

export const getEstadisticasPorJugadorCampeonato = async (req, res) => {
  try {
    const { jugadorCampId, campId } = req.params;
    const data = await service.obtenerEstadisticasPorJugadorCampeonatoId(
      Number(jugadorCampId),
      Number(campId)
    );

    if (!data) return notFound(res, "No se encontraron estadísticas para este jugador");
    return success(res, data, "Estadísticas obtenidas correctamente");
  } catch (err) {
    return error(res, err.message);
  }
};


export const getEstadisticasPorUsuarioEnCampeonato = async (req, res) => {
  try {
    const { usuarioId, campId } = req.params;
    const data = await service.obtenerEstadisticasJugadorCampeonato(
      Number(usuarioId),
      Number(campId)
    );

    if (!data) return notFound(res, "No se encontraron estadísticas para este jugador en el campeonato");
    return success(res, data, "Estadísticas obtenidas correctamente");
  } catch (err) {
    return error(res, err.message);
  }
};

export const listarJugadoresPorEquipoYCampeonato = async (req, res) => {
  try {
    const { equipoId, campeonatoId } = req.params;
    const jugadores = await service.listarJugadoresPorEquipoYCampeonato(
      Number(equipoId),
      Number(campeonatoId)
    );
    return success(res, jugadores, "Jugadores obtenidos correctamente");
  } catch (err) {
    console.error("Error obteniendo jugadores:", err);
    return error(res, err.message, 400);
  }
};


export async function exportarEstadisticasCampeonatoExcel(req, res) {
  try {
    const { campeonatoId } = req.params;
    const { mobile, equipoId, q } = req.query;
    const isMobile = mobile === 'true';

    if (!campeonatoId) {
      return res.status(400).json({
        success: false,
        message: "campeonatoId es requerido"
      });
    }

    const filtros = { campeonatoId: Number(campeonatoId) };
    if (equipoId) filtros.equipoId = Number(equipoId);
    if (q) filtros.q = q;

    const { items: estadisticas } = await service.listarEstadisticas(filtros);

    if (!estadisticas || estadisticas.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hay estadísticas para exportar en este campeonato"
      });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Sistema de Gestión Deportiva";
    workbook.created = new Date();
    workbook.modified = new Date();

    const sheet = workbook.addWorksheet("Estadísticas");

    sheet.columns = [
      { header: "Jugador", key: "jugador", width: 30 },
      { header: "Equipo", key: "equipo", width: 30 },
      { header: "Partido", key: "partido", width: 35 },
      { header: "Ronda", key: "ronda", width: 20 },
      { header: "Goles", key: "goles", width: 10 },
      { header: "Asistencias", key: "asistencias", width: 12 },
      { header: "Atajadas", key: "atajadas", width: 10 },
      { header: "T. Amarillas", key: "tarjetasAmarillas", width: 12 },
      { header: "T. Rojas", key: "tarjetasRojas", width: 10 },
      { header: "Minutos", key: "minutosJugados", width: 10 }
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

    // Agrupar por equipo
    const estadisticasPorEquipo = {};
    estadisticas.forEach(e => {
      const equipoNombre = e.jugadorCampeonato?.equipo?.nombre || "Sin equipo";
      if (!estadisticasPorEquipo[equipoNombre]) {
        estadisticasPorEquipo[equipoNombre] = [];
      }
      estadisticasPorEquipo[equipoNombre].push(e);
    });

    const equiposOrdenados = Object.keys(estadisticasPorEquipo).sort();

    equiposOrdenados.forEach(equipoNombre => {
      const estadisticasEquipo = estadisticasPorEquipo[equipoNombre];
      
      estadisticasEquipo.forEach((e, index) => {
        let jugadorNombre = "Desconocido";
        
        if (e.jugadorCampeonato?.usuario) {
          const nombre = e.jugadorCampeonato.usuario.nombre || '';
          const apellido = e.jugadorCampeonato.usuario.apellido || '';
          jugadorNombre = `${(nombre).trim()} ${(apellido).trim()}`.trim() || `Usuario ID: ${e.jugadorCampeonato.usuarioId}`;
        }

        const equipoA = e.partido?.equipoA?.nombre || "Equipo A";
        const equipoB = e.partido?.equipoB?.nombre || "Equipo B";
        const partidoTexto = `${equipoA} vs ${equipoB}`;

        const rowData = {
          jugador: jugadorNombre,
          equipo: index === 0 ? equipoNombre : "",
          partido: partidoTexto,
          ronda: e.partido?.ronda || "—",
          goles: e.goles ?? 0,
          asistencias: e.asistencias ?? 0,
          atajadas: e.atajadas ?? 0,
          tarjetasAmarillas: e.tarjetasAmarillas ?? 0,
          tarjetasRojas: e.tarjetasRojas ?? 0,
          minutosJugados: e.minutosJugados ?? 0
        };

        const row = sheet.addRow(rowData);

        if (index === 0) {
          row.getCell('equipo').font = { bold: true };
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF0F2F5' }
          };
        }
      });

      sheet.addRow({});
    });

    // Bordes
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
        fileName: `estadisticas_campeonato_${campeonatoId}_${fecha}.xlsx`,
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
      `attachment; filename="estadisticas_campeonato_${campeonatoId}_${fecha}.xlsx"`
    );

    return res.send(buffer);

  } catch (error) {
    console.error("Error exportando estadísticas a Excel:", error);
    return res.status(500).json({
      success: false,
      message: "Error al exportar estadísticas a Excel"
    });
  }
}

export async function exportarEstadisticasCampeonatoPDF(req, res) {
  try {
    const { campeonatoId } = req.params;
    const { mobile, equipoId, q } = req.query;
    const isMobile = mobile === 'true';

    if (!campeonatoId) {
      return res.status(400).json({
        success: false,
        message: "campeonatoId es requerido"
      });
    }

    const filtros = { campeonatoId: Number(campeonatoId) };
    if (equipoId) filtros.equipoId = Number(equipoId);
    if (q) filtros.q = q;

    const { items: estadisticas } = await service.listarEstadisticas(filtros);

    if (!estadisticas || estadisticas.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hay estadísticas para exportar en este campeonato"
      });
    }

    const doc = new PDFDocument({ 
      margin: 40, 
      size: "A4",
      info: {
        Title: `Estadísticas del Campeonato ${campeonatoId}`,
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
          fileName: `estadisticas_campeonato_${campeonatoId}_${Date.now()}.pdf`,
          base64: pdfBuffer.toString("base64")
        });
      });
    } else {
      // 💻 WEB
      res.setHeader("Content-Type", "application/pdf");
      const fecha = new Date().toISOString().split('T')[0];
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="estadisticas_campeonato_${campeonatoId}_${fecha}.pdf"`
      );
      doc.pipe(res);
    }

    // Título principal
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .text("Estadísticas del Campeonato", { align: "center" });
    
    doc.fontSize(10)
       .font('Helvetica')
       .text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, { align: "center" });
    
    doc.moveDown(2);

    // Agrupar por equipo
    const estadisticasPorEquipo = {};
    estadisticas.forEach(e => {
      const equipoNombre = e.jugadorCampeonato?.equipo?.nombre || "Sin equipo";
      if (!estadisticasPorEquipo[equipoNombre]) {
        estadisticasPorEquipo[equipoNombre] = [];
      }
      estadisticasPorEquipo[equipoNombre].push(e);
    });

    const equiposOrdenados = Object.keys(estadisticasPorEquipo).sort();

    equiposOrdenados.forEach((equipoNombre, equipoIdx) => {
      if (equipoIdx > 0 && doc.y > 650) doc.addPage();

      const estadisticasEquipo = estadisticasPorEquipo[equipoNombre];

      // Título del equipo
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#1890FF')
         .text(equipoNombre, { continued: false });
      
      doc.moveDown(0.5);

      estadisticasEquipo.forEach((e, index) => {
        if (doc.y > 720) doc.addPage();

        let jugadorNombre = "Desconocido";
        
        if (e.jugadorCampeonato?.usuario) {
          const nombre = e.jugadorCampeonato.usuario.nombre || '';
          const apellido = e.jugadorCampeonato.usuario.apellido || '';
          jugadorNombre = `${(nombre).trim()} ${(apellido).trim()}`.trim() || `Usuario ID: ${e.jugadorCampeonato.usuarioId}`;
        }

        const equipoA = e.partido?.equipoA?.nombre || "Equipo A";
        const equipoB = e.partido?.equipoB?.nombre || "Equipo B";

        // Nombre del jugador
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fillColor('#000000')
           .text(`${index + 1}. ${jugadorNombre}`, { continued: false });

        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#666666');

        // Información del partido
        doc.text(`   Partido: ${equipoA} vs ${equipoB}`);
        if (e.partido?.ronda) {
          doc.text(`   Ronda: ${e.partido.ronda}`);
        }

        // Estadísticas
        const stats = [
          ` Goles: ${e.goles ?? 0}`,
          ` Asist: ${e.asistencias ?? 0}`,
          ` Ataj: ${e.atajadas ?? 0}`,
          ` Amarillas: ${e.tarjetasAmarillas ?? 0}`,
          `Roja: ${e.tarjetasRojas ?? 0}`,
          ` Minutos jugados: ${e.minutosJugados ?? 0}'`
        ];

        doc.text(`   ${stats.join(' | ')}`);

        doc.moveDown(0.3);
      });

      if (equipoIdx < equiposOrdenados.length - 1) {
        doc.moveDown(0.5);
        doc.moveTo(40, doc.y)
           .lineTo(555, doc.y)
           .strokeColor("#D9D9D9")
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
    console.error("Error exportando estadísticas a PDF:", error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Error al exportar estadísticas a PDF"
      });
    }
  }
}

