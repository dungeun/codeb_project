const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');

// SendGrid 설정 (API 키가 있을 경우)
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Nodemailer 설정 (개발 환경 또는 SMTP)
const transporter = nodemailer.createTransport({
  // Gmail 예시 (실제로는 환경변수 사용)
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 이메일 템플릿
const emailTemplates = {
  welcome: (data) => ({
    subject: `${data.name}님, CodeB Platform에 오신 것을 환영합니다!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F7EFF;">환영합니다!</h1>
        <p>안녕하세요 ${data.name}님,</p>
        <p>CodeB Platform에 가입해 주셔서 감사합니다.</p>
        <p>프로젝트 관리의 새로운 경험을 시작하세요!</p>
        <div style="margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
             style="background: #4F7EFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
            대시보드 바로가기
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          문의사항이 있으시면 support@codeb.com으로 연락주세요.
        </p>
      </div>
    `
  }),
  
  projectUpdate: (data) => ({
    subject: `프로젝트 업데이트: ${data.projectName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F7EFF;">프로젝트 업데이트</h2>
        <p><strong>프로젝트:</strong> ${data.projectName}</p>
        <p><strong>상태:</strong> ${data.status}</p>
        <p><strong>업데이트 내용:</strong></p>
        <p>${data.message}</p>
        <div style="margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/projects/${data.projectId}" 
             style="background: #4F7EFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
            프로젝트 보기
          </a>
        </div>
      </div>
    `
  }),
  
  taskAssigned: (data) => ({
    subject: `새 작업이 할당되었습니다: ${data.taskTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F7EFF;">새 작업 할당</h2>
        <p>${data.assigneeName}님에게 새 작업이 할당되었습니다.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>작업명:</strong> ${data.taskTitle}</p>
          <p><strong>프로젝트:</strong> ${data.projectName}</p>
          <p><strong>마감일:</strong> ${data.dueDate || '미정'}</p>
          <p><strong>우선순위:</strong> ${data.priority || '보통'}</p>
        </div>
        <div style="margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/projects/${data.projectId}/kanban" 
             style="background: #4F7EFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
            작업 확인하기
          </a>
        </div>
      </div>
    `
  }),
  
  invoiceCreated: (data) => ({
    subject: `청구서가 발행되었습니다: ${data.invoiceNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F7EFF;">청구서 발행</h2>
        <p>${data.clientName}님께 청구서가 발행되었습니다.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>청구서 번호:</strong> ${data.invoiceNumber}</p>
          <p><strong>금액:</strong> ₩${data.amount.toLocaleString()}</p>
          <p><strong>만기일:</strong> ${data.dueDate}</p>
        </div>
        <div style="margin: 30px 0;">
          <a href="${data.invoiceUrl}" 
             style="background: #4F7EFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
            청구서 확인
          </a>
        </div>
      </div>
    `
  }),
  
  workflow: (data) => ({
    subject: data.subject || `워크플로우 알림: ${data.workflowName}`,
    html: data.content || `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F7EFF;">워크플로우 알림</h2>
        <p>${data.message}</p>
      </div>
    `
  })
};

// 이메일 발송 함수
async function sendEmail({ to, subject, html, templateName, templateData }) {
  try {
    let emailContent = { to, subject, html };
    
    // 템플릿 사용
    if (templateName && emailTemplates[templateName]) {
      const template = emailTemplates[templateName](templateData);
      emailContent = {
        to,
        subject: template.subject,
        html: template.html
      };
    }
    
    // SendGrid 사용 (우선)
    if (process.env.SENDGRID_API_KEY) {
      const msg = {
        to: emailContent.to,
        from: process.env.EMAIL_FROM || 'noreply@codeb.com',
        subject: emailContent.subject,
        html: emailContent.html,
      };
      
      await sgMail.send(msg);
      console.log(`Email sent via SendGrid to ${to}`);
      return { success: true, provider: 'sendgrid' };
    }
    
    // Nodemailer 사용 (대체)
    if (process.env.EMAIL_USER) {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: emailContent.to,
        subject: emailContent.subject,
        html: emailContent.html
      };
      
      await transporter.sendMail(mailOptions);
      console.log(`Email sent via Nodemailer to ${to}`);
      return { success: true, provider: 'nodemailer' };
    }
    
    // 개발 환경 (콘솔 출력)
    console.log('=== Email (Dev Mode) ===');
    console.log('To:', emailContent.to);
    console.log('Subject:', emailContent.subject);
    console.log('Content:', emailContent.html.substring(0, 200) + '...');
    console.log('========================');
    
    return { success: true, provider: 'console' };
    
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
}

// 대량 이메일 발송 (배치 처리)
async function sendBulkEmails(emails) {
  const results = [];
  
  for (const email of emails) {
    try {
      const result = await sendEmail(email);
      results.push({ ...email, ...result });
    } catch (error) {
      results.push({ ...email, success: false, error: error.message });
    }
    
    // Rate limiting (1초 대기)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

module.exports = {
  sendEmail,
  sendBulkEmails,
  emailTemplates
};