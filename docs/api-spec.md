# CodeB Platform API 명세서

## 개요

CodeB 플랫폼의 RESTful API 명세서입니다. 현재는 Mock 데이터를 사용하고 있으며, 추후 실제 백엔드 API로 교체될 예정입니다.

## 기본 정보

- **Base URL**: `https://api.codeb.com/v1` (향후 구현)
- **인증 방식**: JWT Bearer Token
- **데이터 형식**: JSON
- **문자 인코딩**: UTF-8

## 인증 (Authentication)

### POST /auth/login
사용자 로그인

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "name": "string", 
      "email": "string",
      "role": "customer | admin | team_member | accountant"
    },
    "token": "string",
    "refreshToken": "string"
  }
}
```

### POST /auth/logout
사용자 로그아웃

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "로그아웃되었습니다."
}
```

### POST /auth/forgot-password
비밀번호 재설정 요청

**Request Body:**
```json
{
  "email": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "비밀번호 재설정 링크가 이메일로 전송되었습니다."
}
```

## 프로젝트 관리 (Projects)

### GET /projects
프로젝트 목록 조회

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `status`: string (선택) - 프로젝트 상태 필터
- `page`: number (선택) - 페이지 번호 (기본값: 1)
- `limit`: number (선택) - 페이지당 항목 수 (기본값: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "status": "planning | design | development | testing | deployment | completed",
        "progress": 0-100,
        "startDate": "2024-01-01T00:00:00.000Z",
        "endDate": "2024-02-01T00:00:00.000Z",
        "clientId": "string",
        "teamMembers": ["string"],
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

### GET /projects/{id}
특정 프로젝트 조회

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "string",
      "name": "string",
      "description": "string",
      "status": "planning | design | development | testing | deployment | completed",
      "progress": 0-100,
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-02-01T00:00:00.000Z",
      "clientId": "string",
      "teamMembers": ["string"],
      "timeline": [
        {
          "phase": "string",
          "startDate": "2024-01-01T00:00:00.000Z",
          "endDate": "2024-01-15T00:00:00.000Z",
          "status": "completed | in_progress | pending"
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

## 파일 관리 (Files)

### GET /files
파일 목록 조회

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `projectId`: string (선택) - 프로젝트 ID 필터
- `category`: string (선택) - 파일 카테고리 필터
- `page`: number (선택) - 페이지 번호

**Response:**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "id": "string",
        "name": "string",
        "size": 1024,
        "type": "string",
        "category": "document | image | video | other",
        "url": "string",
        "projectId": "string",
        "uploadedBy": "string",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### POST /files/upload
파일 업로드

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request Body:**
```
files: File[] (multipart)
projectId: string (optional)
category: string (optional)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "id": "string",
        "name": "string",
        "size": 1024,
        "type": "string",
        "category": "document | image | video | other",
        "url": "string",
        "projectId": "string",
        "uploadedBy": "string",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### GET /files/{id}/download
파일 다운로드

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
파일 스트림

### DELETE /files/{id}
파일 삭제

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "파일이 삭제되었습니다."
}
```

### GET /files/download-history
파일 다운로드 이력 조회

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `fileId`: string (선택) - 특정 파일의 이력만 조회
- `page`: number (선택) - 페이지 번호

**Response:**
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "id": "string",
        "fileId": "string",
        "fileName": "string",
        "downloadedBy": "string",
        "downloadedAt": "2024-01-01T00:00:00.000Z",
        "userAgent": "string",
        "ipAddress": "string"
      }
    ]
  }
}
```

## 채팅 (Chat)

### GET /chat/rooms
채팅방 목록 조회

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rooms": [
      {
        "id": "string",
        "name": "string",
        "projectId": "string",
        "participants": ["string"],
        "lastMessage": {
          "content": "string",
          "senderId": "string",
          "timestamp": "2024-01-01T00:00:00.000Z"
        },
        "unreadCount": 0,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### GET /chat/rooms/{roomId}/messages
채팅 메시지 조회

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `page`: number (선택) - 페이지 번호
- `limit`: number (선택) - 메시지 수

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "string",
        "content": "string",
        "senderId": "string",
        "senderName": "string",
        "timestamp": "2024-01-01T00:00:00.000Z",
        "read": true,
        "files": [
          {
            "id": "string",
            "name": "string",
            "size": 1024,
            "type": "string",
            "url": "string"
          }
        ]
      }
    ]
  }
}
```

### POST /chat/rooms/{roomId}/messages
메시지 전송

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json or multipart/form-data
```

**Request Body (텍스트 메시지):**
```json
{
  "content": "string"
}
```

**Request Body (파일 첨부):**
```
content: string (optional)
files: File[] (multipart)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": {
      "id": "string",
      "content": "string",
      "senderId": "string",
      "senderName": "string",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "read": false,
      "files": []
    }
  }
}
```

## 알림 (Notifications)

### GET /notifications
알림 목록 조회

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `unread`: boolean (선택) - 읽지 않은 알림만 조회
- `type`: string (선택) - 알림 타입 필터

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "string",
        "type": "message | project_update | file_upload | system",
        "title": "string",
        "content": "string",
        "read": false,
        "userId": "string",
        "relatedId": "string",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### PUT /notifications/{id}/read
알림 읽음 처리

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "알림이 읽음 처리되었습니다."
}
```

## 에러 응답 형식

모든 API 엔드포인트는 실패 시 다음과 같은 형식으로 응답합니다:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "에러 메시지",
    "details": "상세 에러 정보 (선택사항)"
  }
}
```

## HTTP 상태 코드

- `200`: 성공
- `201`: 생성 성공
- `400`: 잘못된 요청
- `401`: 인증 실패
- `403`: 권한 없음
- `404`: 리소스를 찾을 수 없음
- `409`: 충돌 (중복 데이터 등)
- `422`: 입력 데이터 검증 실패
- `500`: 서버 내부 오류

## WebSocket API (실시간 기능)

### 연결
```
wss://api.codeb.com/ws?token={jwt_token}
```

### 이벤트

#### 채팅 메시지
```json
{
  "type": "message",
  "data": {
    "roomId": "string",
    "message": {
      "id": "string",
      "content": "string",
      "senderId": "string",
      "senderName": "string",
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### 타이핑 상태
```json
{
  "type": "typing",
  "data": {
    "roomId": "string",
    "userId": "string",
    "isTyping": true
  }
}
```

#### 온라인 상태
```json
{
  "type": "presence",
  "data": {
    "userId": "string",
    "status": "online | offline"
  }
}
```

---

**참고**: 현재 구현은 Mock 데이터를 사용하고 있으며, 실제 API 서버 구축 시 이 명세서를 기준으로 구현될 예정입니다.