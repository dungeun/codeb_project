const { spawn } = require('child_process');
const net = require('net');
const path = require('path');
const fs = require('fs');

// 서버 설정
const servers = [
  {
    name: 'Socket.IO Server',
    script: 'socket-server.js',
    defaultPort: 3003,
    envVar: 'SOCKET_PORT'
  },
  {
    name: 'Workflow Server',
    script: 'workflow-server.js',
    defaultPort: 3004,
    envVar: 'WORKFLOW_PORT'
  }
];

// 사용 가능한 포트 찾기
async function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(startPort, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    
    server.on('error', () => {
      // 포트가 사용 중이면 다음 포트 시도
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

// 환경 파일 업데이트
function updateEnvFile(ports) {
  const envPath = path.join(__dirname, '..', '.env.local');
  let envContent = '';
  
  // 기존 .env.local 파일 읽기
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // 포트 정보 업데이트
  const updates = {
    NEXT_PUBLIC_SOCKET_URL: `http://localhost:${ports.SOCKET_PORT}`,
    NEXT_PUBLIC_WORKFLOW_API_URL: `http://localhost:${ports.WORKFLOW_PORT}`
  };
  
  // 환경 변수 업데이트 또는 추가
  Object.entries(updates).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  });
  
  fs.writeFileSync(envPath, envContent.trim() + '\n');
  console.log('✅ 환경 변수가 업데이트되었습니다:', updates);
}

// 서버 실행
async function startServer(serverConfig, port) {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, [serverConfig.envVar]: port };
    const serverPath = path.join(__dirname, serverConfig.script);
    
    console.log(`🚀 ${serverConfig.name} 시작 중... (포트: ${port})`);
    
    const server = spawn('node', [serverPath], {
      env,
      stdio: 'inherit'
    });
    
    server.on('error', (err) => {
      console.error(`❌ ${serverConfig.name} 실행 오류:`, err);
      reject(err);
    });
    
    server.on('close', (code) => {
      if (code !== 0) {
        console.error(`❌ ${serverConfig.name} 종료됨 (코드: ${code})`);
      }
    });
    
    // 서버가 시작되기를 잠시 기다림
    setTimeout(() => resolve(server), 2000);
  });
}

// 메인 실행 함수
async function main() {
  console.log('🔍 사용 가능한 포트 찾는 중...\n');
  
  // 각 서버에 대해 사용 가능한 포트 찾기
  const ports = {};
  for (const server of servers) {
    const availablePort = await findAvailablePort(server.defaultPort);
    ports[server.envVar] = availablePort;
    console.log(`✅ ${server.name}: 포트 ${availablePort} 사용`);
  }
  
  // 환경 파일 업데이트
  console.log('\n📝 환경 변수 업데이트 중...');
  updateEnvFile(ports);
  
  // 모든 서버 시작
  console.log('\n🚀 서버들을 시작합니다...\n');
  const runningServers = [];
  
  for (const server of servers) {
    try {
      const runningServer = await startServer(server, ports[server.envVar]);
      runningServers.push(runningServer);
    } catch (err) {
      console.error(`❌ ${server.name} 시작 실패:`, err);
      // 이미 시작된 서버들 종료
      runningServers.forEach(s => s.kill());
      process.exit(1);
    }
  }
  
  console.log('\n✅ 모든 서버가 성공적으로 시작되었습니다!');
  console.log('\n📌 서버 정보:');
  console.log(`   - Socket.IO Server: http://localhost:${ports.SOCKET_PORT}`);
  console.log(`   - Workflow Server: http://localhost:${ports.WORKFLOW_PORT}`);
  console.log('\n종료하려면 Ctrl+C를 누르세요.\n');
  
  // 프로세스 종료 처리
  process.on('SIGINT', () => {
    console.log('\n\n🛑 서버들을 종료합니다...');
    runningServers.forEach(server => server.kill());
    process.exit(0);
  });
}

// 실행
main().catch((err) => {
  console.error('❌ 서버 매니저 오류:', err);
  process.exit(1);
});