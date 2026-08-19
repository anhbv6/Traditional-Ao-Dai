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
