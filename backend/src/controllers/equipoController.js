import {
  registrarEquipo, actualizarEquipo, eliminarEquipo,
  listarEquiposPorCampeonato,
  insertarUsuarioEnEquipo, quitarUsuarioDelEquipo, listarJugadoresPorEquipo
} from "../services/equipoServices.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

import { success, error, notFound } from "../utils/responseHandler.js";

export const postEquipo = async (req, res) => {
  try { res.status(201).json(await registrarEquipo(req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
};

export const putEquipo = async (req, res) => {
  try { res.json(await actualizarEquipo(req.params.equipoId, req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
};

export const deleteEquipo = async (req, res) => {
  try { res.json(await eliminarEquipo(req.params.equipoId)); }
  catch (e) { res.status(400).json({ error: e.message }); }
};

export const getEquiposDeCampeonato = async (req, res) => {
  try { res.json(await listarEquiposPorCampeonato(req.params.campeonatoId)); }
  catch (e) { res.status(400).json({ error: e.message }); }
};

export const postAgregarUsuarioAEquipo = async (req, res) => {
  try {
    const { campeonatoId, equipoId, usuarioId, numeroCamiseta, posicion } = req.body;
    res.status(201).json(await insertarUsuarioEnEquipo({ campeonatoId, equipoId, usuarioId, numeroCamiseta, posicion }));
  } catch (e) { res.status(400).json({ error: e.message }); }
};

export const deleteUsuarioDeEquipo = async (req, res) => {
  try {
    const { campeonatoId, equipoId, usuarioId } = req.params;
    res.json(await quitarUsuarioDelEquipo({ campeonatoId, equipoId, usuarioId }));
  } catch (e) { res.status(400).json({ error: e.message }); }
};

export const listarJugadoresEquipo = async (req, res) => {
  try {
    const equipoId = Number(req.params.id);
    const data = await listarJugadoresPorEquipo(equipoId);
    return success(res, data, "Jugadores del equipo obtenidos correctamente");
  } catch (err) {
    if (err.message.includes("no encontrado")) return notFound(res, err.message);
    return error(res, err.message);
  }
};


export async function exportarEquiposExcel(req, res) {
  try {
    const { campeonatoId } = req.params;
    const { incluirJugadores = 'true' } = req.query;

    if (!campeonatoId) {
      return res.status(400).json({
        success: false,
        message: "campeonatoId es requerido"
      });
    }

    const equipos = await listarEquiposPorCampeonato(campeonatoId);

    if (!equipos || equipos.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hay equipos para exportar en este campeonato"
      });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Sistema de Gestión Deportiva";
    workbook.created = new Date();
    workbook.modified = new Date();

    // Una sola hoja: Equipos y Jugadores
    const sheet = workbook.addWorksheet("Equipos y Jugadores");
    
    sheet.columns = [
      { header: "Equipo", key: "equipo", width: 30 },
      { header: "Carrera", key: "carrera", width: 35 },
      { header: "Tipo", key: "tipo", width: 12 },
      { header: "Total Jugadores", key: "totalJugadores", width: 15 },
      { header: "Nombre", key: "nombre", width: 25 },
      { header: "Apellido", key: "apellido", width: 25 },
      { header: "RUT", key: "rut", width: 15 },
      { header: "Número", key: "numeroCamiseta", width: 10 },
      { header: "Posición", key: "posicion", width: 25 },
      { header: "Goles", key: "goles", width: 10 },
      { header: "Asistencias", key: "asistencias", width: 12 },
      { header: "Atajadas", key: "atajadas", width: 10 }
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

    const formatearTipo = (tipo) => {
      return tipo ? tipo.charAt(0).toUpperCase() + tipo.slice(1) : "—";
    };

    for (const equipo of equipos) {
      try {
        const dataJugadores = await listarJugadoresPorEquipo(equipo.id);
        const jugadores = dataJugadores.jugadores || [];
        const totalJugadores = jugadores.length;

        if (totalJugadores === 0) {
          // Equipo sin jugadores
          sheet.addRow({
            equipo: equipo.nombre,
            carrera: equipo.carrera?.nombre || "—",
            tipo: formatearTipo(equipo.tipo),
            totalJugadores: 0,
            nombre: "Sin jugadores",
            apellido: "—",
            rut: "—",
            numeroCamiseta: "—",
            posicion: "—",
            goles: "—",
            asistencias: "—",
            atajadas: "—"
          });
        } else {
          // Agregar fila por cada jugador
          jugadores.forEach((j, index) => {
            const rowData = {
              // Solo mostrar info del equipo en la primera fila
              equipo: index === 0 ? equipo.nombre : "",
              carrera: index === 0 ? (equipo.carrera?.nombre || "—") : "",
              tipo: index === 0 ? formatearTipo(equipo.tipo) : "",
              totalJugadores: index === 0 ? totalJugadores : "",
              nombre: j.nombre || "—",
              apellido: j.apellido || "—",
              rut: j.rut || "—",
              numeroCamiseta: j.numeroCamiseta ?? "—",
              posicion: j.posicion || "—",
              goles: j.goles ?? 0,
              asistencias: j.asistencias ?? 0,
              atajadas: j.atajadas ?? 0
            };

            const row = sheet.addRow(rowData);

            // Resaltar primera fila de cada equipo
            if (index === 0) {
              row.getCell('equipo').font = { bold: true };
              row.getCell('totalJugadores').font = { bold: true };
              row.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF0F2F5' }
              };
            }
          });
        }

        // Línea separadora entre equipos (fila vacía)
        sheet.addRow({});

      } catch (error) {
        console.error(`Error cargando jugadores del equipo ${equipo.id}:`, error);
      }
    }

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

    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="equipos_campeonato_${campeonatoId}_${Date.now()}.xlsx"`
    );
    res.setHeader("Content-Length", buffer.length);

    return res.send(buffer);

  } catch (error) {
    console.error("Error exportando equipos a Excel:", error);
    return res.status(500).json({
      success: false,
      message: "Error al exportar equipos",
      error: error.message
    });
  }
}

// GET /api/equipos/campeonato/:campeonatoId/pdf - Exportar equipos a PDF
export async function exportarEquiposPDF(req, res) {
  try {
    const { campeonatoId } = req.params;
    const { incluirJugadores = 'true' } = req.query;

    if (!campeonatoId) {
      return res.status(400).json({
        success: false,
        message: "campeonatoId es requerido"
      });
    }

    const equipos = await listarEquiposPorCampeonato(campeonatoId);

    if (!equipos || equipos.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hay equipos para exportar en este campeonato"
      });
    }

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="equipos_campeonato_${campeonatoId}_${Date.now()}.pdf"`
    );

    doc.pipe(res);

    doc.fontSize(18).font("Helvetica-Bold").text("Equipos del Campeonato", { align: "center" });
    doc.fontSize(10).font("Helvetica").text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, { align: "center" });
    doc.moveDown(2);

    for (let index = 0; index < equipos.length; index++) {
      const equipo = equipos[index];
      
      // Verificar si necesitamos nueva página (solo para nuevos equipos, no jugadores)
      if (index > 0 && doc.y > 650) doc.addPage();

      const formatearTipo = (tipo) => {
        return tipo ? tipo.charAt(0).toUpperCase() + tipo.slice(1) : "—";
      };

      // Encabezado del equipo
      doc.fontSize(14).font("Helvetica-Bold").fillColor('#1890FF').text(equipo.nombre || "Equipo sin nombre");

      doc.font("Helvetica").fontSize(10).fillColor('#666666').text(`   Carrera: ${equipo.carrera?.nombre || "—"}`);
      doc.text(`   Tipo: ${formatearTipo(equipo.tipo)}`);
      doc.fontSize(11).font("Helvetica-Bold").fillColor('#000000').text(`   Total de jugadores: ${equipo.jugadores?.length || 0}`);
      
      doc.moveDown(0.5);

      // Incluir jugadores si se solicita
      if (incluirJugadores === 'true') {
        try {
          const dataJugadores = await listarJugadoresPorEquipo(equipo.id);
          const jugadores = dataJugadores.jugadores || [];

          if (jugadores.length > 0) {
            jugadores.forEach((j, idx) => {
              // Solo cambiar de página si realmente no hay espacio (más restrictivo)
              if (doc.y > 720) doc.addPage();

              doc.fontSize(10).font("Helvetica-Bold").fillColor('#000000').text(
                `${idx + 1}. ${j.nombre || "—"} ${j.apellido || ""}`, { continued: false }
              );

              doc.fontSize(9).font("Helvetica").fillColor('#666666');

              const detalles = [
                `      RUT: ${j.rut || '—'}`,
                `      Número: ${j.numeroCamiseta ?? '—'} | Posición: ${j.posicion || 'Sin posición'}`,
                `      Goles: ${j.goles ?? 0} | Asistencias: ${j.asistencias ?? 0} | Atajadas: ${j.atajadas ?? 0}`,
              ];

              detalles.forEach(detalle => {
                doc.text(detalle);
              });

              doc.moveDown(0.3);
            });
          } else {
            doc.fontSize(10).font("Helvetica-Oblique").fillColor('#999999').text("   Sin jugadores registrados");
          }
        } catch (error) {
          console.error(`Error cargando jugadores del equipo ${equipo.id}:`, error);
          doc.fontSize(9).font("Helvetica-Oblique").fillColor('#999999').text("   Error al cargar jugadores");
        }
      }

      doc.moveDown(1);

      // Línea separadora entre equipos
      if (index < equipos.length - 1) {
        doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#D9D9D9").stroke();
        doc.moveDown(1);
      }
    }

    // Footer en última página
    doc.fontSize(8).fillColor('#999999').text(
      `Documento generado automáticamente - ${new Date().toLocaleString('es-ES')}`,
      40,
      doc.page.height - 50,
      { align: 'center' }
    );

    doc.end();

  } catch (error) {
    console.error("Error exportando equipos a PDF:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Error al exportar equipos"
      });
    }
  }
}

