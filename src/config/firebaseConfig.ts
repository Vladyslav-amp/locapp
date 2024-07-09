import { initializeApp } from "firebase/app";
import { getFirestore } from "@firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: "locapp-4a666.firebaseapp.com",
  projectId: "locapp-4a666",
  storageBucket: "locapp-4a666.appspot.com",
  messagingSenderId: "992793780973",
  appId: "1:992793780973:web:6aa1c5c7cf66732e19e2e4"
};

// Inicjalizacja Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

export default firestore;
