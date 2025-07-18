# 워크플로우 서버 설정 가이드

## 개요
워크플로우 서버는 자동화된 작업 실행, 이메일 발송, 푸시 알림을 처리하는 백엔드 서비스입니다.

## 필수 패키지 설치

```bash
npm install node-cron @sendgrid/mail nodemailer firebase-admin concurrently
```

## 환경 변수 설정

### 1. 워크플로우 서버 기본 설정

#### 자동 감지 모드 (권장)
환경 변수를 설정하지 않으면 시스템이 자동으로 워크플로우 서버를 감지합니다:
- localhost:3004
- 같은 네트워크의 서버
- 캐시된 서버 URL

#### 수동 설정
특정 서버를 지정하려면 환경 변수를 설정하세요:
```env
NEXT_PUBLIC_WORKFLOW_API_URL=http://localhost:3004
WORKFLOW_PORT=3004
```

### 2. 이메일 서비스 설정

#### SendGrid 사용 시 (권장)
1. [SendGrid](https://sendgrid.com) 계정 생성
2. API 키 발급
3. 환경 변수 설정:
```env
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@yourcompany.com
```

#### SMTP 사용 시 (Gmail 예시)
1. Gmail 2단계 인증 활성화
2. 앱 비밀번호 생성
3. 환경 변수 설정:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=your_email@gmail.com
```

### 3. 푸시 알림 설정 (Firebase Cloud Messaging)

1. Firebase Console에서 프로젝트 설정
2. 서비스 계정 키 다운로드:
   - Firebase Console → 프로젝트 설정 → 서비스 계정
   - "새 비공개 키 생성" 클릭
   - JSON 파일 다운로드

3. 다운로드한 파일을 프로젝트에 저장 (예: `server/firebase-service-account.json`)
4. 환경 변수 설정:
```env
FIREBASE_SERVICE_ACCOUNT_PATH=./server/firebase-service-account.json
```

⚠️ **중요**: 서비스 계정 키 파일을 절대 Git에 커밋하지 마세요. `.gitignore`에 추가하세요.

## 서버 실행

### 개별 실행
```bash
# 워크플로우 서버만 실행
npm run workflow-server

# Socket.io 서버만 실행
npm run socket-server
```

### 동시 실행 (권장)
```bash
# 모든 백엔드 서버 동시 실행
npm run servers
```

### 개발 환경에서 전체 실행
```bash
# 터미널 1: Next.js 개발 서버
npm run dev

# 터미널 2: 백엔드 서버들
npm run servers
```

## 기능 테스트

### 1. 워크플로우 실행 테스트
1. 대시보드에서 자동화 메뉴 접속
2. 새 워크플로우 생성
3. 이메일 또는 알림 액션 추가
4. "지금 실행" 버튼 클릭

### 2. 이메일 전송 테스트
```bash
curl -X POST http://localhost:3004/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "테스트 이메일",
    "html": "<h1>안녕하세요</h1><p>테스트 이메일입니다.</p>"
  }'
```

### 3. 서버 상태 확인
```bash
curl http://localhost:3004/health
```

## 프로덕션 배포

### 1. PM2를 사용한 프로세스 관리
```bash
# PM2 설치
npm install -g pm2

# ecosystem.config.js 생성
module.exports = {
  apps: [
    {
      name: 'workflow-server',
      script: './server/workflow-server.js',
      env: {
        NODE_ENV: 'production',
        WORKFLOW_PORT: 3004
      }
    },
    {
      name: 'socket-server',
      script: './server/socket-server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3003
      }
    }
  ]
};

# 서버 시작
pm2 start ecosystem.config.js

# 자동 재시작 설정
pm2 startup
pm2 save
```

### 2. Docker 사용
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3003 3004

CMD ["npm", "run", "servers"]
```

## 문제 해결

### 이메일이 전송되지 않을 때
1. 환경 변수 확인
2. SendGrid API 키 또는 SMTP 설정 확인
3. 방화벽/보안 그룹에서 SMTP 포트 허용 확인

### 푸시 알림이 작동하지 않을 때
1. Firebase 서비스 계정 키 파일 경로 확인
2. Firebase 프로젝트 설정 확인
3. 클라이언트 FCM 토큰 등록 확인

### 스케줄된 워크플로우가 실행되지 않을 때
1. Cron 표현식 문법 확인
2. 서버 시간대 설정 확인
3. 워크플로우 활성화 상태 확인

## 모니터링

### 로그 확인
```bash
# PM2 사용 시
pm2 logs workflow-server
pm2 logs socket-server

# Docker 사용 시
docker logs [container-id]
```

### 메트릭 수집
- `/health` 엔드포인트로 서버 상태 모니터링
- 워크플로우 실행 횟수, 성공/실패율 추적
- 이메일 발송 통계 수집