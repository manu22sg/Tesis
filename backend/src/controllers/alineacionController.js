import { success, error, notFound } from '../utils/responseHandler.js';
import {
  crearAlineacion,
  obtenerAlineacionPorSesion,
  agregarJugadorAlineacion,
  actualizarAlineacionJugador,
  quitarJugadorDeAlineacion,
  eliminarAlineacion,
  actualizarPosicionesJugadores,
} from '../services/alineacionServices.js';
import { 
  generarAlineacionInteligente, 
  obtenerFormacionesDisponibles 
} from '../services/alineacionInteligenteservices.js';
import { 
  generarExcelAlineacion, 
  generarPDFAlineacion 
} from '../services/exportacionServices.js';

// ==================== CRUD BÁSICO ====================

export async function postCrearAlineacion(req, res) {
  const [data, err] = await crearAlineacion(req.body);
  if (err) {
    const status = err.includes('Ya existe') || err.includes('No se puede repetir') ? 409 : 400;
    return error(res, err, status);
  }
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
  if (err) {
    const status = err.includes('ya está') || err.includes('11 titulares') ? 409 : 400;
    return error(res, err, status);
  }
  return success(res, data, 'Jugador agregado a la alineación', 201);
}

export async function patchAlineacionJugador(req, res) {
  const [data, err] = await actualizarAlineacionJugador(req.body);
  if (err) {
    const status = err.includes('no encontrado') ? 404 : 
                   err.includes('11 titulares') ? 409 : 400;
    return error(res, err, status);
  }
  return success(res, data, 'Registro de alineación actualizado');
}

export async function deleteAlineacionJugador(req, res) {
  const alineacionId = parseInt(req.params.alineacionId, 10);
  const jugadorId = parseInt(req.params.jugadorId, 10);
  const [ok, err] = await quitarJugadorDeAlineacion(alineacionId, jugadorId);
  if (err) {
    const status = err.includes('no encontrado') ? 404 : 400;
    return error(res, err, status);
  }
  return success(res, { eliminado: !!ok }, 'Jugador removido de la alineación');
}

export async function deleteAlineacion(req, res) {
  const id = parseInt(req.params.id, 10);
  const [ok, err] = await eliminarAlineacion(id);
  if (err) {
    const status = err.includes('no encontrada') ? 404 : 400;
    return error(res, err, status);
  }
  return success(res, { eliminada: !!ok }, 'Alineación eliminada');
}

export async function patchActualizarPosiciones(req, res) {
  const { alineacionId, jugadores } = req.body;
  const [data, err] = await actualizarPosicionesJugadores(alineacionId, jugadores);
  if (err) {
    const status = err.includes('11 jugadores') ? 409 : 400;
    return error(res, err, status);
  }
  return success(res, data, 'Posiciones actualizadas');
}

// ==================== EXPORTACIÓN ====================

export async function exportarAlineacionExcel(req, res) {
  try {
    const sesionId = parseInt(req.params.sesionId, 10);
    const { mobile } = req.query;
    const isMobile = mobile === "true";
    
    const [alineacion, err] = await obtenerAlineacionPorSesion(sesionId);
    
    if (err) {
      return res.status(404).json({
        success: false,
        message: err
      });
    }

    if (!alineacion.jugadores || alineacion.jugadores.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hay jugadores en la alineación para exportar"
      });
    }

    const buffer = await generarExcelAlineacion(alineacion);

    // 📱 MOBILE: devolver base64
    if (isMobile) {
      return res.json({
        success: true,
        fileName: `alineacion_sesion_${sesionId}_${Date.now()}.xlsx`,
        base64: buffer.toString("base64")
      });
    }

    // 💻 WEB: descarga directa
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="alineacion_sesion_${sesionId}_${Date.now()}.xlsx"`
    );
    res.setHeader("Content-Length", buffer.length);
    return res.send(buffer);

  } catch (err) {
    console.error("Error exportando alineación a Excel:", err);
    return res.status(500).json({
      success: false,
      message: "Error al exportar alineación",
      error: err.message
    });
  }
}

export async function exportarAlineacionPDF(req, res) {
  try {
    const sesionId = parseInt(req.params.sesionId, 10);
    const { mobile } = req.query;
    const isMobile = mobile === "true";
    
    const [alineacion, err] = await obtenerAlineacionPorSesion(sesionId);
    
    if (err) {
      return res.status(404).json({
        success: false,
        message: err
      });
    }

    if (!alineacion.jugadores || alineacion.jugadores.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hay jugadores en la alineación para exportar"
      });
    }

    // 📱 MOBILE: generar base64
    if (isMobile) {
      let chunks = [];
      const { Readable } = await import('stream');
      const outputStream = new Readable({
        read() {}
      });

      outputStream.on("data", chunk => chunks.push(chunk));
      outputStream.on("end", () => {
        const pdfBuffer = Buffer.concat(chunks);
        return res.json({
          success: true,
          fileName: `alineacion_sesion_${sesionId}_${Date.now()}.pdf`,
          base64: pdfBuffer.toString("base64")
        });
      });

      generarPDFAlineacion(alineacion, outputStream);
      outputStream.push(null);
    } else {
      // 💻 WEB: descarga directa
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="alineacion_sesion_${sesionId}_${Date.now()}.pdf"`
      );
      
      generarPDFAlineacion(alineacion, res);
    }

  } catch (err) {
    console.error("Error exportando alineación a PDF:", err);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Error al exportar alineación"
      });
    }
  }
}

// ==================== ALINEACIÓN INTELIGENTE ====================

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
      const message = typeof err === 'string' ? err : err.message;
      const extra = typeof err === 'object' ? err : null;
      return error(res, message, status || 400, extra);
    }

    return success(res, alineacion, 'Alineación sugerida generada exitosamente', 201);

  } catch (e) {
    console.error('postGenerarAlineacionInteligente:', e);
    return error(res, 'Error interno del servidor', 500);
  }
}

export async function getFormacionesDisponibles(req, res) {
  try {
    const { tipo } = req.params;
    
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