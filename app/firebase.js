// src/app/firebase.js

import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCZ5_ZXz-t-F9P01EVIcAT1s1kOv6aPrew",
  authDomain: "inventory-management-app-639b0.firebaseapp.com",
  projectId: "inventory-management-app-639b0",
  storageBucket: "inventory-management-app-639b0.appspot.com",
  messagingSenderId: "221207200811",
  appId: "1:221207200811:web:5c69ca1f30062fddadd66e",
  measurementId: "G-ZRB0HQJRWL"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const auth = getAuth(app);

let analytics;
if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { firestore, auth, analytics };
