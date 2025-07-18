#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 프로덕션 환경 체크
if (process.env.NODE_ENV !== 'production') {
  console.log('⚠️  프로덕션 모드로 설정합니다...');
  process.env.NODE_ENV = 'production';
}

// .env.production 파일 체크
const envPath = path.join(__dirname, '..', '.env.production');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.production 파일이 없습니다!');
  console.log('💡 .env.production.example을 복사해서 설정해주세요.');
  process.exit(1);
}

// 환경 변수 로드
require('dotenv').config({ path: envPath });

// PM2 설치 확인
function checkPM2() {
  try {
    require.resolve('pm2');
    return true;
  } catch (e) {
    console.error('❌ PM2가 설치되어 있지 않습니다.');
    console.log('💡 다음 명령어로 설치하세요: npm install -g pm2');
    return false;
  }
}

// PM2 ecosystem 파일 생성
function createEcosystem() {
  const ecosystem = {
    apps: [
      {
        name: 'codeb-nextjs',
        script: 'npm',
        args: 'start',
        cwd: path.join(__dirname, '..'),
        env: {
          NODE_ENV: 'production',
          PORT: process.env.PORT || 3000
        },
        instances: 'max',
        exec_mode: 'cluster',
        max_memory_restart: '1G'
      },
      {
        name: 'codeb-socket',
        script: './server/socket-server.js',
        cwd: path.join(__dirname, '..'),
        env: {
          NODE_ENV: 'production',
          SOCKET_PORT: process.env.SOCKET_PORT || 3003
        },
        instances: 1,
        max_memory_restart: '500M'
      },
      {
        name: 'codeb-workflow',
        script: './server/workflow-server.js',
        cwd: path.join(__dirname, '..'),
        env: {
          NODE_ENV: 'production',
          WORKFLOW_PORT: process.env.WORKFLOW_PORT || 3004
        },
        instances: 1,
        max_memory_restart: '500M'
      }
    ]
  };
  
  const ecosystemPath = path.join(__dirname, '..', 'ecosystem.config.js');
  fs.writeFileSync(
    ecosystemPath,
    `module.exports = ${JSON.stringify(ecosystem, null, 2)}`
  );
  
  return ecosystemPath;
}

// 메인 실행
async function main() {
  console.log('🚀 CodeB Platform 프로덕션 시작\n');
  
  // 빌드 확인
  const buildPath = path.join(__dirname, '..', '.next');
  if (!fs.existsSync(buildPath)) {
    console.log('📦 Next.js 빌드가 필요합니다...');
    console.log('실행: npm run build\n');
    
    const build = spawn('npm', ['run', 'build'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    
    await new Promise((resolve, reject) => {
      build.on('close', (code) => {
        if (code === 0) {
          console.log('\n✅ 빌드 완료!\n');
          resolve();
        } else {
          console.error('\n❌ 빌드 실패!');
          reject(new Error('Build failed'));
        }
      });
    });
  }
  
  // PM2로 실행
  if (checkPM2()) {
    console.log('🔧 PM2 ecosystem 설정 중...');
    const ecosystemPath = createEcosystem();
    
    console.log('🚀 PM2로 서비스 시작...\n');
    
    const pm2 = spawn('pm2', ['start', ecosystemPath], {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    
    pm2.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ 모든 서비스가 시작되었습니다!');
        console.log('\n📌 유용한 명령어:');
        console.log('   pm2 status       - 상태 확인');
        console.log('   pm2 logs         - 로그 보기');
        console.log('   pm2 restart all  - 모두 재시작');
        console.log('   pm2 stop all     - 모두 중지');
        console.log('   pm2 delete all   - 모두 삭제\n');
      } else {
        console.error('\n❌ PM2 시작 실패!');
      }
    });
  } else {
    // PM2 없이 실행
    console.log('⚠️  PM2 없이 시작합니다 (프로덕션에는 PM2 사용 권장)\n');
    
    const proc = spawn('node', ['scripts/dev-all.js'], {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, NODE_ENV: 'production' },
      stdio: 'inherit'
    });
    
    process.on('SIGINT', () => {
      proc.kill('SIGTERM');
      process.exit(0);
    });
  }
}

// 실행
main().catch((err) => {
  console.error('❌ 오류:', err.message);
  process.exit(1);
});