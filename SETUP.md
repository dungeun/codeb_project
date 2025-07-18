# CodeB Platform 설치 및 설정 가이드

## 📋 사전 요구사항

- Node.js 18.0.0 이상
- npm 또는 yarn
- Git
- Firebase 계정
- 코드 에디터 (VS Code 권장)

## 🚀 빠른 시작

### 1. 프로젝트 클론
```bash
git clone https://github.com/your-username/project_cms.git
cd project_cms
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
`.env.local` 파일 생성:
```bash
cp .env.example .env.local
```

### 4. 개발 서버 실행
```bash
npm run dev
```

http://localhost:3000 에서 앱 확인

## 🔥 Firebase 설정 상세 가이드

### 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com) 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: project-cms)
4. Google Analytics 설정 (선택사항)

### 2. Authentication 설정

1. Firebase Console > Authentication > Sign-in method
2. 다음 인증 제공자 활성화:
   - 이메일/비밀번호
   - Google

### 3. Realtime Database 설정

1. Firebase Console > Realtime Database
2. "데이터베이스 만들기" 클릭
3. 보안 규칙 모드 선택: "테스트 모드에서 시작"
4. 데이터베이스 위치 선택 (가장 가까운 지역)

### 4. Storage 설정

1. Firebase Console > Storage
2. "시작하기" 클릭
3. 보안 규칙 설정 (기본값 사용)
4. Cloud Storage 위치 선택

### 5. Firebase 설정 파일 가져오기

1. Firebase Console > 프로젝트 설정 > 일반
2. "내 앱" 섹션에서 웹 앱 추가 (</> 아이콘)
3. 앱 닉네임 입력
4. Firebase SDK 구성 복사

### 6. 환경 변수 설정

`.env.local` 파일에 Firebase 구성 추가:
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
NEXT_PUBLIC_FIREBASE_DATABASE_URL=your_database_url_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id_here

# Socket.io Server URL
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# App Configuration
NEXT_PUBLIC_APP_NAME=CodeB Platform
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 7. Firebase 보안 규칙 설정

`firebase-database-rules.json` 내용을 Firebase Console > Realtime Database > 규칙에 복사:

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

## 🧪 테스트 데이터 설정

### 1. 테스트 계정 생성
```bash
npm run create-accounts
```

생성되는 계정:
- **관리자**: admin@codeb.com / admin123!
- **고객**: customer@test.com / customer123!
- **개발자**: developer@codeb.com / dev123!

### 2. 샘플 데이터 생성
```bash
npm run seed
```

생성되는 데이터:
- 3개의 샘플 프로젝트
- 20개의 활동 기록
- 15개의 알림
- 2개의 채팅방
- 재무 데이터

## 🖥️ 개발 환경 설정

### VS Code 설정

1. 추천 확장 프로그램 설치:
   ```bash
   code --install-extension dbaeumer.vscode-eslint
   code --install-extension esbenp.prettier-vscode
   code --install-extension bradlc.vscode-tailwindcss
   code --install-extension dsznajder.vscode-firebase
   ```

2. 워크스페이스 설정 (`.vscode/settings.json`):
   ```json
   {
     "editor.formatOnSave": true,
     "editor.defaultFormatter": "esbenp.prettier-vscode",
     "editor.codeActionsOnSave": {
       "source.fixAll.eslint": true
     },
     "tailwindCSS.includeLanguages": {
       "typescript": "javascript",
       "typescriptreact": "javascript"
     }
   }
   ```

### Git 설정

1. Git hooks 설정:
   ```bash
   npm install --save-dev husky
   npx husky init
   ```

2. Pre-commit hook (`.husky/pre-commit`):
   ```bash
   #!/bin/sh
   . "$(dirname "$0")/_/husky.sh"
   
   npm run lint
   npm run type-check
   ```

## 🚀 배포

### Vercel 배포

1. Vercel CLI 설치:
   ```bash
   npm i -g vercel
   ```

2. 프로젝트 연결:
   ```bash
   vercel
   ```

3. 환경 변수 설정:
   - Vercel 대시보드 > Settings > Environment Variables
   - `.env.local`의 모든 변수 추가

4. 배포:
   ```bash
   vercel --prod
   ```

### 자체 호스팅

1. 프로덕션 빌드:
   ```bash
   npm run build
   ```

2. PM2로 실행:
   ```bash
   npm install -g pm2
   pm2 start npm --name "codeb-platform" -- start
   ```

## 🔧 문제 해결

### 일반적인 문제

#### Firebase 연결 오류
```
Error: Failed to get Firebase project
```
**해결방법**:
- Firebase 프로젝트가 활성화되어 있는지 확인
- 환경 변수가 올바르게 설정되어 있는지 확인
- Firebase 콘솔에서 웹 앱이 등록되어 있는지 확인

#### 포트 충돌
```
Error: Port 3000 is already in use
```
**해결방법**:
```bash
# 프로세스 종료
pkill -f "next dev"

# 또는 다른 포트 사용
npm run dev -- -p 3002
```

#### TypeScript 오류
```
Type error: Cannot find module '@/components/...'
```
**해결방법**:
```bash
# TypeScript 캐시 삭제
rm -rf .next
npm run dev
```

### Firebase 관련 문제

#### Authentication 오류
- Firebase Console에서 인증 방법이 활성화되어 있는지 확인
- 도메인이 승인된 도메인 목록에 있는지 확인

#### Database 권한 오류
- 보안 규칙이 올바르게 설정되어 있는지 확인
- 사용자가 로그인되어 있는지 확인

## 📱 모바일 개발 (선택사항)

### Capacitor 설정
```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add ios
npx cap add android
```

### 모바일 빌드
```bash
npm run build
npx cap sync
npx cap open ios  # iOS
npx cap open android  # Android
```

## 🔒 보안 체크리스트

- [ ] 환경 변수가 `.gitignore`에 포함되어 있는지 확인
- [ ] Firebase 보안 규칙이 프로덕션에 적합한지 확인
- [ ] API 키가 도메인으로 제한되어 있는지 확인
- [ ] CORS 설정이 올바른지 확인
- [ ] SSL 인증서가 설치되어 있는지 확인

## 📞 지원

문제가 발생하면:
1. [GitHub Issues](https://github.com/your-username/project_cms/issues) 확인
2. [문서](./README.md) 참조
3. support@codeb.com으로 문의

---

최종 업데이트: 2025-07-08