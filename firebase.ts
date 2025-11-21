import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAhgwyCPHDJqaBBavWRqdXCiA7jSuZpTGs",
  authDomain: "factures-app-47ebe.firebaseapp.com",
  projectId: "factures-app-47ebe",
  storageBucket: "factures-app-47ebe.firebasestorage.app",
  messagingSenderId: "777370438158",
  appId: "1:777370438158:web:48630a93c6efb1903a0a5f",
  measurementId: "G-91LN7DBPEB"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
