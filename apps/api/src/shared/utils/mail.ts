import nodemailer from 'nodemailer'
import { env } from '../config/env'

interface SendMailOptions {
  to: string
  subject: string
  text: string
  html?: string
}

class MailProvider {
  private transporter: nodemailer.Transporter | null = null

  constructor() {
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT || 587,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      })
    }
  }

  async sendMail(options: SendMailOptions): Promise<boolean> {
    const from = env.SMTP_FROM || 'noreply@aodai.vn'
    
    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from,
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html,
        })
        console.log(`[MailProvider] Email sent successfully to ${options.to}`)
        return true
      } catch (error) {
        console.error('[MailProvider] Failed to send email via SMTP:', error)
      }
    }

    // Fallback Mock console log for development
    console.log('\n=================== MOCK EMAIL SENT ===================')
    console.log(`FROM:    ${from}`)
    console.log(`TO:      ${options.to}`)
    console.log(`SUBJECT: ${options.subject}`)
    console.log(`TEXT:    ${options.text}`)
    if (options.html) {
      console.log(`HTML:    ${options.html}`)
    }
    console.log('========================================================\n')
    
    return true
  }
}

export const mailProvider = new MailProvider()

/**
 * Gửi email chứa mã xác minh 6 số (đặt lại mật khẩu, xác minh email...)
 */
export async function sendVerificationCodeEmail(options: {
  to: string
  subject: string
  heading: string
  intro: string
  code: string
  ttlMinutes: number
}): Promise<boolean> {
  const { to, subject, heading, intro, code, ttlMinutes } = options
  const text = `${intro} Your verification code is: ${code}. Valid for ${ttlMinutes} minutes.`
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2>${heading}</h2>
      <p>${intro}</p>
      <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px;">
        ${code}
      </div>
      <p>This code is valid for ${ttlMinutes} minutes. If you did not make this request, you can safely ignore this email.</p>
    </div>
  `

  return mailProvider.sendMail({ to, subject, text, html })
}
