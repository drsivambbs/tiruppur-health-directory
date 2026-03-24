/// <reference types="vite/client" />
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCiP0cfScoNqJ8ukaZSlf_I6qPfRyqFw_g",
  authDomain: "tiruppur-health-directory.firebaseapp.com",
  projectId: "tiruppur-health-directory",
  storageBucket: "tiruppur-health-directory.firebasestorage.app",
  messagingSenderId: "854206542383",
  appId: "1:854206542383:web:e2b9c2ad99c3d601cf0cda",
  measurementId: "G-PQDL9V6KJ8"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

