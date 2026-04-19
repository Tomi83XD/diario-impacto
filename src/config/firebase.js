// src/config/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// TODO: Reemplazá este objeto con EL TUYO que te dio la consola de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA-cSjDQ80ZkMkyJ354BNiELPjMMN62eCo",
  authDomain: "diario-impacto.firebaseapp.com",
  projectId: "diario-impacto",
  storageBucket: "diario-impacto.firebasestorage.app",
  messagingSenderId: "745910662573",
  appId: "1:745910662573:web:54c874f19bc1c5dd0e9d24"
};


// Inicializamos Firebase
const app = initializeApp(firebaseConfig);

// Exportamos los tres servicios que vamos a usar en toda la página
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);