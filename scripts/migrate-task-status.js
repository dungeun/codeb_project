// Task status 마이그레이션 스크립트
// in-progress -> in_progress 변경

const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, update } = require('firebase/database');

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

// 초기화
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function migrateTaskStatus() {
  console.log('Task status 마이그레이션 시작...');
  
  try {
    // 모든 프로젝트 가져오기
    const projectsRef = ref(database, 'projects');
    const projectsSnapshot = await get(projectsRef);
    
    if (!projectsSnapshot.exists()) {
      console.log('프로젝트가 없습니다.');
      return;
    }
    
    const updates = {};
    let taskCount = 0;
    let columnCount = 0;
    
    // 각 프로젝트의 작업들 확인
    projectsSnapshot.forEach((projectSnapshot) => {
      const projectId = projectSnapshot.key;
      const projectData = projectSnapshot.val();
      
      // 칸반 컬럼 업데이트
      if (projectData.kanbanColumns) {
        Object.entries(projectData.kanbanColumns).forEach(([columnId, column]) => {
          if (columnId === 'in-progress') {
            // 컬럼 ID 변경
            updates[`projects/${projectId}/kanbanColumns/in_progress`] = {
              ...column,
              id: 'in_progress'
            };
            updates[`projects/${projectId}/kanbanColumns/in-progress`] = null;
            columnCount++;
          }
        });
      }
      
      // 작업들 업데이트
      if (projectData.tasks) {
        Object.entries(projectData.tasks).forEach(([taskId, task]) => {
          if (task.status === 'in-progress') {
            updates[`projects/${projectId}/tasks/${taskId}/status`] = 'in_progress';
            taskCount++;
          }
          
          if (task.columnId === 'in-progress') {
            updates[`projects/${projectId}/tasks/${taskId}/columnId`] = 'in_progress';
          }
        });
      }
    });
    
    if (Object.keys(updates).length > 0) {
      console.log(`${taskCount}개의 작업과 ${columnCount}개의 컬럼을 업데이트합니다...`);
      await update(ref(database), updates);
      console.log('마이그레이션 완료!');
    } else {
      console.log('업데이트할 항목이 없습니다.');
    }
    
  } catch (error) {
    console.error('마이그레이션 실패:', error);
  }
  
  process.exit(0);
}

// 환경 변수 확인
if (!process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL) {
  console.error('Firebase 환경 변수가 설정되지 않았습니다.');
  console.log('다음 명령어로 실행하세요:');
  console.log('node -r dotenv/config scripts/migrate-task-status.js');
  process.exit(1);
}

migrateTaskStatus();