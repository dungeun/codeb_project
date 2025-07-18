const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, updateProfile } = require('firebase/auth');
const { getDatabase, ref, set } = require('firebase/database');

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

async function createTestAccounts() {
  try {
    // 관리자 계정 생성
    console.log('Creating admin account...');
    const adminUser = await createUserWithEmailAndPassword(auth, 'admin@codeb.com', 'admin123!');
    await updateProfile(adminUser.user, { displayName: '관리자' });
    
    // 관리자 프로필 데이터베이스에 저장
    await set(ref(database, `users/${adminUser.user.uid}`), {
      uid: adminUser.user.uid,
      email: 'admin@codeb.com',
      displayName: '관리자',
      role: 'admin',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      isOnline: false
    });
    console.log('✅ Admin account created successfully');

    // 고객 계정 생성 (그룹 A)
    console.log('Creating customer account...');
    const customerUser = await createUserWithEmailAndPassword(auth, 'customer@test.com', 'customer123!');
    await updateProfile(customerUser.user, { displayName: '테스트 고객' });
    
    // 고객 프로필 데이터베이스에 저장
    await set(ref(database, `users/${customerUser.user.uid}`), {
      uid: customerUser.user.uid,
      email: 'customer@test.com',
      displayName: '테스트 고객',
      role: 'customer',
      group: 'group-a',
      company: 'A회사',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      isOnline: false
    });
    console.log('✅ Customer account created successfully');
    
    // 추가 고객 계정 생성 (같은 그룹)
    console.log('Creating second customer account...');
    const customer2User = await createUserWithEmailAndPassword(auth, 'customer2@test.com', 'customer123!');
    await updateProfile(customer2User.user, { displayName: '테스트 고객2' });
    
    await set(ref(database, `users/${customer2User.user.uid}`), {
      uid: customer2User.user.uid,
      email: 'customer2@test.com',
      displayName: '테스트 고객2',
      role: 'customer',
      group: 'group-a',
      company: 'A회사',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      isOnline: false
    });
    console.log('✅ Second customer account created successfully');

    // 개발자 계정 생성
    console.log('Creating developer account...');
    const devUser = await createUserWithEmailAndPassword(auth, 'developer@codeb.com', 'dev123!');
    await updateProfile(devUser.user, { displayName: '개발자' });
    
    // 개발자 프로필 데이터베이스에 저장
    await set(ref(database, `users/${devUser.user.uid}`), {
      uid: devUser.user.uid,
      email: 'developer@codeb.com',
      displayName: '개발자',
      role: 'developer',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      isOnline: false
    });
    console.log('✅ Developer account created successfully');

    console.log('\n🎉 All test accounts created successfully!');
    console.log('\nTest Accounts:');
    console.log('- Admin: admin@codeb.com / admin123!');
    console.log('- Customer 1: customer@test.com / customer123! (Group A)');
    console.log('- Customer 2: customer2@test.com / customer123! (Group A)');
    console.log('- Developer: developer@codeb.com / dev123!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test accounts:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('\n⚠️  Some accounts may already exist. This is normal if you\'ve run this script before.');
    } else if (error.code === 'auth/weak-password') {
      console.log('\n❌ Password is too weak. Please use a stronger password.');
    } else if (error.code === 'auth/invalid-api-key') {
      console.log('\n❌ Invalid API key. Please check your Firebase configuration.');
    } else if (error.code === 'auth/operation-not-allowed') {
      console.log('\n❌ Email/password authentication is not enabled in Firebase.');
      console.log('Please enable it in Firebase Console > Authentication > Sign-in method');
    }
    
    process.exit(1);
  }
}

createTestAccounts();