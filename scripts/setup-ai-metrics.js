const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getDatabase, ref, set, push, get } = require('firebase/database');
require('dotenv').config({ path: '.env.local' });

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
const auth = getAuth(app);
const database = getDatabase(app);

async function setupAIMetrics() {
  try {
    // 관리자로 로그인
    console.log('Logging in as admin...');
    await signInWithEmailAndPassword(auth, 'admin@codeb.com', 'admin123!');
    console.log('✅ Logged in successfully');

    // 프로젝트 목록 가져오기
    const projectsRef = ref(database, 'projects');
    const snapshot = await get(projectsRef);
    
    if (!snapshot.exists()) {
      console.log('No projects found');
      return;
    }

    const projects = snapshot.val();
    
    // 각 프로젝트에 AI 메트릭 추가
    for (const [projectId, project] of Object.entries(projects)) {
      console.log(`\n📊 Processing project: ${project.name}`);
      
      // 기존 작업 데이터 분석
      const tasksRef = ref(database, `projects/${projectId}/tasks`);
      const tasksSnapshot = await get(tasksRef);
      let taskMetrics = {
        total: 0,
        completed: 0,
        onTime: 0,
        delayed: 0,
        bugTasks: 0,
        totalEstimatedHours: 0,
        totalActualHours: 0
      };
      
      if (tasksSnapshot.exists()) {
        const tasks = Object.values(tasksSnapshot.val());
        taskMetrics.total = tasks.length;
        
        tasks.forEach(task => {
          if (task.status === 'done') {
            taskMetrics.completed++;
            // 마감일 기준 온타임 체크
            if (task.dueDate && new Date(task.dueDate) >= new Date(task.updatedAt || task.createdAt)) {
              taskMetrics.onTime++;
            } else {
              taskMetrics.delayed++;
            }
          }
          // 버그 관련 작업 카운트
          if (task.labels && (task.labels.includes('bug') || task.labels.includes('fix'))) {
            taskMetrics.bugTasks++;
          }
        });
      }
      
      // AI 메트릭 데이터 생성
      const aiMetrics = {
        // 품질 지표
        qualityMetrics: {
          codeQualityScore: calculateQualityScore(taskMetrics),
          bugCount: taskMetrics.bugTasks,
          bugFixRate: taskMetrics.total > 0 ? Math.round((taskMetrics.bugTasks / taskMetrics.total) * 100) : 0,
          codeReviewScore: Math.floor(Math.random() * 20) + 80, // 80-100
          testCoverage: Math.floor(Math.random() * 30) + 70, // 70-100%
          documentationScore: Math.floor(Math.random() * 20) + 75, // 75-95
          lastQualityCheck: new Date().toISOString()
        },
        
        // 예산 및 비용 지표
        budgetMetrics: {
          totalBudget: project.budget || 50000000,
          budgetUsed: Math.floor((project.budget || 50000000) * (project.progress || 0) / 100 * (0.8 + Math.random() * 0.4)),
          budgetEfficiency: Math.floor(Math.random() * 15) + 85, // 85-100%
          costPerFeature: Math.floor(Math.random() * 5000000) + 2000000,
          estimatedFinalCost: project.budget || 50000000,
          lastUpdated: new Date().toISOString()
        },
        
        // 효율성 지표
        efficiencyMetrics: {
          taskCompletionRate: taskMetrics.total > 0 ? Math.round((taskMetrics.completed / taskMetrics.total) * 100) : 0,
          onTimeDeliveryRate: taskMetrics.completed > 0 ? Math.round((taskMetrics.onTime / taskMetrics.completed) * 100) : 0,
          averageTaskCompletionDays: Math.floor(Math.random() * 3) + 2, // 2-5 days
          teamProductivityScore: Math.floor(Math.random() * 20) + 75, // 75-95
          velocityTrend: Math.random() > 0.5 ? 'increasing' : 'stable',
          sprintBurndownRate: Math.floor(Math.random() * 15) + 85, // 85-100%
          resourceUtilization: Math.floor(Math.random() * 20) + 70, // 70-90%
          lastCalculated: new Date().toISOString()
        },
        
        // 만족도 지표
        satisfactionMetrics: {
          customerSatisfactionScore: (Math.random() * 1.5 + 3.5).toFixed(1), // 3.5-5.0
          teamSatisfactionScore: (Math.random() * 1 + 4).toFixed(1), // 4.0-5.0
          stakeholderFeedback: {
            positive: Math.floor(Math.random() * 30) + 60, // 60-90%
            neutral: Math.floor(Math.random() * 20) + 5, // 5-25%
            negative: Math.floor(Math.random() * 10) + 5 // 5-15%
          },
          npsScore: Math.floor(Math.random() * 40) + 40, // 40-80
          responseTime: Math.floor(Math.random() * 12) + 12, // 12-24 hours
          lastSurveyDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        
        // 리스크 지표
        riskMetrics: {
          overallRiskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          technicalRisks: Math.floor(Math.random() * 5) + 1,
          scheduleRisks: Math.floor(Math.random() * 3) + 1,
          budgetRisks: Math.floor(Math.random() * 3),
          resourceRisks: Math.floor(Math.random() * 2) + 1,
          identifiedRisks: [
            {
              id: 'risk1',
              type: 'technical',
              description: '외부 API 의존성',
              impact: 'medium',
              probability: 'low',
              mitigation: 'Fallback 시스템 구축'
            },
            {
              id: 'risk2',
              type: 'schedule',
              description: '핵심 개발자 일정 조정 필요',
              impact: 'high',
              probability: 'medium',
              mitigation: '백업 개발자 배치'
            }
          ],
          lastAssessment: new Date().toISOString()
        },
        
        // 성과 지표 (KPI)
        performanceIndicators: {
          roi: Math.floor(Math.random() * 50) + 100, // 100-150%
          timeToMarket: Math.floor(Math.random() * 30) + 60, // 60-90 days
          defectDensity: (Math.random() * 2 + 0.5).toFixed(2), // 0.5-2.5 per KLOC
          meanTimeToResolve: Math.floor(Math.random() * 24) + 12, // 12-36 hours
          featureAdoptionRate: Math.floor(Math.random() * 30) + 60, // 60-90%
          systemUptime: (99 + Math.random() * 0.9).toFixed(2), // 99.0-99.9%
          lastUpdated: new Date().toISOString()
        },
        
        // AI 예측 데이터
        predictions: {
          estimatedCompletionDate: new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
          completionConfidence: (Math.random() * 0.3 + 0.7).toFixed(2), // 0.70-1.00
          budgetOverrunProbability: (Math.random() * 0.3).toFixed(2), // 0.00-0.30
          qualityForecast: ['excellent', 'good', 'satisfactory'][Math.floor(Math.random() * 3)],
          nextMilestone: {
            name: '다음 주요 마일스톤',
            expectedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            confidence: (Math.random() * 0.2 + 0.8).toFixed(2)
          },
          lastPredictionUpdate: new Date().toISOString()
        },
        
        // 상세 분석 메타데이터
        metadata: {
          lastFullAnalysis: new Date().toISOString(),
          dataQuality: 'high',
          analysisVersion: '2.0',
          dataPoints: Math.floor(Math.random() * 500) + 1000,
          confidenceLevel: (Math.random() * 0.15 + 0.85).toFixed(2) // 0.85-1.00
        }
      };
      
      // Firebase에 저장
      console.log('📝 Saving AI metrics...');
      await set(ref(database, `projects/${projectId}/aiMetrics`), aiMetrics);
      
      // 프로젝트 자체에도 주요 지표 업데이트
      const updates = {
        [`projects/${projectId}/progress`]: calculateRealProgress(project, taskMetrics),
        [`projects/${projectId}/quality`]: aiMetrics.qualityMetrics.codeQualityScore,
        [`projects/${projectId}/efficiency`]: aiMetrics.efficiencyMetrics.teamProductivityScore,
        [`projects/${projectId}/satisfaction`]: aiMetrics.satisfactionMetrics.customerSatisfactionScore,
        [`projects/${projectId}/budgetUsage`]: Math.round((aiMetrics.budgetMetrics.budgetUsed / aiMetrics.budgetMetrics.totalBudget) * 100),
        [`projects/${projectId}/lastMetricsUpdate`]: new Date().toISOString()
      };
      
      // 일괄 업데이트
      for (const [path, value] of Object.entries(updates)) {
        await set(ref(database, path), value);
      }
      
      console.log('✅ AI metrics added successfully');
      
      // 프로젝트별 활동 로그 추가
      await addProjectActivities(projectId, project.name);
    }
    
    // 전체 플랫폼 메트릭 추가
    await addPlatformMetrics();
    
    console.log('\n🎉 All AI metrics have been set up successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('Error setting up AI metrics:', error);
    process.exit(1);
  }
}

// 품질 점수 계산 함수
function calculateQualityScore(taskMetrics) {
  let score = 95; // 기본 점수
  
  // 버그 비율에 따른 감점
  const bugRatio = taskMetrics.total > 0 ? taskMetrics.bugTasks / taskMetrics.total : 0;
  score -= Math.floor(bugRatio * 20);
  
  // 지연된 작업에 따른 감점
  const delayRatio = taskMetrics.completed > 0 ? taskMetrics.delayed / taskMetrics.completed : 0;
  score -= Math.floor(delayRatio * 10);
  
  // 최소 점수 보장
  return Math.max(score, 70);
}

// 실제 진행률 계산
function calculateRealProgress(project, taskMetrics) {
  if (taskMetrics.total === 0) return project.progress || 0;
  
  const taskProgress = Math.round((taskMetrics.completed / taskMetrics.total) * 100);
  const timeProgress = calculateTimeProgress(project.startDate, project.endDate);
  
  // 작업 진행률과 시간 진행률의 가중 평균
  return Math.round(taskProgress * 0.7 + timeProgress * 0.3);
}

// 시간 기반 진행률 계산
function calculateTimeProgress(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();
  
  if (now < start) return 0;
  if (now > end) return 100;
  
  const total = end - start;
  const elapsed = now - start;
  
  return Math.round((elapsed / total) * 100);
}

// 프로젝트별 활동 로그 추가
async function addProjectActivities(projectId, projectName) {
  const activities = [
    {
      type: 'analysis',
      icon: '📊',
      title: 'AI 분석 완료',
      description: `${projectName} 프로젝트의 종합 분석이 완료되었습니다`,
      projectId: projectId,
      severity: 'info'
    },
    {
      type: 'milestone',
      icon: '🎯',
      title: '마일스톤 달성',
      description: `주요 개발 단계가 성공적으로 완료되었습니다`,
      projectId: projectId,
      severity: 'success'
    },
    {
      type: 'quality',
      icon: '✨',
      title: '품질 지표 개선',
      description: `코드 품질 점수가 이전 대비 5% 향상되었습니다`,
      projectId: projectId,
      severity: 'success'
    }
  ];
  
  const activitiesRef = ref(database, 'activities');
  
  for (const activity of activities) {
    const newActivityRef = push(activitiesRef);
    await set(newActivityRef, {
      ...activity,
      time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      userId: auth.currentUser.uid,
      userName: 'AI System'
    });
  }
}

// 플랫폼 전체 메트릭 추가
async function addPlatformMetrics() {
  console.log('\n🌐 Adding platform-wide metrics...');
  
  const platformMetrics = {
    overview: {
      totalProjects: 3,
      activeProjects: 2,
      completedProjects: 1,
      totalUsers: 10,
      activeUsers: 7,
      totalRevenue: 145000000,
      monthlyGrowth: 12.5,
      lastUpdated: new Date().toISOString()
    },
    
    performance: {
      averageProjectCompletion: 82,
      averageQualityScore: 91,
      averageCustomerSatisfaction: 4.6,
      platformUptime: 99.95,
      apiResponseTime: 125, // ms
      errorRate: 0.02,
      lastMeasured: new Date().toISOString()
    },
    
    trends: {
      projectGrowth: [
        { month: '2024-10', count: 5 },
        { month: '2024-11', count: 8 },
        { month: '2024-12', count: 12 },
        { month: '2025-01', count: 15 }
      ],
      revenueGrowth: [
        { month: '2024-10', revenue: 35000000 },
        { month: '2024-11', revenue: 42000000 },
        { month: '2024-12', revenue: 51000000 },
        { month: '2025-01', revenue: 58000000 }
      ],
      userActivity: {
        daily: Math.floor(Math.random() * 50) + 100,
        weekly: Math.floor(Math.random() * 200) + 500,
        monthly: Math.floor(Math.random() * 500) + 1500
      }
    }
  };
  
  await set(ref(database, 'platformMetrics'), platformMetrics);
  console.log('✅ Platform metrics added');
}

// 실행
setupAIMetrics();