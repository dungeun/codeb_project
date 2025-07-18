const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');
const emailService = require('./email-service');
const pushNotificationService = require('./push-notification-service');

const app = express();
const PORT = process.env.WORKFLOW_PORT || 3004;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage (production에서는 DB 사용)
const workflows = new Map();
const executionLogs = new Map();
const scheduledJobs = new Map();

// 워크플로우 저장
app.post('/api/workflows', (req, res) => {
  const workflow = {
    ...req.body,
    id: req.body.id || uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  workflows.set(workflow.id, workflow);
  
  // 스케줄 기반 워크플로우 등록
  if (workflow.enabled && workflow.trigger.type === 'schedule') {
    scheduleWorkflow(workflow);
  }
  
  res.json({ success: true, workflow });
});

// 워크플로우 목록 조회
app.get('/api/workflows', (req, res) => {
  const workflowList = Array.from(workflows.values());
  res.json({ workflows: workflowList });
});

// 워크플로우 수정
app.put('/api/workflows/:id', (req, res) => {
  const { id } = req.params;
  const existingWorkflow = workflows.get(id);
  
  if (!existingWorkflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }
  
  // 기존 스케줄 제거
  if (scheduledJobs.has(id)) {
    scheduledJobs.get(id).stop();
    scheduledJobs.delete(id);
  }
  
  const updatedWorkflow = {
    ...existingWorkflow,
    ...req.body,
    id,
    updatedAt: new Date().toISOString()
  };
  
  workflows.set(id, updatedWorkflow);
  
  // 새 스케줄 등록
  if (updatedWorkflow.enabled && updatedWorkflow.trigger.type === 'schedule') {
    scheduleWorkflow(updatedWorkflow);
  }
  
  res.json({ success: true, workflow: updatedWorkflow });
});

// 워크플로우 삭제
app.delete('/api/workflows/:id', (req, res) => {
  const { id } = req.params;
  
  // 스케줄 제거
  if (scheduledJobs.has(id)) {
    scheduledJobs.get(id).stop();
    scheduledJobs.delete(id);
  }
  
  workflows.delete(id);
  res.json({ success: true });
});

// 워크플로우 수동 실행
app.post('/api/workflows/:id/execute', async (req, res) => {
  const { id } = req.params;
  const workflow = workflows.get(id);
  
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }
  
  const executionId = uuidv4();
  const execution = {
    id: executionId,
    workflowId: id,
    status: 'running',
    startedAt: new Date().toISOString(),
    logs: []
  };
  
  executionLogs.set(executionId, execution);
  
  // 비동기로 워크플로우 실행
  executeWorkflow(workflow, executionId).catch(console.error);
  
  res.json({ success: true, executionId });
});

// 실행 로그 조회
app.get('/api/executions/:workflowId', (req, res) => {
  const { workflowId } = req.params;
  const logs = Array.from(executionLogs.values())
    .filter(log => log.workflowId === workflowId)
    .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
  
  res.json({ executions: logs });
});

// 워크플로우 스케줄링
function scheduleWorkflow(workflow) {
  const { schedule } = workflow.trigger;
  
  if (!schedule || !cron.validate(schedule)) {
    console.error(`Invalid cron expression: ${schedule}`);
    return;
  }
  
  const job = cron.schedule(schedule, async () => {
    const executionId = uuidv4();
    const execution = {
      id: executionId,
      workflowId: workflow.id,
      status: 'running',
      startedAt: new Date().toISOString(),
      logs: []
    };
    
    executionLogs.set(executionId, execution);
    await executeWorkflow(workflow, executionId);
  });
  
  scheduledJobs.set(workflow.id, job);
  console.log(`Scheduled workflow ${workflow.name} with cron: ${schedule}`);
}

// 워크플로우 실행 엔진
async function executeWorkflow(workflow, executionId) {
  const execution = executionLogs.get(executionId);
  
  try {
    for (const action of workflow.actions) {
      execution.logs.push({
        timestamp: new Date().toISOString(),
        message: `Executing action: ${action.name}`,
        type: 'info'
      });
      
      await executeAction(action, workflow, execution);
    }
    
    execution.status = 'completed';
    execution.completedAt = new Date().toISOString();
    execution.logs.push({
      timestamp: new Date().toISOString(),
      message: 'Workflow completed successfully',
      type: 'success'
    });
  } catch (error) {
    execution.status = 'failed';
    execution.completedAt = new Date().toISOString();
    execution.logs.push({
      timestamp: new Date().toISOString(),
      message: `Workflow failed: ${error.message}`,
      type: 'error'
    });
  }
  
  executionLogs.set(executionId, execution);
}

// 액션 실행
async function executeAction(action, workflow, execution) {
  switch (action.type) {
    case 'notification':
      // 실제 알림은 notification-service를 통해 전송
      console.log(`Sending notification: ${action.config.message}`);
      execution.logs.push({
        timestamp: new Date().toISOString(),
        message: `Notification sent: ${action.config.message}`,
        type: 'info'
      });
      break;
      
    case 'email':
      // 이메일 서비스 호출 (아래에서 구현)
      const emailService = require('./email-service');
      await emailService.sendEmail({
        to: action.config.recipient,
        subject: action.config.subject,
        html: action.config.content
      });
      execution.logs.push({
        timestamp: new Date().toISOString(),
        message: `Email sent to ${action.config.recipient}`,
        type: 'info'
      });
      break;
      
    case 'task':
      // Firebase에 작업 생성
      console.log(`Creating task: ${action.config.title}`);
      execution.logs.push({
        timestamp: new Date().toISOString(),
        message: `Task created: ${action.config.title}`,
        type: 'info'
      });
      break;
      
    case 'webhook':
      // 외부 API 호출
      const axios = require('axios');
      try {
        await axios({
          method: action.config.method || 'POST',
          url: action.config.url,
          data: action.config.body,
          headers: action.config.headers
        });
        execution.logs.push({
          timestamp: new Date().toISOString(),
          message: `Webhook called: ${action.config.url}`,
          type: 'info'
        });
      } catch (error) {
        throw new Error(`Webhook failed: ${error.message}`);
      }
      break;
      
    case 'condition':
      // 조건 평가 (간단한 예시)
      const condition = action.config.condition;
      const result = eval(condition); // 실제로는 안전한 평가 방법 사용
      execution.logs.push({
        timestamp: new Date().toISOString(),
        message: `Condition evaluated: ${condition} = ${result}`,
        type: 'info'
      });
      if (!result) {
        throw new Error('Condition not met, stopping workflow');
      }
      break;
      
    case 'wait':
      // 대기
      const delay = action.config.duration * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      execution.logs.push({
        timestamp: new Date().toISOString(),
        message: `Waited for ${action.config.duration} seconds`,
        type: 'info'
      });
      break;
      
    default:
      console.log(`Unknown action type: ${action.type}`);
  }
}

// 이메일 전송 엔드포인트
app.post('/api/email/send', async (req, res) => {
  try {
    const result = await emailService.sendEmail(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 대량 이메일 전송 엔드포인트
app.post('/api/email/send-bulk', async (req, res) => {
  try {
    const { emails } = req.body;
    const results = await emailService.sendBulkEmails(emails);
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 푸시 알림 전송 엔드포인트
app.post('/api/notifications/push', async (req, res) => {
  try {
    const { userId, token, title, body, data, templateName, templateData } = req.body;
    
    let result;
    if (userId) {
      // 사용자 ID로 전송
      result = await pushNotificationService.sendUserNotification(userId, templateName, templateData);
    } else if (token) {
      // 토큰으로 직접 전송
      result = await pushNotificationService.sendPushNotification({ token, title, body, data, templateName, templateData });
    } else {
      return res.status(400).json({ error: 'userId 또는 token이 필요합니다' });
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 멀티캐스트 푸시 알림
app.post('/api/notifications/push-multicast', async (req, res) => {
  try {
    const { tokens, title, body, data } = req.body;
    const result = await pushNotificationService.sendMulticastNotification({ tokens, title, body, data });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 토픽 구독
app.post('/api/notifications/subscribe', async (req, res) => {
  try {
    const { tokens, topic } = req.body;
    const result = await pushNotificationService.subscribeToTopic(tokens, topic);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 서버 상태 체크
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    uptime: process.uptime(),
    workflows: workflows.size,
    scheduledJobs: scheduledJobs.size,
    executionLogs: executionLogs.size
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Workflow server running on port ${PORT}`);
  console.log(`- Email service: ${process.env.SENDGRID_API_KEY ? 'SendGrid' : process.env.EMAIL_USER ? 'SMTP' : 'Console (Dev)'}`);
  console.log(`- Push notifications: ${process.env.FIREBASE_SERVICE_ACCOUNT_PATH ? 'Enabled' : 'Disabled'}`);
  
  // 기존 워크플로우 로드 및 스케줄 시작 (실제로는 DB에서 로드)
  console.log('Loading existing workflows...');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down workflow server...');
  
  // 모든 스케줄 중지
  scheduledJobs.forEach(job => job.stop());
  
  process.exit(0);
});