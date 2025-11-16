import nodemailer from 'nodemailer';
import { EMAIL_USER, EMAIL_PASS, EMAIL_HOST, EMAIL_PORT } from "../config/configEnv.js"

export const mailer = nodemailer.createTransport({
  host: EMAIL_HOST || 'smtp.gmail.com',
  port: Number(EMAIL_PORT || 465),
  secure: true, 
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

/**
 * Envía un correo electrónico.
 * @param {Object} options
 * @param {string|string[]} options.to - Destinatario(s)
 * @param {string} options.subject - Asunto
 * @param {string} options.text - Texto plano del correo
 * @param {string} [options.html] - Versión HTML opcional
 */
export async function sendMail({ to, subject, text, html }) {
  try {
    const info = await mailer.sendMail({
      from: `"SPORTUBB" <${EMAIL_USER}>`,
      to,
      subject,
      text,
      html: html || `<p>${text}</p>`,
    });

    return info;
  } catch (error) {
    console.error(' Error al enviar correo:', error);
    throw error;
  }
}
