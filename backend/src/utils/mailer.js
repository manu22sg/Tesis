import nodemailer from 'nodemailer';
import { EMAIL_USER, EMAIL_PASS, EMAIL_HOST, EMAIL_PORT } from "../config/configEnv.js"

export const mailer = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT || 465),
  secure: true, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
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
      from: `"SPORTUBB" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: html || `<p>${text}</p>`,
    });

    console.log(` Correo enviado a ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(' Error al enviar correo:', error);
    throw error;
  }
}
