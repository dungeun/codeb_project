# CodeB Platform API 문서

## Firebase Realtime Database 구조

### 1. Users Collection
```json
{
  "users": {
    "$uid": {
      "uid": "string",
      "email": "string",
      "displayName": "string",
      "role": "admin | manager | developer | customer",
      "createdAt": "ISO 8601 timestamp",
      "lastLogin": "ISO 8601 timestamp",
      "isOnline": "boolean",
      "avatar": "string (optional)",
      "phone": "string (optional)",
      "company": "string (optional)"
    }
  }
}
```

### 2. Projects Collection
```json
{
  "projects": {
    "$projectId": {
      "id": "string",
      "name": "string",
      "description": "string",
      "status": "planning | design | development | testing | completed",
      "progress": "number (0-100)",
      "startDate": "ISO 8601 timestamp",
      "endDate": "ISO 8601 timestamp",
      "budget": "number",
      "spentBudget": "number (optional)",
      "team": ["array of member emails"],
      "clientId": "string",
      "createdAt": "ISO 8601 timestamp",
      "updatedAt": "ISO 8601 timestamp",
      "createdBy": "string (uid)",
      "completedTasks": "number",
      "activeTasks": "number",
      "totalTasks": "number",
      "milestones": {
        "$milestoneId": {
          "id": "string",
          "title": "string",
          "date": "ISO 8601 timestamp",
          "completed": "boolean",
          "description": "string"
        }
      },
      "tasks": {
        "$taskId": {
          "id": "string",
          "title": "string",
          "description": "string",
          "status": "pending | in_progress | completed",
          "assignee": "string",
          "dueDate": "ISO 8601 timestamp",
          "priority": "low | medium | high",
          "createdAt": "ISO 8601 timestamp",
          "createdBy": "string (uid)"
        }
      }
    }
  }
}
```

### 3. Chat Collections

#### ChatRooms
```json
{
  "chatRooms": {
    "$roomId": {
      "id": "string",
      "name": "string",
      "type": "direct | group | support",
      "participants": ["array of user uids"],
      "lastMessage": "string",
      "lastMessageTime": "ISO 8601 timestamp",
      "unreadCount": "number",
      "projectId": "string (optional)",
      "createdAt": "ISO 8601 timestamp",
      "createdBy": "string (uid)"
    }
  }
}
```

#### Messages
```json
{
  "messages": {
    "$roomId": {
      "$messageId": {
        "id": "string",
        "content": "string",
        "senderId": "string (uid)",
        "senderName": "string",
        "timestamp": "ISO 8601 timestamp",
        "read": "boolean",
        "type": "text | file | image | system",
        "edited": "boolean (optional)",
        "editedAt": "ISO 8601 timestamp (optional)",
        "files": [{
          "name": "string",
          "size": "number",
          "type": "string",
          "url": "string"
        }]
      }
    }
  }
}
```

#### Typing Status
```json
{
  "typing": {
    "$roomId": {
      "$userId": "ISO 8601 timestamp | null"
    }
  }
}
```

### 4. Activities Collection
```json
{
  "activities": {
    "$activityId": {
      "id": "string",
      "type": "project | task | message | file",
      "icon": "string (emoji)",
      "title": "string",
      "description": "string",
      "time": "ISO 8601 timestamp",
      "userId": "string (uid)",
      "userName": "string"
    }
  }
}
```

### 5. Notifications Collection
```json
{
  "notifications": {
    "$userId": {
      "$notificationId": {
        "id": "string",
        "type": "info | warning | success | error",
        "title": "string",
        "message": "string",
        "time": "ISO 8601 timestamp",
        "read": "boolean"
      }
    }
  }
}
```

### 6. Financial Data
```json
{
  "financial": {
    "totalRevenue": "number",
    "monthlyRevenue": "number",
    "yearlyRevenue": "number",
    "expenses": "number",
    "profit": "number",
    "lastUpdated": "ISO 8601 timestamp"
  }
}
```

### 7. Project Activities
```json
{
  "projectActivities": {
    "$projectId": {
      "$activityId": {
        "id": "string",
        "type": "task | status | file | comment",
        "message": "string",
        "user": "string",
        "timestamp": "ISO 8601 timestamp",
        "icon": "string (emoji)"
      }
    }
  }
}
```

## 🔐 Firebase Security Rules

### Database Rules
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "users": {
      "$uid": {
        ".read": true,
        ".write": "$uid === auth.uid || (auth != null && root.child('users').child(auth.uid).child('role').val() === 'admin')",
        "isOnline": {
          ".write": "$uid === auth.uid"
        },
        "lastLogin": {
          ".write": "$uid === auth.uid"
        }
      }
    },
    "chatRooms": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$roomId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    "messages": {
      "$roomId": {
        ".read": "auth != null",
        ".write": "auth != null",
        "$messageId": {
          ".validate": "newData.hasChildren(['senderId', 'message', 'timestamp'])"
        }
      }
    },
    "typing": {
      "$roomId": {
        "$userId": {
          ".read": "auth != null",
          ".write": "$userId === auth.uid"
        }
      }
    }
  }
}
```

## 🔄 Real-time Listeners

### 프로젝트 데이터 리스너
```typescript
const projectsRef = ref(database, 'projects')
onValue(projectsRef, (snapshot) => {
  const projects = snapshot.val()
  // 프로젝트 데이터 처리
})
```

### 채팅 메시지 리스너
```typescript
const messagesRef = ref(database, `messages/${roomId}`)
onValue(messagesRef, (snapshot) => {
  const messages = snapshot.val()
  // 메시지 데이터 처리
})
```

### 온라인 상태 리스너
```typescript
const onlineRef = ref(database, 'users')
onValue(onlineRef, (snapshot) => {
  const users = snapshot.val()
  const onlineUsers = Object.entries(users)
    .filter(([_, user]) => user.isOnline)
    .map(([uid]) => uid)
})
```

## 📡 Socket.io Events

### Client → Server

#### join_room
```javascript
socket.emit('join_room', { roomId, userId })
```

#### leave_room
```javascript
socket.emit('leave_room', { roomId, userId })
```

#### send_message
```javascript
socket.emit('send_message', {
  roomId,
  message: {
    content: string,
    senderId: string,
    timestamp: Date
  }
})
```

#### typing_start
```javascript
socket.emit('typing_start', { roomId, userId })
```

#### typing_stop
```javascript
socket.emit('typing_stop', { roomId, userId })
```

### Server → Client

#### user_joined
```javascript
socket.on('user_joined', ({ userId, roomId }) => {
  // 사용자가 채팅방에 입장
})
```

#### user_left
```javascript
socket.on('user_left', ({ userId, roomId }) => {
  // 사용자가 채팅방에서 퇴장
})
```

#### new_message
```javascript
socket.on('new_message', (message) => {
  // 새 메시지 수신
})
```

#### user_typing
```javascript
socket.on('user_typing', ({ userId, roomId }) => {
  // 사용자가 타이핑 중
})
```

## 🛠 Helper Functions

### Firebase Timestamp 변환
```typescript
// Firebase 서버 타임스탬프를 Date 객체로 변환
const toDate = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate()
  }
  return new Date(timestamp)
}
```

### 사용자 권한 확인
```typescript
const hasPermission = (
  userRole: string, 
  requiredRoles: string[]
): boolean => {
  return requiredRoles.includes(userRole)
}
```

### 데이터 필터링
```typescript
// 역할별 데이터 필터링
const filterByRole = (data: any[], userRole: string) => {
  if (userRole === 'admin') return data
  if (userRole === 'customer') {
    return data.filter(item => item.clientId === userId)
  }
  return data.filter(item => item.team?.includes(userEmail))
}
```

## 📊 데이터 집계

### 프로젝트 통계
```typescript
const calculateProjectStats = (projects: Project[]) => {
  return {
    total: projects.length,
    active: projects.filter(p => p.status !== 'completed').length,
    completed: projects.filter(p => p.status === 'completed').length,
    averageProgress: projects.reduce((sum, p) => sum + p.progress, 0) / projects.length
  }
}
```

### 작업 통계
```typescript
const calculateTaskStats = (tasks: Task[]) => {
  return {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length
  }
}
```

---

최종 업데이트: 2025-07-08