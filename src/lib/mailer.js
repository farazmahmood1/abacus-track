import nodemailer from 'nodemailer'
import { ENV } from '../config/env.js'

const transporter = nodemailer.createTransport({
  host: ENV.SMTP_HOST,
  port: ENV.SMTP_PORT,
  secure: false,
  auth: {
    user: ENV.SMTP_USERNAME,
    pass: ENV.SMTP_PASSWORD,
  },
})

export async function sendEmail({ to, subject, text, html }) {
  try {
    const info = await transporter.sendMail({
      from: ENV.EMAIL_FROM,
      to,
      subject,
      text,
      html,
    })
    console.log(`[MAILER] Email sent to ${to} — messageId: ${info.messageId}`)
    return info
  } catch (err) {
    console.error(`[MAILER] Failed to send email to ${to}:`, err.message)
    throw err
  }
}
