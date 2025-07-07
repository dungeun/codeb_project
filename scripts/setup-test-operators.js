// Script to add test operators to Firebase Realtime Database
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set } = require('firebase/database');
const { getAuth, createUserWithEmailAndPassword, updateProfile } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyAqJnNFrtx3kcHGzKRxLBRJTqneUWFcmFE",
  authDomain: "codeb-web.firebaseapp.com",
  projectId: "codeb-web",
  storageBucket: "codeb-web.firebasestorage.app",
  messagingSenderId: "369797617511",
  appId: "1:369797617511:web:8fd87fb8bb6a2c3c5dcbf3",
  measurementId: "G-ZH6D0WK65T",
  databaseURL: "https://codeb-web-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

async function setupTestOperators() {
  try {
    // Create test operators
    const operators = [
      {
        email: 'manager@codeb.com',
        password: 'manager123!',
        displayName: '매니저',
        role: 'manager'
      },
      {
        email: 'support@codeb.com',
        password: 'support123!',
        displayName: '상담원1',
        role: 'team_member'
      },
      {
        email: 'support2@codeb.com',
        password: 'support123!',
        displayName: '상담원2',
        role: 'team_member'
      }
    ];

    for (const operator of operators) {
      try {
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, operator.email, operator.password);
        const user = userCredential.user;
        
        // Update display name
        await updateProfile(user, { displayName: operator.displayName });
        
        // Add user profile to database
        await set(ref(database, `users/${user.uid}`), {
          uid: user.uid,
          email: operator.email,
          displayName: operator.displayName,
          role: operator.role,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          isOnline: false
        });
        
        // Add operator profile
        await set(ref(database, `operators/${user.uid}`), {
          id: user.uid,
          name: operator.displayName,
          email: operator.email,
          isOnline: false,
          isAvailable: true,
          activeChats: 0,
          maxChats: 5,
          status: 'offline'
        });
        
        console.log(`Created operator: ${operator.email}`);
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          console.log(`Operator ${operator.email} already exists`);
        } else {
          console.error(`Error creating operator ${operator.email}:`, error);
        }
      }
    }
    
    console.log('Test operators setup complete!');
  } catch (error) {
    console.error('Setup failed:', error);
  }
  
  process.exit(0);
}

setupTestOperators();