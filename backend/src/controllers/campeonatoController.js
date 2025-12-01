import {
  crearCampeonato, listarCampeonatos, obtenerCampeonato,
  actualizarCampeonato, eliminarCampeonato
} from "../services/campeonatoServices.js";
import { obtenerPartidosConRelaciones } from '../services/partidoServices.js';
import dayjs from "dayjs";

import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

import { success, error } from "../utils/responseHandler.js";
import {
  sortearPrimeraRonda, generarSiguienteRonda
} from "../services/fixtureServices.js";

export const postCampeonato = async (req, res) => {
  try {
    const data = await crearCampeonato(req.body);
    return success(res, data, "Campeonato creado exitosamente", 201);
  } catch (e) { 
    return error(res, e.message, 400);
  }
};

export const getCampeonatos = async (_req, res) => {
  try { 
    const data = await listarCampeonatos();
    return success(res, data);
  }
  catch (e) { 
    return error(res, e.message, 400);
  }
};

export const getCampeonato = async (req, res) => {
  try {
    const data = await obtenerCampeonato(req.params.id);
    if (!data) return error(res, "Campeonato no encontrado", 404);
    return success(res, data);
  } catch (e) { 
    return error(res, e.message, 400);
  }
};

export const putCampeonato = async (req, res) => {
  try { 
    const data = await actualizarCampeonato(req.params.id, req.body);
    return success(res, data, "Campeonato actualizado exitosamente");
  }
  catch (e) { 
    return error(res, e.message, 400);
  }
};

export const deleteCampeonato = async (req, res) => {
  try { 
    const data = await eliminarCampeonato(req.params.id);
    return success(res, data, "Campeonato eliminado exitosamente");
  }
  catch (e) {
    console.log("Error al eliminar campeonato ID:", req.params.id, e); 
    return error(res, e.message, 400);
  }
};

// Fixture
export const postSortearPrimeraRonda = async (req, res) => {
  try { 
    const data = await sortearPrimeraRonda({ campeonatoId: req.params.id });
    return success(res, data, "Primera ronda sorteada exitosamente");
  }
  catch (e) { 
    return error(res, e.message, 400);
  }
};

export const postGenerarSiguienteRonda = async (req, res) => {
  try {
    const { rondaAnterior } = req.body;
    const resultado = await generarSiguienteRonda({ 
      campeonatoId: req.params.id, 
      rondaAnterior 
    });
    return success(res, resultado, "Siguiente ronda generada exitosamente");
  } catch (e) { 
    return error(res, e.message, 400);
  }
};


export async function exportarCampeonatosExcel(req, res) {
  try {
    const { 
      mobile,
      formato,
      genero,
      anio,
      semestre,
      estado,
      tipoCampeonato
    } = req.query;

    const isMobile = mobile === 'true';

    // Obtener todos los campeonatos
    const campeonatos = await listarCampeonatos();

    if (!campeonatos || campeonatos.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hay campeonatos para exportar"
      });
    }

    // Aplicar filtros
    let campeonatosFiltrados = campeonatos;

    if (formato) {
      campeonatosFiltrados = campeonatosFiltrados.filter(c => c.formato === formato);
    }
    if (genero) {
      campeonatosFiltrados = campeonatosFiltrados.filter(c => c.genero === genero);
    }
    if (anio) {
      campeonatosFiltrados = campeonatosFiltrados.filter(c => c.anio === parseInt(anio));
    }
    if (semestre) {
      campeonatosFiltrados = campeonatosFiltrados.filter(c => c.semestre === parseInt(semestre));
    }
    if (estado) {
      campeonatosFiltrados = campeonatosFiltrados.filter(c => c.estado === estado);
    }
    if (tipoCampeonato) {
      campeonatosFiltrados = campeonatosFiltrados.filter(c => c.tipoCampeonato === tipoCampeonato);
    }

    if (campeonatosFiltrados.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hay campeonatos que coincidan con los filtros"
      });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "SPORTUBB";
    workbook.created = new Date();
    workbook.modified = new Date();

    const sheet = workbook.addWorksheet("Campeonatos");

    sheet.columns = [
      { header: "Nombre", key: "nombre", width: 35 },
      { header: "Tipo", key: "tipo", width: 15 },
      { header: "Formato", key: "formato", width: 12 },
      { header: "Género", key: "genero", width: 12 },
      { header: "Año", key: "anio", width: 10 },
      { header: "Semestre", key: "semestre", width: 10 },
      { header: "Estado", key: "estado", width: 15 },
      { header: "Cantidad Equipos", key: "cantidadEquipos", width: 15 },
      { header: "Cantidad Partidos", key: "cantidadPartidos", width: 18 },
      { header: "Fecha Creación", key: "fechaCreacion", width: 18 }
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

    campeonatosFiltrados.forEach(c => {
      const formatearEstado = (estado) => {
        const map = {
          'creado': 'Creado',
          'en_juego': 'En Juego',
          'finalizado': 'Finalizado',
          'cancelado': 'Cancelado'
        };
        return map[estado] || estado;
      };

      const formatearGenero = (genero) => {
        return genero ? genero.charAt(0).toUpperCase() + genero.slice(1) : "—";
      };

      const formatearTipo = (tipo) => {
        return tipo === 'mechon' ? 'Mechón' : 'Intercarrera';
      };

      sheet.addRow({
        nombre: c.nombre || "—",
        tipo: formatearTipo(c.tipoCampeonato || 'intercarrera'),
        formato: c.formato || "—",
        genero: formatearGenero(c.genero),
        anio: c.anio || "—",
        semestre: c.semestre || "—",
        estado: formatearEstado(c.estado),
        cantidadEquipos: c.equipos?.length || 0,
        cantidadPartidos: c.partidos?.length || 0,
        fechaCreacion: c.fechaCreacion ? new Date(c.fechaCreacion).toLocaleDateString('es-CL') : "—"
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
        fileName: `campeonatos_${fecha}.xlsx`,
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
      `attachment; filename="campeonatos_${fecha}.xlsx"`
    );

    return res.send(buffer);

  } catch (err) {
    console.error("Error exportando campeonatos a Excel:", err);
    return res.status(500).json({
      success: false,
      message: "Error al exportar campeonatos a Excel"
    });
  }
}

export async function exportarCampeonatosPDF(req, res) {
  try {
    const { 
      mobile,
      formato,
      genero,
      anio,
      semestre,
      estado,
      tipoCampeonato
    } = req.query;

    const isMobile = mobile === 'true';

    // Obtener todos los campeonatos
    const campeonatos = await listarCampeonatos();

    if (!campeonatos || campeonatos.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hay campeonatos para exportar"
      });
    }

    // Aplicar filtros
    let campeonatosFiltrados = campeonatos;

    if (formato) {
      campeonatosFiltrados = campeonatosFiltrados.filter(c => c.formato === formato);
    }
    if (genero) {
      campeonatosFiltrados = campeonatosFiltrados.filter(c => c.genero === genero);
    }
    if (anio) {
      campeonatosFiltrados = campeonatosFiltrados.filter(c => c.anio === parseInt(anio));
    }
    if (semestre) {
      campeonatosFiltrados = campeonatosFiltrados.filter(c => c.semestre === parseInt(semestre));
    }
    if (estado) {
      campeonatosFiltrados = campeonatosFiltrados.filter(c => c.estado === estado);
    }
    if (tipoCampeonato) {
      campeonatosFiltrados = campeonatosFiltrados.filter(c => c.tipoCampeonato === tipoCampeonato);
    }

    if (campeonatosFiltrados.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hay campeonatos que coincidan con los filtros"
      });
    }

    const doc = new PDFDocument({ 
      margin: 40,
      size: "A4",
      info: {
        Title: 'Listado de Campeonatos',
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
          fileName: `campeonatos_${Date.now()}.pdf`,
          base64: pdfBuffer.toString("base64")
        });
      });
    } else {
      // 💻 WEB
      res.setHeader("Content-Type", "application/pdf");
      const fecha = new Date().toISOString().split('T')[0];
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="campeonatos_${fecha}.pdf"`
      );
      doc.pipe(res);
    }

    // Título principal
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .text("Listado de Campeonatos", { align: "center" });
    
    doc.fontSize(10)
       .font('Helvetica')
       .text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, { align: "center" });
    
    doc.moveDown(2);

    campeonatosFiltrados.forEach((c, index) => {
      if (doc.y > 650) doc.addPage();

      const formatearEstado = (estado) => {
        const map = {
          'creado': 'Creado',
          'en_juego': 'En Juego',
          'finalizado': 'Finalizado',
          'cancelado': 'Cancelado'
        };
        return map[estado] || estado;
      };

      const formatearGenero = (genero) => {
        return genero ? genero.charAt(0).toUpperCase() + genero.slice(1) : "—";
      };

      const formatearTipo = (tipo) => {
        return tipo === 'mechon' ? 'Mechón' : 'Intercarrera';
      };

      // Encabezado del campeonato
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#1890FF')
         .text(c.nombre || "Campeonato sin nombre", { continued: false });

      doc.moveDown(0.5);

      // Detalles
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#000000');

      const detalles = [
        `Tipo: ${formatearTipo(c.tipoCampeonato || 'intercarrera')}`,
        `Formato: ${c.formato || "—"}`,
        `Género: ${formatearGenero(c.genero)}`,
        `Año/Semestre: ${c.anio || "—"} - Semestre ${c.semestre || "—"}`,
        `Estado: ${formatearEstado(c.estado)}`,
        `Cantidad de Equipos: ${c.equipos?.length || 0}`,
        `Cantidad de Partidos: ${c.partidos?.length || 0}`,
        `Fecha de Creación: ${c.fechaCreacion ? new Date(c.fechaCreacion).toLocaleDateString('es-CL') : "—"}`
      ];

      detalles.forEach(detalle => {
        doc.text(detalle);
      });

      doc.moveDown(1);

      // Línea separadora
      if (index < campeonatosFiltrados.length - 1) {
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

  } catch (err) {
    console.error("Error exportando campeonatos a PDF:", err);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Error al exportar campeonatos a PDF"
      });
    }
  }
}


export async function exportarFixtureExcel(req, res) {
  try {
    const { id: campeonatoId } = req.params;
    const { mobile } = req.query;
    const isMobile = mobile === "true";

    if (!campeonatoId) {
      return res.status(400).json({
        success: false,
        message: "campeonatoId es requerido"
      });
    }

    const campeonato = await obtenerCampeonato(campeonatoId);

    if (!campeonato) {
      return res.status(404).json({
        success: false,
        message: "Campeonato no encontrado"
      });
    }

    // Obtener partidos con todas sus relaciones (equipos y cancha)
    const partidos = await obtenerPartidosConRelaciones(campeonatoId);

    if (partidos.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hay partidos para exportar en este campeonato"
      });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Sistema de Gestión Deportiva";
    workbook.created = new Date();
    workbook.modified = new Date();

    const sheet = workbook.addWorksheet("Fixture");

    sheet.columns = [
      { header: "Ronda", key: "ronda", width: 20 },
      { header: "N° Partido", key: "numero", width: 12 },
      { header: "Equipo A", key: "equipoA", width: 30 },
      { header: "Goles A", key: "golesA", width: 10 },
      { header: "Goles B", key: "golesB", width: 10 },
      { header: "Equipo B", key: "equipoB", width: 30 },
      { header: "Ganador", key: "ganador", width: 30 },
      { header: "Penales", key: "penales", width: 15 },
      { header: "Fecha", key: "fecha", width: 15 },
      { header: "Hora", key: "hora", width: 15 },
      { header: "Cancha", key: "cancha", width: 20 },
      { header: "Estado", key: "estado", width: 15 }
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

    const formatearRonda = (ronda) => {
      const map = {
        'final': 'Final',
        'semifinal': 'Semifinal',
        'cuartos': 'Cuartos de Final',
        'octavos': 'Octavos de Final',
        'dieciseisavos': 'Dieciseisavos de Final'
      };
      return map[ronda] || ronda.replace('_', ' ').toUpperCase();
    };

    const formatearEstado = (estado) => {
      const map = {
        'pendiente': 'Pendiente',
        'programado': 'Programado',
        'en_curso': 'En Curso',
        'en_juego': 'En Juego',
        'finalizado': 'Finalizado',
        'cancelado': 'Cancelado'
      };
      return map[estado] || estado;
    };

    // Agrupar por ronda
    const partidosPorRonda = {};
    partidos.forEach(p => {
      if (!partidosPorRonda[p.ronda]) {
        partidosPorRonda[p.ronda] = [];
      }
      partidosPorRonda[p.ronda].push(p);
    });

    // Ordenar rondas
    const ordenRondas = ['final', 'semifinal', 'cuartos', 'octavos', 'dieciseisavos'];
    const rondasOrdenadas = Object.keys(partidosPorRonda).sort((a, b) => {
      const idxA = ordenRondas.indexOf(a);
      const idxB = ordenRondas.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA === -1 && idxB !== -1) return 1;
      if (idxA !== -1 && idxB === -1) return -1;
      return a.localeCompare(b);
    });

    rondasOrdenadas.forEach(ronda => {
      const partidosRonda = partidosPorRonda[ronda];
      partidosRonda.sort((a, b) => (a.ordenLlave || a.id) - (b.ordenLlave || b.id));

      partidosRonda.forEach((p, index) => {
        const equipoA = campeonato.equipos?.find(e => e.id === p.equipoAId);
        const equipoB = campeonato.equipos?.find(e => e.id === p.equipoBId);
        const ganador = campeonato.equipos?.find(e => e.id === p.ganadorId);

        const penalesTexto = p.definidoPorPenales 
          ? `${p.penalesA ?? 0} - ${p.penalesB ?? 0}`
          : "—";
        const hora = p.horaInicio && p.horaFin ? `${formatearHora(p.horaInicio)} - ${formatearHora(p.horaFin)}` : "—";

        const rowData = {
          ronda: index === 0 ? formatearRonda(ronda) : "",
          numero: index + 1,
          equipoA: equipoA?.nombre || "—",
          golesA: p.golesA ?? "—",
          golesB: p.golesB ?? "—",
          equipoB: equipoB?.nombre || "—",
          ganador: ganador?.nombre || "—",
          penales: penalesTexto,
fecha: p.fecha ? dayjs(p.fecha).local().format('DD/MM/YYYY') : 'Sin fecha',
          hora: hora,
          cancha: p.cancha?.nombre || "—",
          estado: formatearEstado(p.estado)
        };

        const row = sheet.addRow(rowData);

        // Resaltar primera fila de cada ronda
        if (index === 0) {
          row.getCell('ronda').font = { bold: true };
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF0F2F5' }
          };
        }

        // Colorear según estado
        const estadoCell = row.getCell('estado');
        if (p.estado === 'finalizado') {
          estadoCell.font = { color: { argb: 'FF52C41A' }, bold: true };
        } else if (p.estado === 'programado') {
          estadoCell.font = { color: { argb: 'FF1890FF' }, bold: true };
        }
      });

      // Línea separadora entre rondas
      sheet.addRow({});
    });

    // Ajustar bordes
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

    // 📱 MOBILE
    if (isMobile) {
      return res.json({
        success: true,
        fileName: `fixture_${campeonato.nombre.replace(/\s/g, '_')}_${Date.now()}.xlsx`,
        base64: buffer.toString("base64")
      });
    }

    // 💻 WEB
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="fixture_${campeonato.nombre.replace(/\s/g, '_')}_${Date.now()}.xlsx"`
    );
    res.setHeader("Content-Length", buffer.length);

    return res.send(buffer);

  } catch (err) {
    console.error("Error exportando fixture a Excel:", err);
    return res.status(500).json({
      success: false,
      message: "Error al exportar fixture",
      error: err.message
    });
  }
}

export async function exportarFixturePDF(req, res) {
  try {
    const { id: campeonatoId } = req.params;
    const { mobile } = req.query;
    const isMobile = mobile === "true";

    if (!campeonatoId) {
      return res.status(400).json({
        success: false,
        message: "campeonatoId es requerido"
      });
    }

    const campeonato = await obtenerCampeonato(campeonatoId);

    if (!campeonato) {
      return res.status(404).json({
        success: false,
        message: "Campeonato no encontrado"
      });
    }

    // Obtener partidos con todas sus relaciones (equipos y cancha)
    const partidos = await obtenerPartidosConRelaciones(campeonatoId);

    if (partidos.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hay partidos para exportar en este campeonato"
      });
    }

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    let chunks = [];

    // 📱 MOBILE
    if (isMobile) {
      doc.on("data", chunk => chunks.push(chunk));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(chunks);
        return res.json({
          success: true,
          fileName: `fixture_${campeonato.nombre.replace(/\s/g, '_')}_${Date.now()}.pdf`,
          base64: pdfBuffer.toString("base64")
        });
      });
    } else {
      // 💻 WEB
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="fixture_${campeonato.nombre.replace(/\s/g, '_')}_${Date.now()}.pdf"`
      );
      doc.pipe(res);
    }

    // Encabezado
    doc.fontSize(20).font('Helvetica-Bold').text(`Fixture - ${campeonato.nombre}`, { align: "center" });
    doc.fontSize(10).font('Helvetica').text(
      `${campeonato.formato} · ${campeonato.genero.charAt(0).toUpperCase() + campeonato.genero.slice(1)} · ${campeonato.anio} S${campeonato.semestre}`,
      { align: "center" }
    );
    doc.fontSize(9).text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, { align: "center" });
    doc.moveDown(2);

    const formatearRonda = (ronda) => {
      const map = {
        'final': 'Final',
        'semifinal': 'Semifinal',
        'cuartos': 'Cuartos de Final',
        'octavos': 'Octavos de Final',
        'dieciseisavos': 'Dieciseisavos de Final'
      };
      return map[ronda] || ronda.replace('_', ' ').toUpperCase();
    };

    const formatearEstado = (estado) => {
      const map = {
        'pendiente': 'Pendiente',
        'programado': 'Programado',
        'en_curso': 'En Curso',
        'en_juego': 'En Juego',
        'finalizado': 'Finalizado',
        'cancelado': 'Cancelado'
      };
      return map[estado] || estado;
    };

    // Agrupar por ronda
    const partidosPorRonda = {};
    partidos.forEach(p => {
      if (!partidosPorRonda[p.ronda]) {
        partidosPorRonda[p.ronda] = [];
      }
      partidosPorRonda[p.ronda].push(p);
    });

    // Ordenar rondas
    const ordenRondas = ['final', 'semifinal', 'cuartos', 'octavos', 'dieciseisavos'];
    const rondasOrdenadas = Object.keys(partidosPorRonda).sort((a, b) => {
      const idxA = ordenRondas.indexOf(a);
      const idxB = ordenRondas.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA === -1 && idxB !== -1) return 1;
      if (idxA !== -1 && idxB === -1) return -1;
      return a.localeCompare(b);
    });

    rondasOrdenadas.forEach((ronda, rondaIdx) => {
      if (rondaIdx > 0 && doc.y > 650) doc.addPage();

      const partidosRonda = partidosPorRonda[ronda];
      partidosRonda.sort((a, b) => (a.ordenLlave || a.id) - (b.ordenLlave || b.id));

      // Título de ronda
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#1890FF').text(formatearRonda(ronda));
      doc.moveDown(0.5);

      partidosRonda.forEach((p, index) => {
        if (doc.y > 720) doc.addPage();

        const equipoA = campeonato.equipos?.find(e => e.id === p.equipoAId);
        const equipoB = campeonato.equipos?.find(e => e.id === p.equipoBId);
        const ganador = campeonato.equipos?.find(e => e.id === p.ganadorId);

        // Número de partido
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000')
          .text(`Partido ${index + 1}`, { continued: false });

        // Equipos y resultado
        const resultado = p.golesA !== null && p.golesB !== null 
          ? `${p.golesA} - ${p.golesB}`
          : "Sin jugar";

        doc.fontSize(10).font('Helvetica').fillColor('#666666');
        doc.text(`   ${equipoA?.nombre || "Equipo A"} vs ${equipoB?.nombre || "Equipo B"}`);
        doc.text(`   Resultado: ${resultado}`);

        if (p.definidoPorPenales) {
          doc.text(`   Penales: ${p.penalesA ?? 0} - ${p.penalesB ?? 0}`);
        }

        if (ganador) {
          doc.fontSize(9).fillColor('#FFD700').text(`   Ganador: ${ganador.nombre}`);
          doc.fillColor('#666666');
        }

        // Info adicional
        const detalles = [];
if (p.fecha) detalles.push(`Fecha: ${dayjs(p.fecha).local().format('DD/MM/YYYY')}`);
        if (p.horaInicio) {
          const horaInicioFormateada = formatearHora(p.horaInicio);
          const horaFinFormateada = p.horaFin ? ` - ${formatearHora(p.horaFin)}` : '';
          detalles.push(`Hora: ${horaInicioFormateada}${horaFinFormateada}`);
        }
        if (p.cancha?.nombre) detalles.push(`Cancha: ${p.cancha.nombre}`);
        detalles.push(`Estado: ${formatearEstado(p.estado)}`);

        doc.fontSize(8).fillColor('#999999').text(`   ${detalles.join(' | ')}`);
        doc.fillColor('#000000');

        doc.moveDown(0.5);
      });

      if (rondaIdx < rondasOrdenadas.length - 1) {
        doc.moveDown(0.5);
        doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#D9D9D9").stroke();
        doc.moveDown(1);
      }
    });

    // Footer
    doc.fontSize(8).fillColor('#999999').text(
      `Documento generado automáticamente - ${new Date().toLocaleString('es-ES')}`,
      40,
      doc.page.height - 50,
      { align: 'center' }
    );

    doc.end();

  } catch (err) {
    console.error("Error exportando fixture a PDF:", err);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Error al exportar fixture",
        error: err.message
      });
    }
  }
}
function formatearHora(horaStr) {
  if (!horaStr) return "—";

  const [h, m] = horaStr.split(":");

  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');

  return `${hh}:${mm}`;
}