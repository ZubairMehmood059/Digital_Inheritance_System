import { auth } from "./config";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut
} from "firebase/auth";

const googleProvider = new GoogleAuthProvider();

export const signUp = (email, pass) =>
  createUserWithEmailAndPassword(auth, email, pass);

export const signIn = (email, pass) =>
  signInWithEmailAndPassword(auth, email, pass);

export const signInGoogle = () =>
  signInWithPopup(auth, googleProvider);
export const logOut = () => signOut(auth);

