// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database"; // Import getDatabase
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDP6D561YcIP5SdV6f4a2rqi-HfoDkhfbw",
  authDomain: "website-b37e4.firebaseapp.com",
  databaseURL: "https://website-b37e4-default-rtdb.firebaseio.com",
  projectId: "website-b37e4",
  storageBucket: "website-b37e4.firebasestorage.app",
  messagingSenderId: "483820914239",
  appId: "1:483820914239:web:f183dc64729d2994e4da8a",
  measurementId: "G-4WF7NEY3W2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getDatabase(app); // Export the database instance