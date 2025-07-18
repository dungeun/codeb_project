const admin = require('firebase-admin');

// Firebase Admin SDK 초기화
if (!admin.apps.length) {
  try {
    // 서비스 계정 키 파일 경로 (환경변수로 설정)
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_PATH 
      ? require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
      : null;
    
    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
      });
      console.log('Firebase Admin SDK initialized');
    } else {
      console.warn('Firebase service account not found. Push notifications disabled.');
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
  }
}

// 알림 템플릿
const notificationTemplates = {
  taskAssigned: (data) => ({
    title: '새 작업 할당',
    body: `"${data.taskTitle}" 작업이 할당되었습니다.`,
    data: {
      type: 'task_assigned',
      taskId: data.taskId,
      projectId: data.projectId
    }
  }),
  
  taskCompleted: (data) => ({
    title: '작업 완료',
    body: `${data.userName}님이 "${data.taskTitle}" 작업을 완료했습니다.`,
    data: {
      type: 'task_completed',
      taskId: data.taskId,
      projectId: data.projectId
    }
  }),
  
  projectUpdate: (data) => ({
    title: '프로젝트 업데이트',
    body: `"${data.projectName}" 프로젝트가 ${data.status}(으)로 변경되었습니다.`,
    data: {
      type: 'project_update',
      projectId: data.projectId
    }
  }),
  
  newMessage: (data) => ({
    title: data.senderName,
    body: data.message,
    data: {
      type: 'new_message',
      chatRoomId: data.chatRoomId,
      senderId: data.senderId
    }
  }),
  
  workflowNotification: (data) => ({
    title: data.title || '워크플로우 알림',
    body: data.message,
    data: {
      type: 'workflow',
      workflowId: data.workflowId
    }
  }),
  
  reminder: (data) => ({
    title: '리마인더',
    body: data.message,
    data: {
      type: 'reminder',
      relatedId: data.relatedId
    }
  })
};

// 단일 디바이스에 푸시 알림 전송
async function sendPushNotification({ token, title, body, data, templateName, templateData }) {
  if (!admin.apps.length) {
    console.warn('Firebase Admin not initialized. Cannot send push notification.');
    return { success: false, error: 'Firebase Admin not initialized' };
  }
  
  try {
    let notification = { title, body };
    let messageData = data || {};
    
    // 템플릿 사용
    if (templateName && notificationTemplates[templateName]) {
      const template = notificationTemplates[templateName](templateData);
      notification = {
        title: template.title,
        body: template.body
      };
      messageData = template.data;
    }
    
    const message = {
      notification,
      data: messageData,
      token,
      // iOS 설정
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      },
      // Android 설정
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK'
        }
      }
    };
    
    const response = await admin.messaging().send(message);
    console.log('Push notification sent:', response);
    return { success: true, messageId: response };
    
  } catch (error) {
    console.error('Push notification error:', error);
    return { success: false, error: error.message };
  }
}

// 여러 디바이스에 푸시 알림 전송
async function sendMulticastNotification({ tokens, title, body, data }) {
  if (!admin.apps.length || !tokens || tokens.length === 0) {
    return { success: false, error: 'No tokens provided or Firebase not initialized' };
  }
  
  try {
    const message = {
      notification: { title, body },
      data: data || {},
      tokens
    };
    
    const response = await admin.messaging().sendMulticast(message);
    console.log(`${response.successCount} messages sent successfully`);
    
    // 실패한 토큰 처리
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
          console.error(`Failed to send to token ${tokens[idx]}: ${resp.error}`);
        }
      });
      
      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        failedTokens
      };
    }
    
    return {
      success: true,
      successCount: response.successCount,
      failureCount: 0
    };
    
  } catch (error) {
    console.error('Multicast notification error:', error);
    return { success: false, error: error.message };
  }
}

// 토픽 기반 푸시 알림 전송
async function sendTopicNotification({ topic, title, body, data }) {
  if (!admin.apps.length) {
    return { success: false, error: 'Firebase Admin not initialized' };
  }
  
  try {
    const message = {
      notification: { title, body },
      data: data || {},
      topic
    };
    
    const response = await admin.messaging().send(message);
    console.log('Topic notification sent:', response);
    return { success: true, messageId: response };
    
  } catch (error) {
    console.error('Topic notification error:', error);
    return { success: false, error: error.message };
  }
}

// 디바이스 토큰을 토픽에 구독
async function subscribeToTopic(tokens, topic) {
  if (!admin.apps.length) {
    return { success: false, error: 'Firebase Admin not initialized' };
  }
  
  try {
    const response = await admin.messaging().subscribeToTopic(tokens, topic);
    console.log(`Successfully subscribed ${response.successCount} tokens to topic ${topic}`);
    return { success: true, successCount: response.successCount };
  } catch (error) {
    console.error('Topic subscription error:', error);
    return { success: false, error: error.message };
  }
}

// 디바이스 토큰을 토픽에서 구독 해제
async function unsubscribeFromTopic(tokens, topic) {
  if (!admin.apps.length) {
    return { success: false, error: 'Firebase Admin not initialized' };
  }
  
  try {
    const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
    console.log(`Successfully unsubscribed ${response.successCount} tokens from topic ${topic}`);
    return { success: true, successCount: response.successCount };
  } catch (error) {
    console.error('Topic unsubscription error:', error);
    return { success: false, error: error.message };
  }
}

// 사용자별 알림 설정에 따른 푸시 알림 전송
async function sendUserNotification(userId, notificationType, data) {
  try {
    // Firebase에서 사용자 설정 조회 (실제 구현 시)
    const db = admin.database();
    const userRef = db.ref(`users/${userId}`);
    const snapshot = await userRef.once('value');
    const userData = snapshot.val();
    
    if (!userData || !userData.fcmToken) {
      console.log(`No FCM token for user ${userId}`);
      return { success: false, error: 'No FCM token' };
    }
    
    // 사용자 알림 설정 확인
    const notificationSettings = userData.notificationSettings || {};
    if (notificationSettings[notificationType] === false) {
      console.log(`User ${userId} has disabled ${notificationType} notifications`);
      return { success: false, error: 'Notification disabled by user' };
    }
    
    // 템플릿 기반 알림 전송
    return await sendPushNotification({
      token: userData.fcmToken,
      templateName: notificationType,
      templateData: data
    });
    
  } catch (error) {
    console.error('User notification error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendPushNotification,
  sendMulticastNotification,
  sendTopicNotification,
  subscribeToTopic,
  unsubscribeFromTopic,
  sendUserNotification,
  notificationTemplates
};