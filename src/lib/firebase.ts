import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyBfu7LmMfIpgy26a6Hdzy0jnYCXyGnS0Ow",
  authDomain: "dcsdsagctu.firebaseapp.com",
  projectId: "dcsdsagctu",
  storageBucket: "dcsdsagctu.firebasestorage.app",
  messagingSenderId: "696389423997",
  appId: "1:696389423997:web:d70b1133eb079e0837b214"
};

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const googleProvider = new GoogleAuthProvider()

export const ADMIN_EMAILS = [
  'abdulkanton@gmail.com',
  'vowusuansah98@gmail.com',
  'valovely2018@gmail.com',
]