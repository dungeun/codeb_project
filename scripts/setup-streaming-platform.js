const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Firebase Admin 초기화
// 실제 환경에서는 서비스 계정 키가 필요하지만, 
// 개발 환경에서는 클라이언트 키를 사용하여 초기화
if (!admin.apps.length) {
  // 환경변수 확인
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    console.error('❌ Firebase 환경변수가 설정되지 않았습니다.');
    console.error('💡 .env.local 파일에 다음 변수들을 설정하세요:');
    console.error('   - NEXT_PUBLIC_FIREBASE_PROJECT_ID');
    console.error('   - NEXT_PUBLIC_FIREBASE_DATABASE_URL');
    process.exit(1);
  }

  // 개발 환경용 설정
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  });
}

const db = admin.database();

async function clearExistingData() {
  console.log('🗑️  기존 데이터 삭제 중...');
  
  try {
    // 모든 컬렉션 삭제
    await db.ref('/').remove();
    console.log('✅ 모든 데이터가 삭제되었습니다.');
  } catch (error) {
    console.error('❌ 데이터 삭제 중 오류:', error);
  }
}

async function createStreamingPlatformProject() {
  console.log('\n🚀 스트리밍 플랫폼 프로젝트 생성 중...');

  // 프로젝트 생성
  const projectData = {
    name: '라이브 스트리밍 플랫폼 개발',
    description: '실시간 방송 및 VOD 서비스를 제공하는 종합 스트리밍 플랫폼',
    status: 'in_progress',
    priority: 'high',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 6개월 후
    progress: 5,
    team: ['admin'],
    budget: 150000000, // 1.5억
    budgetUsed: 0,
    client: 'StreamCorp',
    tags: ['streaming', 'platform', 'live', 'vod'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const projectRef = await db.ref('projects').push(projectData);
  const projectId = projectRef.key;
  console.log('✅ 프로젝트 생성 완료:', projectId);

  // 작업 카테고리별 태스크 생성
  const tasks = [];

  // 1. 사용자 기능 (1.1 계정 관리)
  tasks.push({
    title: '회원가입 시스템 구현',
    description: '이메일 인증, SNS(구글/네이버/카카오) 연동, 스트림 키 자동 생성',
    projectId,
    status: 'pending',
    priority: 'high',
    category: 'feature',
    assignee: 'developer1',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['auth', 'user', 'signup'],
    subtasks: [
      '이메일 가입 및 인증 시스템',
      'OAuth 2.0 SNS 로그인 구현',
      '스트림 키 생성 알고리즘'
    ]
  });

  tasks.push({
    title: '로그인 및 계정 복구 기능',
    description: 'ID/PW 로그인, 계정 찾기, 비밀번호 재설정',
    projectId,
    status: 'pending',
    priority: 'high',
    category: 'feature',
    assignee: 'developer1',
    dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['auth', 'login', 'recovery']
  });

  tasks.push({
    title: '계정 설정 페이지 개발',
    description: '프로필 관리, 보안 설정, 알림 설정, 구독/팔로우 관리, 시청 내역, 결제 관리',
    projectId,
    status: 'pending',
    priority: 'medium',
    category: 'feature',
    assignee: 'developer2',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['profile', 'settings', 'user']
  });

  // 1.2 스튜디오 (방송자 기능)
  tasks.push({
    title: '방송 스튜디오 - 송출 시스템',
    description: 'OBS 연동, 스트림 키 입력, 품질 조정(해상도/프레임/비트레이트)',
    projectId,
    status: 'pending',
    priority: 'high',
    category: 'feature',
    assignee: 'developer3',
    dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['streaming', 'studio', 'broadcast'],
    subtasks: [
      'RTMP 서버 구축',
      'OBS 스트림 키 연동',
      '적응형 비트레이트 스트리밍'
    ]
  });

  tasks.push({
    title: '방송 관리 인터페이스',
    description: '방송 제목/카테고리/태그 설정, 녹화 기능, 후원 알림, 채팅 관리',
    projectId,
    status: 'pending',
    priority: 'high',
    category: 'feature',
    assignee: 'developer3',
    dueDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['streaming', 'management', 'ui']
  });

  tasks.push({
    title: 'VOD 관리 시스템',
    description: '영상 업로드, 메타데이터 설정, 업로드 예약, 공개 설정, 간단한 편집',
    projectId,
    status: 'pending',
    priority: 'medium',
    category: 'feature',
    assignee: 'developer4',
    dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['vod', 'upload', 'video'],
    subtasks: [
      '대용량 파일 업로드 시스템',
      '비디오 트랜스코딩 파이프라인',
      '썸네일 자동 생성',
      '기본 편집 도구 (Cut, 모자이크)'
    ]
  });

  // 1.3 시청자 기능
  tasks.push({
    title: '실시간 스트리밍 플레이어',
    description: 'HLS/DASH 플레이어, 화질 선택(480p/720p/1080p), 전체화면 모드',
    projectId,
    status: 'pending',
    priority: 'high',
    category: 'feature',
    assignee: 'developer5',
    dueDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['player', 'streaming', 'viewer']
  });

  tasks.push({
    title: '실시간 채팅 시스템',
    description: 'WebSocket 기반 실시간 채팅, 이모티콘, 금칙어 필터링',
    projectId,
    status: 'pending',
    priority: 'high',
    category: 'feature',
    assignee: 'developer2',
    dueDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['chat', 'realtime', 'websocket']
  });

  tasks.push({
    title: '후원 및 구독 시스템',
    description: '실시간 후원, 월간 구독, 팔로우 기능, 결제 연동',
    projectId,
    status: 'pending',
    priority: 'high',
    category: 'feature',
    assignee: 'developer6',
    dueDate: new Date(Date.now() + 55 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['payment', 'subscription', 'donation'],
    subtasks: [
      'PG사 연동 (카드/카카오페이/토스)',
      '구독 갱신 자동화',
      '후원 알림 애니메이션'
    ]
  });

  // 1.4 콘텐츠 탐색
  tasks.push({
    title: '카테고리 시스템 구현',
    description: '라이브/VOD 카테고리 분류 (부동산, 요가, 필라테스, 골프, 낚시, 교육 등)',
    projectId,
    status: 'pending',
    priority: 'medium',
    category: 'feature',
    assignee: 'developer1',
    dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['category', 'taxonomy', 'navigation']
  });

  tasks.push({
    title: '통합 검색 엔진',
    description: 'Elasticsearch 기반 통합 검색, 채널/라이브/VOD 분류',
    projectId,
    status: 'pending',
    priority: 'medium',
    category: 'feature',
    assignee: 'developer4',
    dueDate: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['search', 'elasticsearch', 'discovery']
  });

  // 2. 관리자 기능
  tasks.push({
    title: '관리자 대시보드',
    description: '실시간 통계, 유저 현황, 방송 현황, 수익 분석',
    projectId,
    status: 'pending',
    priority: 'high',
    category: 'admin',
    assignee: 'developer7',
    dueDate: new Date(Date.now() + 65 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['admin', 'dashboard', 'analytics']
  });

  tasks.push({
    title: '유저 관리 시스템',
    description: '유저 조회, 제재 기능(정지/채팅금지/방송금지), 제재 관리',
    projectId,
    status: 'pending',
    priority: 'high',
    category: 'admin',
    assignee: 'developer7',
    dueDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['admin', 'user-management', 'moderation']
  });

  tasks.push({
    title: '수익 관리 및 정산 시스템',
    description: '채널별 수익 분석, 구독/후원/VOD/광고 수익 관리, 정산 자동화',
    projectId,
    status: 'pending',
    priority: 'high',
    category: 'admin',
    assignee: 'developer6',
    dueDate: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['revenue', 'settlement', 'finance']
  });

  tasks.push({
    title: '고객지원 시스템',
    description: '1:1 문의, 신고 관리, 공지사항, FAQ 관리',
    projectId,
    status: 'pending',
    priority: 'medium',
    category: 'admin',
    assignee: 'developer8',
    dueDate: new Date(Date.now() + 85 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['support', 'cs', 'help']
  });

  // 3. 기술 인프라
  tasks.push({
    title: 'CDN 및 미디어 서버 구축',
    description: 'CloudFront CDN 설정, Wowza/Nginx RTMP 서버, HLS 변환',
    projectId,
    status: 'pending',
    priority: 'high',
    category: 'infrastructure',
    assignee: 'devops1',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['cdn', 'streaming', 'infrastructure']
  });

  tasks.push({
    title: '확장 가능한 아키텍처 설계',
    description: 'Kubernetes 기반 오토스케일링, 로드밸런싱, 마이크로서비스',
    projectId,
    status: 'pending',
    priority: 'high',
    category: 'infrastructure',
    assignee: 'devops1',
    dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['architecture', 'scalability', 'kubernetes']
  });

  tasks.push({
    title: '보안 시스템 구현',
    description: 'DRM 적용, 콘텐츠 암호화, 불법 복제 방지, WAF 설정',
    projectId,
    status: 'pending',
    priority: 'high',
    category: 'security',
    assignee: 'security1',
    dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['security', 'drm', 'encryption']
  });

  tasks.push({
    title: '모니터링 및 로깅 시스템',
    description: 'ELK Stack 구축, 실시간 모니터링, 에러 추적, 성능 분석',
    projectId,
    status: 'pending',
    priority: 'medium',
    category: 'infrastructure',
    assignee: 'devops2',
    dueDate: new Date(Date.now() + 95 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['monitoring', 'logging', 'observability']
  });

  // 4. 모바일 및 전용 프로그램
  tasks.push({
    title: '반응형 웹 UI/UX 개발',
    description: '모바일 최적화, 터치 인터페이스, PWA 지원',
    projectId,
    status: 'pending',
    priority: 'high',
    category: 'frontend',
    assignee: 'frontend1',
    dueDate: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['mobile', 'responsive', 'pwa']
  });

  tasks.push({
    title: '고화질 시청 전용 프로그램',
    description: '1080p+ 지원 데스크톱 앱, 하드웨어 가속, 저지연 모드',
    projectId,
    status: 'pending',
    priority: 'medium',
    category: 'desktop',
    assignee: 'desktop1',
    dueDate: new Date(Date.now() + 110 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['desktop', 'app', 'high-quality']
  });

  // 작업 생성
  console.log('\n📝 작업 등록 중...');
  for (const task of tasks) {
    const taskData = {
      ...task,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin',
      completedAt: null,
      attachments: [],
      comments: []
    };
    await db.ref('tasks').push(taskData);
  }
  console.log(`✅ ${tasks.length}개의 작업이 등록되었습니다.`);

  // 팀 멤버 생성
  const teamMembers = [
    { id: 'developer1', name: '김개발', role: 'Frontend Developer', expertise: ['React', 'Auth'] },
    { id: 'developer2', name: '이백엔드', role: 'Backend Developer', expertise: ['Node.js', 'WebSocket'] },
    { id: 'developer3', name: '박스트림', role: 'Streaming Engineer', expertise: ['RTMP', 'HLS'] },
    { id: 'developer4', name: '최비디오', role: 'Video Engineer', expertise: ['FFmpeg', 'Transcoding'] },
    { id: 'developer5', name: '정플레이어', role: 'Player Developer', expertise: ['Video.js', 'HLS.js'] },
    { id: 'developer6', name: '강결제', role: 'Payment Developer', expertise: ['PG Integration', 'Billing'] },
    { id: 'developer7', name: '조관리', role: 'Admin Developer', expertise: ['Admin Panel', 'Analytics'] },
    { id: 'developer8', name: '송지원', role: 'Support Developer', expertise: ['CS Tools', 'Ticketing'] },
    { id: 'devops1', name: '윤데브옵스', role: 'DevOps Engineer', expertise: ['AWS', 'Kubernetes'] },
    { id: 'devops2', name: '한모니터', role: 'SRE', expertise: ['Monitoring', 'ELK'] },
    { id: 'security1', name: '임보안', role: 'Security Engineer', expertise: ['DRM', 'Encryption'] },
    { id: 'frontend1', name: '신프론트', role: 'Frontend Developer', expertise: ['Mobile', 'PWA'] },
    { id: 'desktop1', name: '탁데스크', role: 'Desktop Developer', expertise: ['Electron', 'C++'] }
  ];

  console.log('\n👥 팀 멤버 등록 중...');
  for (const member of teamMembers) {
    await db.ref(`users/${member.id}`).set({
      ...member,
      email: `${member.id}@streamcorp.com`,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`,
      isOnline: false,
      createdAt: new Date().toISOString()
    });
  }
  console.log(`✅ ${teamMembers.length}명의 팀 멤버가 등록되었습니다.`);

  // 마일스톤 생성
  const milestones = [
    {
      name: '알파 버전 (기본 스트리밍)',
      description: '기본 방송 송출 및 시청 기능',
      dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending'
    },
    {
      name: '베타 버전 (전체 기능)',
      description: '모든 주요 기능 구현 완료',
      dueDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending'
    },
    {
      name: '정식 출시',
      description: '안정화 및 최적화 완료',
      dueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending'
    }
  ];

  console.log('\n🎯 마일스톤 등록 중...');
  for (const milestone of milestones) {
    await db.ref(`projects/${projectId}/milestones`).push({
      ...milestone,
      createdAt: new Date().toISOString()
    });
  }
  console.log(`✅ ${milestones.length}개의 마일스톤이 등록되었습니다.`);

  return projectId;
}

async function main() {
  try {
    console.log('🚀 스트리밍 플랫폼 프로젝트 설정 시작...\n');
    
    // 1. 기존 데이터 삭제
    await clearExistingData();
    
    // 2. 스트리밍 플랫폼 프로젝트 생성
    const projectId = await createStreamingPlatformProject();
    
    console.log('\n✨ 스트리밍 플랫폼 프로젝트 설정이 완료되었습니다!');
    console.log(`📋 프로젝트 ID: ${projectId}`);
    console.log('\n다음 단계:');
    console.log('1. 개발 서버 시작: npm run dev');
    console.log('2. 대시보드에서 프로젝트 확인');
    console.log('3. 작업 할당 및 진행 상황 추적');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

main();