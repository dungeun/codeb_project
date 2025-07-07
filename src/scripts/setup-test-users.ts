import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { ref, set } from 'firebase/database'
import { auth, database } from '../lib/firebase'
import { UserProfile } from '../lib/auth-context'

const testUsers = [
  {
    email: 'admin@codeb.com',
    password: 'admin123!',
    displayName: '관리자',
    role: 'admin' as const,
  },
  {
    email: 'customer@test.com', 
    password: 'customer123!',
    displayName: '테스트 고객',
    role: 'customer' as const,
  },
  {
    email: 'manager@codeb.com',
    password: 'manager123!',
    displayName: '프로젝트 매니저',
    role: 'manager' as const,
  },
  {
    email: 'dev@codeb.com',
    password: 'dev123!',
    displayName: '개발자',
    role: 'developer' as const,
  }
]

async function createTestUsers() {
  console.log('테스트 사용자 생성 시작...')
  
  for (const testUser of testUsers) {
    try {
      // Firebase Auth에 사용자 생성
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        testUser.email,
        testUser.password
      )
      
      // 프로필 업데이트
      await updateProfile(userCredential.user, { 
        displayName: testUser.displayName 
      })
      
      // Realtime Database에 사용자 프로필 저장
      const userProfile: UserProfile = {
        uid: userCredential.user.uid,
        email: testUser.email,
        displayName: testUser.displayName,
        role: testUser.role,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isOnline: false,
      }
      
      await set(ref(database, `users/${userCredential.user.uid}`), userProfile)
      
      console.log(`✅ ${testUser.role} 사용자 생성 완료: ${testUser.email}`)
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️ ${testUser.email} 이미 존재함`)
      } else {
        console.error(`❌ ${testUser.email} 생성 실패:`, error.message)
      }
    }
  }
  
  console.log('\n테스트 사용자 생성 완료!')
  console.log('\n로그인 정보:')
  testUsers.forEach(user => {
    console.log(`${user.role}: ${user.email} / ${user.password}`)
  })
  
  process.exit(0)
}

// 스크립트 실행
createTestUsers().catch(console.error)