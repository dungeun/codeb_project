const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getDatabase, ref, get, update } = require('firebase/database');

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyCDh_fwXU_6BTJWmAHh49THWSdW_cvCbCM",
  authDomain: "project-cms-b0d78.firebaseapp.com",
  databaseURL: "https://project-cms-b0d78-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "project-cms-b0d78",
  storageBucket: "project-cms-b0d78.firebasestorage.app",
  messagingSenderId: "739720693388",
  appId: "1:739720693388:web:a462b9bde3480cf9075da9",
  measurementId: "G-30XDCMLF4F"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// 날짜를 특정 범위 내에서 생성하는 헬퍼 함수
function getDateInRange(startDate, endDate, position = 0.5) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const targetTime = start + (end - start) * position;
  return new Date(targetTime).toISOString().split('T')[0];
}

// 프로젝트별 날짜 업데이트 정보
const projectUpdates = {
  'CRM 시스템 구축': {
    startDate: '2025-07-01',
    endDate: '2025-08-15'
  },
  '쇼핑몰 웹사이트 개발': {
    startDate: '2025-07-15',
    endDate: '2025-09-15'
  },
  '모바일 앱 개발': {
    startDate: '2025-07-10',
    endDate: '2025-09-30'
  }
};

async function updateProjectDates() {
  try {
    // 관리자로 로그인
    console.log('Logging in as admin...');
    await signInWithEmailAndPassword(auth, 'admin@codeb.com', 'admin123!');
    console.log('✅ Login successful');
    
    // 현재 프로젝트 데이터 가져오기
    console.log('\nFetching current projects...');
    const projectsRef = ref(database, 'projects');
    const snapshot = await get(projectsRef);
    
    if (!snapshot.exists()) {
      console.log('No projects found');
      return;
    }
    
    const projects = snapshot.val();
    console.log(`Found ${Object.keys(projects).length} projects`);
    
    // 각 프로젝트 업데이트
    for (const [projectId, project] of Object.entries(projects)) {
      const projectName = project.name;
      const updateInfo = projectUpdates[projectName];
      
      if (!updateInfo) {
        console.log(`\nNo update info found for project: ${projectName}`);
        continue;
      }
      
      console.log(`\nUpdating project: ${projectName}`);
      console.log(`  New dates: ${updateInfo.startDate} ~ ${updateInfo.endDate}`);
      
      // 프로젝트 날짜 업데이트
      const projectUpdateData = {
        startDate: updateInfo.startDate,
        endDate: updateInfo.endDate,
        updatedAt: new Date().toISOString()
      };
      
      await update(ref(database, `projects/${projectId}`), projectUpdateData);
      console.log('  ✅ Project dates updated');
      
      // 해당 프로젝트의 작업들 가져오기
      const tasksRef = ref(database, `projects/${projectId}/tasks`);
      const tasksSnapshot = await get(tasksRef);
      
      if (tasksSnapshot.exists()) {
        const tasks = tasksSnapshot.val();
        const taskIds = Object.keys(tasks);
        console.log(`  Found ${taskIds.length} tasks to update`);
        
        // 작업들을 상태별로 분류
        const tasksByStatus = {
          done: [],
          review: [],
          'in-progress': [],
          todo: []
        };
        
        for (const [taskId, task] of Object.entries(tasks)) {
          tasksByStatus[task.status] = tasksByStatus[task.status] || [];
          tasksByStatus[task.status].push({ taskId, task });
        }
        
        // 프로젝트 기간을 4등분하여 각 상태별로 날짜 할당
        const projectStart = new Date(updateInfo.startDate);
        const projectEnd = new Date(updateInfo.endDate);
        const totalDuration = projectEnd.getTime() - projectStart.getTime();
        const quarterDuration = totalDuration / 4;
        
        // 각 상태별 기간 설정
        const statusPeriods = {
          done: {
            start: projectStart,
            end: new Date(projectStart.getTime() + quarterDuration)
          },
          review: {
            start: new Date(projectStart.getTime() + quarterDuration),
            end: new Date(projectStart.getTime() + quarterDuration * 2)
          },
          'in-progress': {
            start: new Date(projectStart.getTime() + quarterDuration * 2),
            end: new Date(projectStart.getTime() + quarterDuration * 3)
          },
          todo: {
            start: new Date(projectStart.getTime() + quarterDuration * 3),
            end: projectEnd
          }
        };
        
        // 각 작업 업데이트
        for (const [status, taskList] of Object.entries(tasksByStatus)) {
          if (taskList.length === 0) continue;
          
          const period = statusPeriods[status];
          const taskCount = taskList.length;
          
          for (let i = 0; i < taskList.length; i++) {
            const { taskId, task } = taskList[i];
            const taskPosition = i / Math.max(taskCount - 1, 1); // 0 ~ 1 사이의 위치
            
            const taskUpdateData = {
              updatedAt: new Date().toISOString()
            };
            
            // 상태에 따라 날짜 설정
            if (status === 'done') {
              // 완료된 작업: startDate와 dueDate 모두 과거
              taskUpdateData.startDate = getDateInRange(
                period.start.toISOString().split('T')[0],
                period.end.toISOString().split('T')[0],
                taskPosition * 0.5
              );
              taskUpdateData.dueDate = getDateInRange(
                period.start.toISOString().split('T')[0],
                period.end.toISOString().split('T')[0],
                0.5 + taskPosition * 0.5
              );
            } else if (status === 'review') {
              // 검토 중: startDate는 과거, dueDate는 가까운 미래
              taskUpdateData.startDate = getDateInRange(
                period.start.toISOString().split('T')[0],
                period.end.toISOString().split('T')[0],
                taskPosition * 0.7
              );
              taskUpdateData.dueDate = getDateInRange(
                period.start.toISOString().split('T')[0],
                period.end.toISOString().split('T')[0],
                0.7 + taskPosition * 0.3
              );
            } else if (status === 'in-progress') {
              // 진행 중: startDate는 최근, dueDate는 가까운 미래
              taskUpdateData.startDate = getDateInRange(
                period.start.toISOString().split('T')[0],
                period.end.toISOString().split('T')[0],
                taskPosition * 0.3
              );
              taskUpdateData.dueDate = getDateInRange(
                period.start.toISOString().split('T')[0],
                period.end.toISOString().split('T')[0],
                0.5 + taskPosition * 0.5
              );
            } else if (status === 'todo') {
              // 할 일: dueDate만 설정 (미래)
              taskUpdateData.dueDate = getDateInRange(
                period.start.toISOString().split('T')[0],
                period.end.toISOString().split('T')[0],
                taskPosition
              );
            }
            
            await update(ref(database, `projects/${projectId}/tasks/${taskId}`), taskUpdateData);
          }
        }
        
        console.log('  ✅ All tasks updated');
      } else {
        console.log('  No tasks found for this project');
      }
    }
    
    console.log('\n🎉 All projects and tasks have been updated successfully!');
    console.log('\nUpdated project periods:');
    for (const [name, dates] of Object.entries(projectUpdates)) {
      console.log(`  ${name}: ${dates.startDate} ~ ${dates.endDate}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating dates:', error);
    process.exit(1);
  }
}

updateProjectDates();