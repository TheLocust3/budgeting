import * as readline from 'readline';

import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const firebase = initializeApp({
  apiKey: "AIzaSyA0TAsZg2lUNZh_GFBUDsLS5ygbEuYfGUc",
  authDomain: "budgeting-6f7c7.firebaseapp.com",
  projectId: "budgeting-6f7c7",
  storageBucket: "budgeting-6f7c7.appspot.com",
  messagingSenderId: "311510054173",
  appId: "1:311510054173:web:c2ee289e440c4fb5c0ddf4",
  measurementId: "G-4Q7FGZ3N7L"
});

rl.question("email: ", (email) => {
  rl.question("password: ", async (password) => {
    const res = await signInWithEmailAndPassword(getAuth(), email, password);
    const token = await res.user.getIdToken(true);
    console.log(token);

    rl.close();
  })
});