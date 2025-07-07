const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, updateProfile } = require('firebase/auth');
const { getDatabase, ref, set } = require('firebase/database');

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyAo8hGzsTyEvzcrlTmTJ-0QY-SkNwfqkiQ",
  authDomain: "codeb-web.firebaseapp.com",
  databaseURL: "https://codeb-web-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "codeb-web",
  storageBucket: "codeb-web.firebasestorage.app",
  messagingSenderId: "466707927630",
  appId: "1:466707927630:web:2820b1d1b210f7dd49691f"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

async function createAdminUser() {
  try {
    // 1. 관리자 계정 생성
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      'admin@codeb.com',
      'admin123!'
    );

    const user = userCredential.user;
    console.log('✅ 관리자 계정 생성됨:', user.uid);

    // 2. 프로필 업데이트
    await updateProfile(user, {
      displayName: '관리자'
    });

    // 3. 데이터베이스에 관리자 정보 저장
    const adminProfile = {
      uid: user.uid,
      email: 'admin@codeb.com',
      displayName: '관리자',
      role: 'admin',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      isOnline: false,
      status: 'available',
      maxChats: 5
    };

    await set(ref(database, `users/${user.uid}`), adminProfile);
    console.log('✅ 관리자 프로필 저장됨');

    // 4. 운영자 목록에도 추가
    await set(ref(database, `operators/${user.uid}`), {
      uid: user.uid,
      name: '관리자',
      email: 'admin@codeb.com',
      status: 'offline',
      isAvailable: true,
      activeChats: 0,
      maxChats: 5,
      lastSeen: new Date().toISOString()
    });
    console.log('✅ 운영자 목록에 추가됨');

    console.log('\n🎉 관리자 계정 생성 완료!');
    console.log('이메일:', 'admin@codeb.com');
    console.log('비밀번호:', 'admin123!');
    console.log('UID:', user.uid);

  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('⚠️  이미 존재하는 계정입니다.');
    } else {
      console.error('❌ 오류 발생:', error.message);
    }
  }

  process.exit(0);
}

// 다른 테스트 계정들도 생성
async function createTestAccounts() {
  const accounts = [
    {
      email: 'manager@codeb.com',
      password: 'manager123!',
      displayName: '프로젝트 매니저',
      role: 'manager',
      isOperator: true
    },
    {
      email: 'support@codeb.com',
      password: 'support123!',
      displayName: '고객 지원',
      role: 'team_member',
      isOperator: true
    },
    {
      email: 'customer@test.com',
      password: 'customer123!',
      displayName: '테스트 고객',
      role: 'customer',
      isOperator: false
    }
  ];

  for (const account of accounts) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        account.email,
        account.password
      );

      const user = userCredential.user;
      
      await updateProfile(user, {
        displayName: account.displayName
      });

      // 사용자 프로필 저장
      await set(ref(database, `users/${user.uid}`), {
        uid: user.uid,
        email: account.email,
        displayName: account.displayName,
        role: account.role,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isOnline: false
      });

      // 운영자인 경우 operators 목록에도 추가
      if (account.isOperator) {
        await set(ref(database, `operators/${user.uid}`), {
          uid: user.uid,
          name: account.displayName,
          email: account.email,
          status: 'offline',
          isAvailable: true,
          activeChats: 0,
          maxChats: 3,
          lastSeen: new Date().toISOString()
        });
      }

      console.log(`✅ ${account.displayName} 계정 생성됨`);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️  ${account.email} 이미 존재함`);
      } else {
        console.error(`❌ ${account.email} 생성 실패:`, error.message);
      }
    }
  }
}

// 실행
async function main() {
  console.log('🚀 Firebase 계정 생성 시작...\n');
  
  await createAdminUser();
  await createTestAccounts();
  
  console.log('\n✅ 모든 계정 생성 완료!');
  console.log('\n로그인 정보:');
  console.log('관리자: admin@codeb.com / admin123!');
  console.log('매니저: manager@codeb.com / manager123!');
  console.log('지원팀: support@codeb.com / support123!');
  console.log('고객: customer@test.com / customer123!');
  
  process.exit(0);
}

main().catch(console.error);