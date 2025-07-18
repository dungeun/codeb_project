// 이메일 서비스 - SendGrid 또는 SMTP 사용
import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
}

class EmailService {
  private transporter: any

  constructor() {
    if (process.env.SENDGRID_API_KEY) {
      // SendGrid 사용
      const sgMail = require('@sendgrid/mail')
      sgMail.setApiKey(process.env.SENDGRID_API_KEY)
      this.transporter = sgMail
    } else if (process.env.EMAIL_HOST && process.env.EMAIL_USER) {
      // SMTP 사용
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      })
    } else {
      // 개발 환경 - 콘솔 출력
      this.transporter = null
    }
  }

  async sendEmail(options: EmailOptions) {
    const { to, subject, html, text, from } = options
    const fromEmail = from || process.env.EMAIL_FROM || 'noreply@codeb.com'

    if (!this.transporter) {
      // 개발 환경
      console.log('📧 Email (Dev Mode):')
      console.log(`  From: ${fromEmail}`)
      console.log(`  To: ${Array.isArray(to) ? to.join(', ') : to}`)
      console.log(`  Subject: ${subject}`)
      console.log(`  Content: ${text || html}`)
      return { success: true, messageId: 'dev-' + Date.now() }
    }

    try {
      if (process.env.SENDGRID_API_KEY) {
        // SendGrid
        const msg = {
          to,
          from: fromEmail,
          subject,
          text: text || '',
          html: html || text || ''
        }
        const result = await this.transporter.send(msg)
        return { success: true, messageId: result[0].headers['x-message-id'] }
      } else {
        // SMTP
        const info = await this.transporter.sendMail({
          from: fromEmail,
          to: Array.isArray(to) ? to.join(', ') : to,
          subject,
          text,
          html
        })
        return { success: true, messageId: info.messageId }
      }
    } catch (error: any) {
      console.error('Email send error:', error)
      throw new Error(`Failed to send email: ${error.message}`)
    }
  }

  async sendBulkEmails(emails: EmailOptions[]) {
    const results = []
    for (const email of emails) {
      try {
        const result = await this.sendEmail(email)
        results.push({ ...result, to: email.to })
      } catch (error: any) {
        results.push({ success: false, to: email.to, error: error.message })
      }
    }
    return results
  }

  // 템플릿 기반 이메일 전송
  async sendTemplateEmail(templateName: string, to: string, data: any) {
    const templates: Record<string, (data: any) => { subject: string; html: string }> = {
      welcome: (data) => ({
        subject: `Welcome to CodeB Platform, ${data.name}!`,
        html: `
          <h1>Welcome to CodeB Platform!</h1>
          <p>Hi ${data.name},</p>
          <p>Thank you for joining CodeB Platform. We're excited to have you on board!</p>
          <p>Get started by exploring your dashboard and creating your first project.</p>
          <p>Best regards,<br>The CodeB Team</p>
        `
      }),
      taskAssigned: (data) => ({
        subject: `New task assigned: ${data.taskTitle}`,
        html: `
          <h2>New Task Assigned</h2>
          <p>Hi ${data.assigneeName},</p>
          <p>You have been assigned a new task:</p>
          <h3>${data.taskTitle}</h3>
          <p><strong>Priority:</strong> ${data.priority}</p>
          <p><strong>Due Date:</strong> ${data.dueDate}</p>
          <p><strong>Description:</strong> ${data.description}</p>
          <p><a href="${data.taskUrl}">View Task</a></p>
        `
      }),
      projectUpdate: (data) => ({
        subject: `Project Update: ${data.projectName}`,
        html: `
          <h2>Project Update</h2>
          <p>Hi ${data.userName},</p>
          <p>There's an update on the project "${data.projectName}":</p>
          <p>${data.updateMessage}</p>
          <p><a href="${data.projectUrl}">View Project</a></p>
        `
      })
    }

    const template = templates[templateName]
    if (!template) {
      throw new Error(`Template "${templateName}" not found`)
    }

    const { subject, html } = template(data)
    return this.sendEmail({ to, subject, html })
  }
}

export default new EmailService()