import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyD8rxcLdIbZsl93Bk7iLL3-awr7bj06Fi4",
  authDomain: "tasksync-6d2b5.firebaseapp.com",
  projectId: "tasksync-6d2b5",
  storageBucket: "tasksync-6d2b5.firebasestorage.app",
  messagingSenderId: "664374076150",
  appId: "1:664374076150:web:b96b6eddce7e74e0aec2d7",
  measurementId: "G-NN6G6B04HG"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default analytics;