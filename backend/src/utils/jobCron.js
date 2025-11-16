import cron from 'node-cron';
import { actualizarEstadosReservas } from './reserva.job.js';
import { enviarRecordatoriosReservas } from './recordatorioReservas.js';
import { enviarRecordatoriosSesiones } from './recordatorioSesiones.js';

export function iniciarCronJobs() {

  cron.schedule('0 9* * * *', async () => {
    console.log('Ejecutando: actualizar estados');
    await actualizarEstadosReservas();
  }, {
    timezone: "America/Santiago",
    name: "actualizar-estados"
  });

  // Recordatorios de sesiones a las 9 AM
  cron.schedule('0 9 * * *', async () => {
    console.log(' Ejecutando: recordatorios de sesiones');
    await enviarRecordatoriosSesiones();
  }, {
    timezone: "America/Santiago",
    name: "recordatorios-sesiones"
  });

  // Recordatorios de reservas a las 10 AM
  cron.schedule('0 10 * * *', async () => {
    console.log(' Ejecutando: recordatorios de reservas');
    await enviarRecordatoriosReservas();
  }, {
    timezone: "America/Santiago",
    name: "recordatorios-reservas"
  });

  console.log(' Cron jobs iniciados correctamente');
}