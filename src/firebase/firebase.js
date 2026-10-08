import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAl95XZnmKm6v2mUzUWUuiS_sKCYqlMxFw",
  authDomain: "lumora-f01db.firebaseapp.com",
  projectId: "lumora-f01db",
  storageBucket: "lumora-f01db.firebasestorage.app",
  messagingSenderId: "321915954437",
  appId: "1:321915954437:web:de53f9d12555f6751c036c",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);

export const storage = getStorage(app);

export default app;