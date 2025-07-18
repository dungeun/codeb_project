#!/usr/bin/env node

const { spawn } = require('child_process');
const readline = require('readline');
const path = require('path');

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// 프로세스 설정
const processes = [
  {
    name: 'Next.js',
    command: 'npm',
    args: ['run', 'dev'],
    color: colors.cyan,
    ready: 'ready on'
  },
  {
    name: 'Servers',
    command: 'npm',
    args: ['run', 'servers'],
    color: colors.green,
    ready: '모든 서버가 성공적으로 시작되었습니다'
  }
];

// 실행 중인 프로세스들
const runningProcesses = [];

// 로그 출력 함수
function log(processName, color, message) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors.dim}[${timestamp}]${colors.reset} ${color}[${processName}]${colors.reset} ${message}`);
}

// 프로세스 시작 함수
function startProcess(config) {
  log('Manager', colors.yellow, `${config.name} 시작 중...`);
  
  const proc = spawn(config.command, config.args, {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env }
  });
  
  // stdout 처리
  const rl = readline.createInterface({
    input: proc.stdout,
    crlfDelay: Infinity
  });
  
  rl.on('line', (line) => {
    log(config.name, config.color, line);
    
    // 준비 상태 확인
    if (config.ready && line.includes(config.ready)) {
      log('Manager', colors.green, `✅ ${config.name} 준비 완료!`);
    }
  });
  
  // stderr 처리
  const rlErr = readline.createInterface({
    input: proc.stderr,
    crlfDelay: Infinity
  });
  
  rlErr.on('line', (line) => {
    log(config.name, colors.red, line);
  });
  
  // 프로세스 종료 처리
  proc.on('close', (code) => {
    log('Manager', colors.red, `${config.name} 종료됨 (코드: ${code})`);
    
    // 하나가 종료되면 모두 종료
    if (code !== 0) {
      shutdown();
    }
  });
  
  proc.on('error', (err) => {
    log('Manager', colors.red, `${config.name} 오류: ${err.message}`);
  });
  
  runningProcesses.push({ ...config, process: proc });
}

// 종료 함수
function shutdown() {
  log('Manager', colors.yellow, '모든 프로세스를 종료합니다...');
  
  runningProcesses.forEach(({ name, process }) => {
    if (process && !process.killed) {
      log('Manager', colors.yellow, `${name} 종료 중...`);
      process.kill('SIGTERM');
    }
  });
  
  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

// 시작
async function main() {
  console.clear();
  console.log(`${colors.bright}${colors.blue}🚀 CodeB Platform 개발 환경 시작${colors.reset}\n`);
  
  // 모든 프로세스 시작
  for (const config of processes) {
    startProcess(config);
    // 각 프로세스 시작 사이에 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`\n${colors.bright}${colors.green}✨ 모든 서비스가 시작되었습니다!${colors.reset}`);
  console.log(`\n${colors.dim}종료하려면 Ctrl+C를 누르세요.${colors.reset}\n`);
  
  // 프로세스 종료 신호 처리
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// 실행
main().catch((err) => {
  console.error(`${colors.red}오류:${colors.reset}`, err);
  shutdown();
});