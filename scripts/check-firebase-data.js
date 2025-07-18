require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');

// Firebase 설정
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function checkFirebaseData() {
  try {
    console.log('Firebase 데이터베이스 확인 중...\n');
    console.log(`Database URL: ${firebaseConfig.databaseURL}\n`);

    // 1. Projects 확인
    console.log('=== PROJECTS 확인 ===');
    const projectsRef = ref(database, 'projects');
    const projectsSnapshot = await get(projectsRef);
    
    if (projectsSnapshot.exists()) {
      const projects = projectsSnapshot.val();
      const projectIds = Object.keys(projects);
      console.log(`총 ${projectIds.length}개의 프로젝트가 있습니다.\n`);
      
      // "라이브 스트리밍 플랫폼 개발" 프로젝트 찾기
      let streamingProject = null;
      let streamingProjectId = null;
      
      for (const [id, project] of Object.entries(projects)) {
        if (project.name === '라이브 스트리밍 플랫폼 개발') {
          streamingProject = project;
          streamingProjectId = id;
          break;
        }
      }
      
      if (streamingProject) {
        console.log('✅ "라이브 스트리밍 플랫폼 개발" 프로젝트를 찾았습니다!');
        console.log(`프로젝트 ID: ${streamingProjectId}`);
        console.log('프로젝트 정보:');
        console.log(`  - 이름: ${streamingProject.name}`);
        console.log(`  - 클라이언트 ID: ${streamingProject.clientId || '❌ 없음'}`);
        console.log(`  - 클라이언트 그룹: ${streamingProject.clientGroup || '❌ 없음'}`);
        console.log(`  - 상태: ${streamingProject.status}`);
        console.log(`  - 생성일: ${new Date(streamingProject.createdAt).toLocaleString()}`);
        
        if (streamingProject.client) {
          console.log('  - 클라이언트 정보:');
          console.log(`    - 이름: ${streamingProject.client.name || '없음'}`);
          console.log(`    - 이메일: ${streamingProject.client.email || '없음'}`);
        }
      } else {
        console.log('❌ "라이브 스트리밍 플랫폼 개발" 프로젝트를 찾을 수 없습니다.');
        console.log('\n현재 있는 프로젝트 목록:');
        for (const [id, project] of Object.entries(projects)) {
          console.log(`  - ${project.name} (ID: ${id})`);
        }
      }
    } else {
      console.log('❌ projects 컬렉션이 비어있습니다.');
    }
    
    // 2. Users 확인
    console.log('\n\n=== USERS 확인 ===');
    const usersRef = ref(database, 'users');
    const usersSnapshot = await get(usersRef);
    
    if (usersSnapshot.exists()) {
      const users = usersSnapshot.val();
      const userIds = Object.keys(users);
      console.log(`총 ${userIds.length}명의 사용자가 있습니다.\n`);
      
      // customer@streamcorp.com 사용자 찾기
      let customerUser = null;
      let customerUserId = null;
      
      for (const [id, user] of Object.entries(users)) {
        if (user.email === 'customer@streamcorp.com') {
          customerUser = user;
          customerUserId = id;
          break;
        }
      }
      
      if (customerUser) {
        console.log('✅ customer@streamcorp.com 사용자를 찾았습니다!');
        console.log(`사용자 ID: ${customerUserId}`);
        console.log('사용자 정보:');
        console.log(`  - 이메일: ${customerUser.email}`);
        console.log(`  - 이름: ${customerUser.name || '없음'}`);
        console.log(`  - 역할: ${customerUser.role}`);
        console.log(`  - 그룹: ${customerUser.group || '없음'}`);
        console.log(`  - 회사: ${customerUser.company || '없음'}`);
        console.log(`  - 생성일: ${new Date(customerUser.createdAt).toLocaleString()}`);
      } else {
        console.log('❌ customer@streamcorp.com 사용자를 찾을 수 없습니다.');
        console.log('\n현재 있는 사용자 목록:');
        for (const [id, user] of Object.entries(users)) {
          console.log(`  - ${user.email} (역할: ${user.role})`);
        }
      }
    } else {
      console.log('❌ users 컬렉션이 비어있습니다.');
    }

    // 3. 클라이언트 그룹 확인
    console.log('\n\n=== CLIENT GROUPS 확인 ===');
    const clientGroupsRef = ref(database, 'clientGroups');
    const clientGroupsSnapshot = await get(clientGroupsRef);
    
    if (clientGroupsSnapshot.exists()) {
      const clientGroups = clientGroupsSnapshot.val();
      console.log('클라이언트 그룹 목록:');
      for (const [id, group] of Object.entries(clientGroups)) {
        console.log(`  - ${group.name} (ID: ${id})`);
        if (group.members) {
          console.log(`    멤버 수: ${Object.keys(group.members).length}`);
        }
      }
    } else {
      console.log('❌ clientGroups 컬렉션이 비어있거나 존재하지 않습니다.');
    }

  } catch (error) {
    console.error('Firebase 데이터 확인 중 오류 발생:', error);
    console.error('\n환경 변수를 확인해주세요:');
    console.error('- NEXT_PUBLIC_FIREBASE_DATABASE_URL이 올바른지 확인');
    console.error('- .env 파일이 제대로 설정되어 있는지 확인');
  }
}

// 스크립트 실행
checkFirebaseData().then(() => {
  console.log('\n✅ Firebase 데이터 확인 완료');
  process.exit(0);
}).catch((error) => {
  console.error('스크립트 실행 중 오류:', error);
  process.exit(1);
});