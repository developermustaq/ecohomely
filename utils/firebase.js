import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA0BSrwXFoBeMvdN4efvfJqHRQarNbZap4",
  authDomain: "ecohomely-app.firebaseapp.com",
  projectId: "ecohomely-app",
  storageBucket: "ecohomely-app.firebasestorage.app",
  messagingSenderId: "820094665311",
  appId: "1:820094665311:web:eecfb772e7c15e510211ea",
  measurementId: "G-EXHQ66NZ3G"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
  
  export { db, storage};
