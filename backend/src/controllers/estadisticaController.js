import { success, error, notFound } from '../utils/responseHandler.js';
import {
  upsertEstadistica,
  obtenerEstadisticasPorJugador,
  obtenerEstadisticasPorSesion,
  obtenerEstadisticaPorId,
  eliminarEstadistica
} from '../services/estadisticaServices.js';
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

export async function postUpsertEstadistica(req,res){
  const [data, err] = await upsertEstadistica(req.body);
  if (err) return error(res, err, err.includes('no encontrada')?404:400);
  return success(res, data, 'Estadística guardada', 201);
}

export async function getEstadisticasPorSesion(req,res){
  const sesionId = parseInt(req.params.sesionId,10);
  const { page = 1, limit = 10, busqueda = '', jugadorId } = req.query; // ✅ Agregado jugadorId
  
  const [data, err] = await obtenerEstadisticasPorSesion({ 
    sesionId, 
    page,
    limit,
    busqueda,
    jugadorId: jugadorId ? parseInt(jugadorId, 10) : null // ✅ Parsear jugadorId
  });
  
  if (err) return error(res, err);
  return success(res, data, 'Estadísticas por sesión');
}

export async function getEstadisticasPorJugador(req,res){
  const jugadorId = parseInt(req.params.jugadorId,10);
  const { page = 1, limit = 10, busqueda = '', sesionId } = req.query; // ✅ Agregado sesionId
  
  if (req.user?.rol === 'estudiante' && req.user?.jugadorId !== jugadorId) {
    return error(res,'No tienes permiso para ver estadísticas de otro jugador',403);
  }
  
  const [data, err] = await obtenerEstadisticasPorJugador({ 
    jugadorId, 
    page,
    limit,
    busqueda,
    sesionId: sesionId ? parseInt(sesionId, 10) : null // ✅ Parsear sesionId
  });
  
  if (err) return error(res, err);
  return success(res, data, 'Estadísticas por jugador');
}

export async function getMisEstadisticas(req,res){
  const jugadorId = req.user?.jugadorId;
  const { page = 1, limit = 10, busqueda = '', sesionId } = req.query; // ✅ Agregado sesionId
  
  const [data, err] = await obtenerEstadisticasPorJugador({ 
    jugadorId, 
    page,
    limit,
    busqueda,
    sesionId: sesionId ? parseInt(sesionId, 10) : null // ✅ Parsear sesionId
  });
  
  if (err) return error(res, err);
  return success(res, data, 'Mis estadísticas');
}

export async function getEstadisticaPorId(req,res){
  const id = parseInt(req.params.id,10);
  const [data, err] = await obtenerEstadisticaPorId(id);
  if (err) return notFound(res, err);
  return success(res, data, 'Estadística encontrada');
}

export async function deleteEstadistica(req,res){
  const id = parseInt(req.params.id,10);
  const [ok, err] = await eliminarEstadistica(id);
  if (err) return error(res, err, err.includes('no encontrada')?404:400);
  return success(res, { eliminado: !!ok }, 'Estadística eliminada');
}

export async function exportarEstadisticasExcel(req, res) {
  try {
    const { tipo, id, mobile, jugadorId, sesionId } = req.query; // ✅ Agregados jugadorId y sesionId
    const isMobile = mobile === "true";

    let resultado, err;
    
    if (tipo === 'jugador') {
      [resultado, err] = await obtenerEstadisticasPorJugador({
        jugadorId: parseInt(id),
        page: 1,
        limit: 5000,
        busqueda: '',
        sesionId: sesionId ? parseInt(sesionId) : null // ✅ Filtro opcional
      });
    } else if (tipo === 'sesion') {
      [resultado, err] = await obtenerEstadisticasPorSesion({
        sesionId: parseInt(id),
        page: 1,
        limit: 5000,
        busqueda: '',
        jugadorId: jugadorId ? parseInt(jugadorId) : null // ✅ Filtro opcional
      });
    }

    if (err) {
      return res.status(500).json({
        success: false,
        message: err
      });
    }

    const estadisticas = resultado.estadisticas || [];

    if (estadisticas.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hay estadísticas para exportar"
      });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Sistema de Gestión Deportiva";
    const sheet = workbook.addWorksheet("Estadísticas");

    if (tipo === 'sesion') {
      sheet.columns = [
        { header: "Jugador", key: "jugador", width: 30 },
        { header: "RUT", key: "rut", width: 15 },
        { header: "Goles", key: "goles", width: 10 },
        { header: "Asistencias", key: "asistencias", width: 12 },
        { header: "Tarjetas Amarillas", key: "tarjetasAmarillas", width: 18 },
        { header: "Tarjetas Rojas", key: "tarjetasRojas", width: 15 },
        { header: "Minutos Jugados", key: "minutosJugados", width: 15 },
        { header: "Fecha Registro", key: "fechaRegistro", width: 15 }
      ];
    } else {
      sheet.columns = [
        { header: "Fecha Sesión", key: "fechaSesion", width: 15 },
        { header: "Hora", key: "hora", width: 15 },
        { header: "Goles", key: "goles", width: 10 },
        { header: "Asistencias", key: "asistencias", width: 12 },
        { header: "Tarjetas Amarillas", key: "tarjetasAmarillas", width: 18 },
        { header: "Tarjetas Rojas", key: "tarjetasRojas", width: 15 },
        { header: "Minutos Jugados", key: "minutosJugados", width: 15 },
        { header: "Fecha Registro", key: "fechaRegistro", width: 15 }
      ];
    }

    sheet.getRow(1).font = { bold: true };

    estadisticas.forEach(e => {
      if (tipo === 'sesion') {
        const jugadorNombre = e.jugador?.usuario?.nombre 
          ? `${(e.jugador.usuario.nombre).trim()} ${(e.jugador.usuario.apellido || '').trim()}`.trim()
          : "—";
        const rut = e.jugador?.usuario?.rut || "—";
        
        sheet.addRow({
          jugador: jugadorNombre,
          rut: rut,
          goles: e.goles ?? 0,
          asistencias: e.asistencias ?? 0,
          tarjetasAmarillas: e.tarjetasAmarillas ?? 0,
          tarjetasRojas: e.tarjetasRojas ?? 0,
          minutosJugados: e.minutosJugados ?? 0,
          fechaRegistro: e.fechaRegistro ? new Date(e.fechaRegistro).toLocaleDateString('es-CL') : "—"
        });
      } else {
        const fechaSesion = e.sesion?.fecha || "—";
        const horaInicio = e.sesion?.horaInicio || "—";
        const horaFin = e.sesion?.horaFin ? ` - ${e.sesion.horaFin}` : "";
        
        sheet.addRow({
          fechaSesion: fechaSesion ? new Date(fechaSesion).toLocaleDateString('es-CL') : "—",
          hora: `${formatearHora(horaInicio)}${formatearHora(horaFin)}`,
          goles: e.goles ?? 0,
          asistencias: e.asistencias ?? 0,
          tarjetasAmarillas: e.tarjetasAmarillas ?? 0,
          tarjetasRojas: e.tarjetasRojas ?? 0,
          minutosJugados: e.minutosJugados ?? 0,
          fechaRegistro: e.fechaRegistro ? new Date(e.fechaRegistro).toLocaleDateString('es-CL') : "—"
        });
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();

    // 📱 MOBILE
    if (isMobile) {
      return res.json({
        success: true,
        fileName: `estadisticas_${tipo}_${Date.now()}.xlsx`,
        base64: buffer.toString("base64")
      });
    }

    // 💻 WEB
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="estadisticas_${tipo}_${Date.now()}.xlsx"`
    );
    res.setHeader("Content-Length", buffer.length);

    return res.send(buffer);

  } catch (error) {
    console.error("Error exportando estadísticas a Excel:", error);
    return res.status(500).json({
      success: false,
      message: "Error al exportar estadísticas",
      error: error.message
    });
  }
}

export async function exportarEstadisticasPDF(req, res) {
  try {
    const { tipo, id, mobile, jugadorId, sesionId } = req.query; // ✅ Agregados jugadorId y sesionId
    const isMobile = mobile === "true";

    let resultado, err;
    
    if (tipo === 'jugador') {
      [resultado, err] = await obtenerEstadisticasPorJugador({
        jugadorId: parseInt(id),
        page: 1,
        limit: 5000,
        busqueda: '',
        sesionId: sesionId ? parseInt(sesionId) : null // ✅ Filtro opcional
      });
    } else if (tipo === 'sesion') {
      [resultado, err] = await obtenerEstadisticasPorSesion({
        sesionId: parseInt(id),
        page: 1,
        limit: 5000,
        busqueda: '',
        jugadorId: jugadorId ? parseInt(jugadorId) : null // ✅ Filtro opcional
      });
    }

    if (err) {
      return res.status(500).json({
        success: false,
        message: err
      });
    }

    const estadisticas = resultado.estadisticas || [];

    if (estadisticas.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hay estadísticas para exportar"
      });
    }

    const doc = new PDFDocument({ margin: 40 });
    let chunks = [];

    // 📱 MOBILE
    if (isMobile) {
      doc.on("data", chunk => chunks.push(chunk));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(chunks);
        return res.json({
          success: true,
          fileName: `estadisticas_${tipo}_${Date.now()}.pdf`,
          base64: pdfBuffer.toString("base64")
        });
      });
    } else {
      // 💻 WEB
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="estadisticas_${tipo}_${Date.now()}.pdf"`
      );
      doc.pipe(res);
    }

    doc.fontSize(18).font("Helvetica-Bold")
      .text(`Estadísticas por ${tipo === 'sesion' ? 'Sesión' : 'Jugador'}`, { align: "center" });
    doc.moveDown(1);

    estadisticas.forEach((e, index) => {
      if (doc.y > 680) doc.addPage();

      if (tipo === 'sesion') {
        const jugadorNombre = e.jugador?.usuario?.nombre 
          ? `${(e.jugador.usuario.nombre).trim()} ${(e.jugador.usuario.apellido || '').trim()}`.trim()
          : "Usuario Desconocido";

        doc.fontSize(12).font("Helvetica-Bold").text(jugadorNombre);

        const rut = e.jugador?.usuario?.rut || "—";
        
        doc.font("Helvetica").fontSize(10).text(`
RUT: ${rut}
Goles: ${e.goles ?? 0}
Asistencias: ${e.asistencias ?? 0}
Tarjetas Amarillas: ${e.tarjetasAmarillas ?? 0}
Tarjetas Rojas: ${e.tarjetasRojas ?? 0}
Minutos Jugados: ${e.minutosJugados ?? 0}
Fecha Registro: ${e.fechaRegistro ? new Date(e.fechaRegistro).toLocaleDateString('es-CL') : "—"}
        `);
      } else {
        const fechaSesion = e.sesion?.fecha || "—";
        const horaInicio = e.sesion?.horaInicio || "—";
        const horaFin = e.sesion?.horaFin || "—";

        doc.fontSize(12).font("Helvetica-Bold").text(`Sesión: ${fechaSesion ? new Date(fechaSesion).toLocaleDateString('es-CL') : "—"} - ${formatearHora(horaInicio)} - ${formatearHora(horaFin)}`);
        
        doc.font("Helvetica").fontSize(10).text(`
Goles: ${e.goles ?? 0}
Asistencias: ${e.asistencias ?? 0}
Tarjetas Amarillas: ${e.tarjetasAmarillas ?? 0}
Tarjetas Rojas: ${e.tarjetasRojas ?? 0}
Minutos Jugados: ${e.minutosJugados ?? 0}
Fecha Registro: ${e.fechaRegistro ? new Date(e.fechaRegistro).toLocaleDateString('es-CL') : "—"}
        `);
      }

      if (index < estadisticas.length - 1) {
        doc.moveTo(40, doc.y).lineTo(550, doc.y).strokeColor("#CCCCCC").stroke();
        doc.moveDown(1);
      }
    });

    doc.end();

  } catch (error) {
    console.error("Error exportando estadísticas a PDF:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Error al exportar estadísticas"
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