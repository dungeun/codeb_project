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

// 테스트 계정들
const testAccounts = [
  {
    email: 'manager@codeb.com',
    password: 'manager123!',
    displayName: '프로젝트 매니저',
    role: 'manager',
    isOperator: true,
    maxChats: 3
  },
  {
    email: 'support@codeb.com',
    password: 'support123!',
    displayName: '고객 지원',
    role: 'team_member',
    isOperator: true,
    maxChats: 3
  },
  {
    email: 'customer@test.com',
    password: 'customer123!',
    displayName: '테스트 고객',
    role: 'customer',
    isOperator: false
  }
];

async function createAccount(account) {
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
        maxChats: account.maxChats,
        lastSeen: new Date().toISOString()
      });
    }

    console.log(`✅ ${account.displayName} (${account.email}) 계정 생성 완료!`);
    return { success: true, uid: user.uid };
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log(`⚠️  ${account.email} 이미 존재함`);
      return { success: false, exists: true };
    } else {
      console.error(`❌ ${account.email} 생성 실패:`, error.message);
      return { success: false, error: error.message };
    }
  }
}

async function main() {
  console.log('🚀 테스트 계정 생성 시작...\n');
  
  let created = 0;
  let existing = 0;
  let failed = 0;

  for (const account of testAccounts) {
    const result = await createAccount(account);
    if (result.success) created++;
    else if (result.exists) existing++;
    else failed++;
  }

  console.log('\n📊 결과:');
  console.log(`✅ 생성됨: ${created}`);
  console.log(`⚠️  이미 존재: ${existing}`);
  console.log(`❌ 실패: ${failed}`);
  
  console.log('\n🔐 테스트 계정 정보:');
  console.log('━'.repeat(50));
  console.log('고객: customer@test.com / customer123!');
  console.log('관리자: admin@codeb.com / admin123!');
  console.log('매니저: manager@codeb.com / manager123!');
  console.log('지원팀: support@codeb.com / support123!');
  console.log('━'.repeat(50));
  
  process.exit(0);
}

main().catch(console.error);