import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getDatabase, ref, set, get, update } from 'firebase/database';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 환경변수 로드
dotenv.config({ path: join(__dirname, '..', '.env.local') });

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
const db = getDatabase(app);

async function createCustomerAccount() {
  console.log('🚀 StreamCorp 고객 계정 생성 중...\n');

  try {
    // 고객 계정 생성
    const email = 'customer@streamcorp.com';
    const password = 'streamcorp123!';
    
    console.log('📧 고객 계정 생성 중...');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('✅ 고객 계정 생성 완료:', user.uid);

    // 고객 프로필 생성
    const customerProfile = {
      uid: user.uid,
      email: email,
      displayName: 'StreamCorp 담당자',
      role: 'customer',
      company: 'StreamCorp',
      group: 'streamcorp-group',
      phone: '02-1234-5678',
      avatar: 'https://ui-avatars.com/api/?name=StreamCorp&background=random',
      isOnline: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await set(ref(db, `users/${user.uid}`), customerProfile);
    console.log('✅ 고객 프로필 생성 완료');

    // 프로젝트 찾기 및 업데이트
    console.log('\n📋 프로젝트 연결 중...');
    const projectsSnapshot = await get(ref(db, 'projects'));
    const projects = projectsSnapshot.val();
    
    if (projects) {
      const streamingProjectId = Object.keys(projects).find(
        id => projects[id].name === '라이브 스트리밍 플랫폼 개발'
      );

      if (streamingProjectId) {
        // 프로젝트에 고객 정보 추가
        await update(ref(db, `projects/${streamingProjectId}`), {
          clientId: user.uid,
          clientGroup: 'streamcorp-group',
          clientEmail: email,
          clientCompany: 'StreamCorp'
        });
        console.log('✅ 프로젝트와 고객 계정이 연결되었습니다');

        // 초기 활동 로그 추가
        const activities = [
          {
            title: '프로젝트 킥오프 미팅',
            description: '스트리밍 플랫폼 개발 프로젝트 시작을 위한 킥오프 미팅이 진행되었습니다.',
            type: 'planning',
            projectId: streamingProjectId,
            projectName: '라이브 스트리밍 플랫폼 개발',
            timestamp: new Date().toISOString(),
            createdBy: 'admin'
          },
          {
            title: '요구사항 분석 완료',
            description: '회원가입, 스트리밍, VOD, 관리자 기능 등 전체 요구사항 분석이 완료되었습니다.',
            type: 'planning',
            projectId: streamingProjectId,
            projectName: '라이브 스트리밍 플랫폼 개발',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            createdBy: 'developer1'
          },
          {
            title: '시스템 아키텍처 설계',
            description: 'AWS 기반의 확장 가능한 스트리밍 아키텍처 설계가 진행 중입니다.',
            type: 'development',
            projectId: streamingProjectId,
            projectName: '라이브 스트리밍 플랫폼 개발',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            createdBy: 'devops1'
          }
        ];

        console.log('\n📝 활동 로그 추가 중...');
        for (const activity of activities) {
          const activityRef = ref(db, 'activities');
          await set(ref(db, `activities/${Date.now()}_${Math.random().toString(36).substr(2, 9)}`), activity);
        }
        console.log('✅ 활동 로그가 추가되었습니다');

        // 추가 팀 멤버 계정 생성 (선택사항)
        console.log('\n👥 추가 고객 팀 멤버 생성 중...');
        const additionalMembers = [
          {
            email: 'ceo@streamcorp.com',
            password: 'streamcorp123!',
            displayName: '김대표',
            role: 'customer',
            position: 'CEO'
          },
          {
            email: 'pm@streamcorp.com',
            password: 'streamcorp123!',
            displayName: '이과장',
            role: 'customer',
            position: 'Project Manager'
          }
        ];

        for (const member of additionalMembers) {
          try {
            const memberCredential = await createUserWithEmailAndPassword(auth, member.email, member.password);
            const memberProfile = {
              uid: memberCredential.user.uid,
              email: member.email,
              displayName: member.displayName,
              role: member.role,
              position: member.position,
              company: 'StreamCorp',
              group: 'streamcorp-group',
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(member.displayName)}&background=random`,
              isOnline: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            await set(ref(db, `users/${memberCredential.user.uid}`), memberProfile);
            console.log(`✅ ${member.displayName} (${member.position}) 계정 생성 완료`);
          } catch (error) {
            console.log(`ℹ️ ${member.email} 계정은 이미 존재합니다`);
          }
        }

        console.log('\n✨ StreamCorp 고객 계정 설정이 완료되었습니다!');
        console.log('\n📌 로그인 정보:');
        console.log('   메인 계정: customer@streamcorp.com / streamcorp123!');
        console.log('   CEO 계정: ceo@streamcorp.com / streamcorp123!');
        console.log('   PM 계정: pm@streamcorp.com / streamcorp123!');
        console.log('\n💡 고객 계정으로 로그인하면 /status 페이지에서 프로젝트 진행 상황을 확인할 수 있습니다.');
      } else {
        console.error('❌ 스트리밍 플랫폼 프로젝트를 찾을 수 없습니다.');
      }
    }

  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️ 고객 계정이 이미 존재합니다. 프로젝트 연결만 진행합니다...');
      
      // 기존 계정 찾아서 프로젝트 연결
      const usersSnapshot = await get(ref(db, 'users'));
      const users = usersSnapshot.val();
      const customerUserId = Object.keys(users || {}).find(
        id => users[id].email === 'customer@streamcorp.com'
      );

      if (customerUserId) {
        const projectsSnapshot = await get(ref(db, 'projects'));
        const projects = projectsSnapshot.val();
        const streamingProjectId = Object.keys(projects).find(
          id => projects[id].name === '라이브 스트리밍 플랫폼 개발'
        );

        if (streamingProjectId) {
          await update(ref(db, `projects/${streamingProjectId}`), {
            clientId: customerUserId,
            clientGroup: 'streamcorp-group',
            clientEmail: 'customer@streamcorp.com',
            clientCompany: 'StreamCorp'
          });
          console.log('✅ 프로젝트와 기존 고객 계정이 연결되었습니다');
        }
      }
    } else {
      console.error('❌ 오류 발생:', error);
    }
  }

  process.exit(0);
}

createCustomerAccount();