# 서버 설정 및 실행 가이드

## 개발 환경

### 빠른 시작 (권장)
```bash
# 모든 서비스 한 번에 실행 (Next.js + 백엔드 서버들)
npm run dev:all
```

이 명령어는:
- Next.js 개발 서버 실행
- Socket.IO 서버 실행
- Workflow 서버 실행
- 자동 포트 할당
- 통합 로그 출력

### 개별 실행
```bash
# Next.js만
npm run dev

# 백엔드 서버들만
npm run servers

# 각각 개별 실행
npm run socket-server
npm run workflow-server
```

## 프로덕션 환경

### 1. 환경 설정
```bash
# .env.production 파일 생성
cp .env.production.example .env.production

# 필수 환경 변수 설정
# - DATABASE_URL
# - SENDGRID_API_KEY (이메일)
# - FIREBASE_SERVICE_ACCOUNT_PATH (푸시 알림)
```

### 2. 빌드 및 실행
```bash
# 빌드
npm run build

# PM2로 실행 (권장)
npm run start:all

# PM2 없이 실행
NODE_ENV=production npm run servers
NODE_ENV=production npm start
```

### 3. PM2 관리 명령어
```bash
pm2 status          # 상태 확인
pm2 logs            # 로그 보기
pm2 restart all     # 모두 재시작
pm2 stop all        # 모두 중지
pm2 delete all      # 모두 삭제
pm2 save            # 현재 상태 저장
pm2 startup         # 시스템 시작 시 자동 실행
```

## 포트 설정

### 기본 포트
- Next.js: 3000
- Socket.IO: 3003
- Workflow: 3004

### 포트 자동 할당
서버 매니저가 자동으로:
1. 사용 가능한 포트 탐색
2. `.env.local` 파일 업데이트
3. 서비스 URL 자동 설정

### 수동 포트 설정
```bash
# 환경 변수로 설정
SOCKET_PORT=4000 WORKFLOW_PORT=4001 npm run servers
```

## 서비스 아키텍처

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│    Next.js      │────▶│   Socket.IO     │     │   Workflow      │
│   (Frontend)    │     │    Server       │     │    Server       │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                        │                        │
        │                        │                        │
        └────────────────────────┴────────────────────────┘
                                 │
                          ┌──────▼──────┐
                          │             │
                          │  Firebase   │
                          │  Database   │
                          │             │
                          └─────────────┘
```

## 문제 해결

### 포트 충돌
```bash
# 특정 포트 사용 중인 프로세스 확인
lsof -i :3003

# 프로세스 종료
kill -9 [PID]
```

### 서비스 연결 실패
1. 서비스 상태 확인: `pm2 status` 또는 로그 확인
2. 방화벽 설정 확인
3. 환경 변수 확인: `.env.local` 파일

### 로그 확인
```bash
# 개발 환경 - 터미널에 실시간 출력

# 프로덕션 환경
pm2 logs codeb-nextjs
pm2 logs codeb-socket
pm2 logs codeb-workflow
```

## 성능 최적화

### 클러스터 모드
PM2는 Next.js를 CPU 코어 수만큼 클러스터 모드로 실행합니다.

### 메모리 제한
- Next.js: 1GB
- Socket.IO: 500MB
- Workflow: 500MB

자동 재시작 설정으로 메모리 누수 방지

### 로드 밸런싱
Nginx 설정 예시:
```nginx
upstream nextjs {
    server localhost:3000;
}

upstream socketio {
    ip_hash;
    server localhost:3003;
}

upstream workflow {
    server localhost:3004;
}
```