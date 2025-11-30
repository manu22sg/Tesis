import {
  buscarJugadoresCampeonato,
  obtenerPerfilJugadorCampeonato,
  obtenerEstadisticasDetalladas
} from '../services/jugadorCampeonatoServices.js';

import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';


/**
 * GET /api/ojeador
 * Buscar jugadores que participaron en campeonatos
 */
export async function buscarJugadoresController(req, res) {
  try {
    const { q, carreraId, anio, page, limit } = req.query;

    const filtros = {
      q: q || '',
      carreraId: carreraId ? Number(carreraId) : undefined,
      anio: anio ? Number(anio) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20
    };

    const [resultado, error] = await buscarJugadoresCampeonato(filtros);

    if (error) {
      return res.status(500).json({ message: error });
    }

    return res.status(200).json({
      success: true,
      ...resultado
    });

  } catch (error) {
    console.error('Error en buscarJugadoresController:', error);
    return res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
}

/**
 * GET /api/ojeador/:usuarioId
 * Obtener perfil completo de un jugador con su historial
 */
export async function obtenerPerfilController(req, res) {
  try {
    const { usuarioId } = req.params;

    if (!usuarioId || isNaN(Number(usuarioId))) {
      return res.status(400).json({
        message: 'ID de usuario inválido'
      });
    }

    const [perfil, error] = await obtenerPerfilJugadorCampeonato(Number(usuarioId));

    if (error) {
      const status = error === 'Usuario no encontrado' ? 404 : 500;
      return res.status(status).json({ message: error });
    }

    return res.status(200).json({
      success: true,
      data: perfil
    });

  } catch (error) {
    console.error('Error en obtenerPerfilController:', error);
    return res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
}

/**
 * GET /api/ojeador/:usuarioId/campeonato/:campeonatoId
 * Obtener estadísticas detalladas partido por partido
 */
export async function obtenerEstadisticasDetalladasController(req, res) {
  try {
    const { usuarioId, campeonatoId } = req.params;

    if (!usuarioId || isNaN(Number(usuarioId))) {
      return res.status(400).json({
        message: 'ID de usuario inválido'
      });
    }

    if (!campeonatoId || isNaN(Number(campeonatoId))) {
      return res.status(400).json({
        message: 'ID de campeonato inválido'
      });
    }

    const [estadisticas, error] = await obtenerEstadisticasDetalladas(
      Number(usuarioId),
      Number(campeonatoId)
    );

    if (error) {
      const status = error.includes('no participó') ? 404 : 500;
      return res.status(status).json({ message: error });
    }

    return res.status(200).json({
      success: true,
      data: estadisticas
    });

  } catch (error) {
    console.error('Error en obtenerEstadisticasDetalladasController:', error);
    return res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
}


export async function exportarPerfilExcelController(req, res) {
  try {
    const { usuarioId } = req.params;
    const { mobile } = req.query;

    if (!usuarioId || isNaN(Number(usuarioId))) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido'
      });
    }

    const isMobile = mobile === 'true';

    const [perfil, error] = await obtenerPerfilJugadorCampeonato(Number(usuarioId));

    if (error) {
      const status = error === 'Usuario no encontrado' ? 404 : 500;
      return res.status(status).json({
        success: false,
        message: error
      });
    }

    const { usuario, totalesGenerales, promedios, historialCampeonatos } = perfil;

    const workbook = new ExcelJS.Workbook();

    // 📋 Hoja 1: Información General
    const sheetInfo = workbook.addWorksheet('Información General');
    sheetInfo.columns = [
      { header: 'Campo', key: 'campo', width: 25 },
      { header: 'Valor', key: 'valor', width: 40 }
    ];

    sheetInfo.addRows([
      { campo: 'Nombre Completo', valor: `${usuario.nombre} ${usuario.apellido}` },
      { campo: 'RUT', valor: usuario.rut || '—' },
      { campo: 'Email', valor: usuario.email || '—' },
      { campo: 'Carrera', valor: usuario.carreraNombre || '—' },
      { campo: 'Año de Ingreso', valor: usuario.anioIngresoUniversidad || '—' },
      { campo: 'Sexo', valor: usuario.sexo || '—' },
      { campo: 'Estado', valor: usuario.estado || '—' },
      { campo: '', valor: '' }, // Separador
      { campo: 'Total Campeonatos', valor: totalesGenerales.campeonatos },
      { campo: 'Total Goles', valor: totalesGenerales.goles },
      { campo: 'Total Asistencias', valor: totalesGenerales.asistencias },
      { campo: 'Total Atajadas', valor: totalesGenerales.atajadas },
      { campo: 'Partidos Jugados', valor: totalesGenerales.partidosJugados },
      { campo: 'Minutos Jugados', valor: totalesGenerales.minutosJugados },
      { campo: 'Tarjetas Amarillas', valor: totalesGenerales.tarjetasAmarillas },
      { campo: 'Tarjetas Rojas', valor: totalesGenerales.tarjetasRojas },
      { campo: '', valor: '' }, // Separador
      { campo: 'Promedio Goles/Partido', valor: promedios.golesPartido },
      { campo: 'Promedio Asistencias/Partido', valor: promedios.asistenciasPartido },
      { campo: 'Promedio Minutos/Partido', valor: promedios.minutosPartido }
    ]);

    sheetInfo.getRow(1).font = { bold: true };
    sheetInfo.getColumn('campo').font = { bold: true };

    // 📋 Hoja 2: Historial por Campeonato
    const sheetHistorial = workbook.addWorksheet('Historial Campeonatos');
    sheetHistorial.columns = [
      { header: 'Campeonato', key: 'campeonato', width: 30 },
      { header: 'Año', key: 'anio', width: 10 },
      { header: 'Semestre', key: 'semestre', width: 10 },
      { header: 'Formato', key: 'formato', width: 15 },
      { header: 'Equipo', key: 'equipo', width: 25 },
      { header: 'Carrera', key: 'carrera', width: 25 },
      { header: 'Posición', key: 'posicion', width: 15 },
      { header: 'Camiseta', key: 'camiseta', width: 10 },
      { header: 'Goles', key: 'goles', width: 10 },
      { header: 'Asistencias', key: 'asistencias', width: 12 },
      { header: 'Atajadas', key: 'atajadas', width: 10 },
      { header: 'Partidos', key: 'partidos', width: 10 },
      { header: 'Minutos', key: 'minutos', width: 10 },
      { header: 'Amarillas', key: 'amarillas', width: 10 },
      { header: 'Rojas', key: 'rojas', width: 10 }
    ];

    historialCampeonatos.forEach(camp => {
      sheetHistorial.addRow({
        campeonato: camp.campeonatoNombre,
        anio: camp.anio,
        semestre: camp.semestre,
        formato: camp.formato,
        equipo: camp.equipoNombre,
        carrera: camp.equipoCarrera || '—',
        posicion: camp.posicion || '—',
        camiseta: camp.numeroCamiseta || '—',
        goles: camp.estadisticas.goles,
        asistencias: camp.estadisticas.asistencias,
        atajadas: camp.estadisticas.atajadas,
        partidos: camp.estadisticas.partidosJugados,
        minutos: camp.estadisticas.minutosJugados,
        amarillas: camp.estadisticas.tarjetasAmarillas,
        rojas: camp.estadisticas.tarjetasRojas
      });
    });

    sheetHistorial.getRow(1).font = { bold: true };

    // 📋 Hoja 3: Detalle de Partidos
    const sheetPartidos = workbook.addWorksheet('Detalle Partidos');
    sheetPartidos.columns = [
      { header: 'Campeonato', key: 'campeonato', width: 25 },
      { header: 'Fecha', key: 'fecha', width: 12 },
      { header: 'Ronda', key: 'ronda', width: 15 },
      { header: 'Equipo A', key: 'equipoA', width: 20 },
      { header: 'Equipo B', key: 'equipoB', width: 20 },
      { header: 'Resultado', key: 'resultado', width: 12 },
      { header: 'Penales', key: 'penales', width: 12 },
      { header: 'Goles', key: 'goles', width: 8 },
      { header: 'Asistencias', key: 'asistencias', width: 12 },
      { header: 'Atajadas', key: 'atajadas', width: 10 },
      { header: 'Amarillas', key: 'amarillas', width: 10 },
      { header: 'Rojas', key: 'rojas', width: 8 },
      { header: 'Minutos', key: 'minutos', width: 10 }
    ];

    historialCampeonatos.forEach(camp => {
      if (camp.partidos && camp.partidos.length > 0) {
        camp.partidos.forEach(partido => {
          sheetPartidos.addRow({
            campeonato: camp.campeonatoNombre,
            fecha: partido.fecha ? new Date(partido.fecha).toLocaleDateString('es-CL') : '—',
            ronda: partido.ronda || '—',
            equipoA: partido.equipoANombre,
            equipoB: partido.equipoBNombre,
            resultado: partido.resultado || 'Pendiente',
            penales: partido.definidoPorPenales ? `${partido.penalesA}-${partido.penalesB}` : '—',
            goles: partido.golesJugador || 0,
            asistencias: partido.asistenciasJugador || 0,
            atajadas: partido.atajadasJugador || 0,
            amarillas: partido.tarjetasAmarillasJugador || 0,
            rojas: partido.tarjetasRojasJugador || 0,
            minutos: partido.minutosJugados || 0
          });
        });
      }
    });

    sheetPartidos.getRow(1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();

    if (isMobile) {
      const base64 = buffer.toString('base64');
      return res.json({
        success: true,
        base64,
        fileName: `perfil_${usuario.nombre}_${usuario.apellido}.xlsx`
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="perfil_${usuario.nombre}_${usuario.apellido}.xlsx"`
    );
    return res.send(buffer);

  } catch (error) {
    console.error('Error exportando Excel:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al exportar perfil a Excel',
      error: error.message
    });
  }
}

/**
 * 🆕 GET /api/ojeador/:usuarioId/exportar/pdf
 * Exportar perfil completo del jugador a PDF
 */
export async function exportarPerfilPDFController(req, res) {
  try {
    const { usuarioId } = req.params;
    const { mobile } = req.query;

    if (!usuarioId || isNaN(Number(usuarioId))) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido'
      });
    }

    const isMobile = mobile === 'true';

    const [perfil, error] = await obtenerPerfilJugadorCampeonato(Number(usuarioId));

    if (error) {
      const status = error === 'Usuario no encontrado' ? 404 : 500;
      return res.status(status).json({
        success: false,
        message: error
      });
    }

    const { usuario, totalesGenerales, promedios, historialCampeonatos } = perfil;

    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    // 🎨 Header
    doc.fontSize(20).font('Helvetica-Bold').text('PERFIL DE JUGADOR', { align: 'center' });
    doc.moveDown();

    // 📋 Información Personal
    doc.fontSize(16).font('Helvetica-Bold').text('Información Personal', { underline: true });
    doc.moveDown(0.5);
    
    doc.fontSize(11).font('Helvetica');
    doc.text(`Nombre: ${usuario.nombre} ${usuario.apellido}`);
    doc.text(`RUT: ${usuario.rut || '—'}`);
    doc.text(`Email: ${usuario.email || '—'}`);
    doc.text(`Carrera: ${usuario.carreraNombre || '—'}`);
    doc.text(`Año de Ingreso: ${usuario.anioIngresoUniversidad || '—'}`);
    doc.text(`Sexo: ${usuario.sexo || '—'}`);
    doc.text(`Estado: ${usuario.estado || '—'}`);
    doc.moveDown();

    // 📊 Estadísticas Generales
    doc.fontSize(16).font('Helvetica-Bold').text('Estadísticas Generales', { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(11).font('Helvetica');
    doc.text(`Campeonatos: ${totalesGenerales.campeonatos}`);
    doc.text(`Goles: ${totalesGenerales.goles}`);
    doc.text(`Asistencias: ${totalesGenerales.asistencias}`);
    doc.text(`Atajadas: ${totalesGenerales.atajadas}`);
    doc.text(`Partidos Jugados: ${totalesGenerales.partidosJugados}`);
    doc.text(`Minutos Totales: ${totalesGenerales.minutosJugados}'`);
    doc.text(`Tarjetas Amarillas: ${totalesGenerales.tarjetasAmarillas}`);
    doc.text(`Tarjetas Rojas: ${totalesGenerales.tarjetasRojas}`);
    doc.moveDown();

    // 📈 Promedios
    doc.fontSize(14).font('Helvetica-Bold').text('Promedios por Partido');
    doc.moveDown(0.3);
    doc.fontSize(11).font('Helvetica');
    doc.text(`Goles/Partido: ${promedios.golesPartido}`);
    doc.text(`Asistencias/Partido: ${promedios.asistenciasPartido}`);
    doc.text(`Minutos/Partido: ${promedios.minutosPartido}'`);
    doc.moveDown(1.5);

    // 🏆 Historial por Campeonato
    doc.fontSize(16).font('Helvetica-Bold').text('Historial por Campeonato', { underline: true });
    doc.moveDown(0.5);

    historialCampeonatos.forEach((camp, index) => {
      // Verificar si hay espacio, si no, crear nueva página
      if (doc.y > 600) {
        doc.addPage();
      }

      doc.fontSize(12).font('Helvetica-Bold');
      doc.text(`${camp.campeonatoNombre} (${camp.anio}-${camp.semestre})`, { continued: false });
      
      doc.fontSize(10).font('Helvetica');
      doc.text(`Formato: ${camp.formato} | Equipo: ${camp.equipoNombre}`);
      doc.text(`Carrera: ${camp.equipoCarrera || '—'} | Posición: ${camp.posicion || '—'} | Camiseta: #${camp.numeroCamiseta || '—'}`);
      doc.moveDown(0.3);

      doc.fontSize(10).font('Helvetica-Bold');
      doc.text(` Goles: ${camp.estadisticas.goles} |  Asistencias: ${camp.estadisticas.asistencias} |  Partidos: ${camp.estadisticas.partidosJugados}`);
      doc.text(` Amarillas: ${camp.estadisticas.tarjetasAmarillas} |  Rojas: ${camp.estadisticas.tarjetasRojas} |  Minutos: ${camp.estadisticas.minutosJugados}'`);
      
      if (camp.estadisticas.atajadas > 0) {
        doc.text(` Atajadas: ${camp.estadisticas.atajadas}`);
      }

      doc.moveDown(0.5);

      // 🆕 AGREGAR PARTIDOS DETALLADOS
      if (camp.partidos && camp.partidos.length > 0) {
        doc.fontSize(11).font('Helvetica-Bold').text('Partidos:', { underline: true });
        doc.moveDown(0.3);

        camp.partidos.forEach((partido, pIndex) => {
          // Verificar espacio para cada partido
          if (doc.y > 680) {
            doc.addPage();
          }

          doc.fontSize(9).font('Helvetica');
          
          const fecha = partido.fecha 
            ? new Date(partido.fecha).toLocaleDateString('es-CL') 
            : '—';
          
          const resultado = partido.resultado || 'Pendiente';
          const penales = partido.definidoPorPenales 
            ? ` (Penales: ${partido.penalesA}-${partido.penalesB})` 
            : '';

          // Línea principal del partido
          doc.text(
            `${pIndex + 1}. ${fecha} | ${partido.ronda || 'Sin ronda'} | ${partido.equipoANombre} vs ${partido.equipoBNombre}`,
            { continued: false }
          );
          
          doc.fontSize(8).font('Helvetica');
          doc.text(`   Resultado: ${resultado}${penales}`);
          
          // Estadísticas del jugador en ese partido
          const stats = [];
          if (partido.golesJugador > 0) stats.push(` Goles: ${partido.golesJugador}`);
          if (partido.asistenciasJugador > 0) stats.push(` Asistencias: ${partido.asistenciasJugador}`);
          if (partido.atajadasJugador > 0) stats.push(` Atajadas: ${partido.atajadasJugador}`);
          if (partido.tarjetasAmarillasJugador > 0) stats.push(` Amarillas: ${partido.tarjetasAmarillasJugador}`);
          if (partido.tarjetasRojasJugador > 0) stats.push(` Rojas: ${partido.tarjetasRojasJugador}`);
          if (partido.minutosJugados > 0) stats.push(` Minutos jugados: ${partido.minutosJugados}'`);

          if (stats.length > 0) {
            doc.text(`   Jugador: ${stats.join(' | ')}`);
          } else {
            doc.text(`   Jugador: Sin estadísticas registradas`);
          }

          doc.moveDown(0.3);
        });

        doc.moveDown(0.5);
      } else {
        doc.fontSize(9).font('Helvetica-Oblique');
        doc.text('No hay partidos registrados en este campeonato.');
        doc.moveDown(0.5);
      }

      doc.moveDown(1);
    });

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);

        if (isMobile) {
          const base64 = buffer.toString('base64');
          return res.json({
            success: true,
            base64,
            fileName: `perfil_${usuario.nombre}_${usuario.apellido}.pdf`
          });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="perfil_${usuario.nombre}_${usuario.apellido}.pdf"`
        );
        res.send(buffer);
        resolve();
      });

      doc.on('error', reject);
    });

  } catch (error) {
    console.error('Error exportando PDF:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al exportar perfil a PDF',
      error: error.message
    });
  }
}