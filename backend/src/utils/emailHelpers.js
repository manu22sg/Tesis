import dayjs from 'dayjs';
import { sendMail } from './mailer.js';
export async function enviarEmailsEnLotes(destinatarios, asunto, texto, batchSize = 10) {
  const resultados = { exitosos: 0, fallidos: 0 };
  
  for (let i = 0; i < destinatarios.length; i += batchSize) {
    const lote = destinatarios.slice(i, i + batchSize);
    
    await Promise.allSettled(
      lote.map(async (correo) => {
        try {
          await sendMail({ to: correo, subject: asunto, text: texto });
          resultados.exitosos++;
        } catch (err) {
          console.error(`Error enviando a ${correo}:`, err?.message);
          resultados.fallidos++;
        }
      })
    );
    
    // Pequeña pausa entre lotes
    if (i + batchSize < destinatarios.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return resultados;
}

/**
 * Formatea horarios de forma consistente
 */
export function formatearHorario(horaInicio, horaFin = null) {
  const horaIni = dayjs(horaInicio, ['HH:mm', 'HH:mm:ss']).isValid()
    ? dayjs(horaInicio, ['HH:mm', 'HH:mm:ss']).format('HH:mm')
    : String(horaInicio || '').slice(0, 5);

  if (!horaFin) return horaIni;

  const horaFinFmt = dayjs(horaFin, ['HH:mm', 'HH:mm:ss']).isValid()
    ? dayjs(horaFin, ['HH:mm', 'HH:mm:ss']).format('HH:mm')
    : String(horaFin).slice(0, 5);

  return `${horaIni} - ${horaFinFmt}`;
}