# Vercel 배포 가이드

## 개요
이 문서는 CodeB Platform을 Vercel에 배포하는 방법을 설명합니다. Socket.IO와 Workflow 서버가 Firebase로 통합되어 별도의 백엔드 서버 없이 배포가 가능합니다.

## 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 설정해야 합니다:

### Firebase 설정 (필수)
```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=your-database-url

# Firebase Admin SDK (서버 사이드)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key
```

### 이메일 서비스 설정 (선택)

#### SendGrid 사용 시:
```
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
```

#### SMTP 사용 시:
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
```

### 기타 설정
```
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-secret-key
```

## 배포 단계

1. **GitHub 저장소 연결**
   - Vercel 대시보드에서 "New Project" 클릭
   - GitHub 저장소 선택
   - Import 클릭

2. **환경 변수 설정**
   - Project Settings > Environment Variables
   - 위의 환경 변수 추가

3. **빌드 설정 확인**
   - Framework Preset: Next.js
   - Build Command: `npm run build || true`
   - Output Directory: `.next`

4. **배포**
   - Deploy 버튼 클릭
   - 배포 완료 대기

## 배포 후 설정

### Firebase 보안 규칙 업데이트
Firebase Console에서 다음 도메인을 허용 목록에 추가:
- `https://your-app.vercel.app`
- `https://your-custom-domain.com` (사용자 정의 도메인 사용 시)

### CORS 설정
Firebase Storage 사용 시 CORS 설정:
```json
[
  {
    "origin": ["https://your-app.vercel.app"],
    "method": ["GET", "HEAD", "DELETE", "POST", "PUT"],
    "maxAgeSeconds": 3600
  }
]
```

## 주요 변경사항

### Socket.IO → Firebase Realtime Database
- 실시간 채팅: Firebase Realtime Database 사용
- Presence 관리: Firebase Presence 시스템
- 메시지 동기화: Firebase 자동 동기화

### Workflow Server → Next.js API Routes
- 워크플로우 실행: `/api/workflows`
- 이메일 전송: `/api/email`
- 스케줄링: Firebase + Vercel Cron (Pro 플랜)

## 모니터링

### Vercel Analytics
- 프로젝트 대시보드에서 Analytics 탭 확인
- 페이지 로드 시간, 방문자 수 모니터링

### Firebase Console
- Realtime Database 사용량 모니터링
- Authentication 사용자 수 확인
- Storage 용량 확인

## 문제 해결

### 빌드 오류
- TypeScript 오류: `npm run type-check` 로컬 실행
- 의존성 오류: `package-lock.json` 삭제 후 재생성

### 환경 변수 오류
- 모든 `NEXT_PUBLIC_` 변수가 클라이언트에서 접근 가능한지 확인
- 서버 전용 변수는 `NEXT_PUBLIC_` 접두사 없이 설정

### Firebase 연결 오류
- Firebase 프로젝트 설정 확인
- 도메인 허용 목록 확인
- API 키 유효성 확인

## 추가 최적화

### 이미지 최적화
```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
}
```

### 캐싱 설정
```javascript
// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=1, stale-while-revalidate"
        }
      ]
    }
  ]
}
```