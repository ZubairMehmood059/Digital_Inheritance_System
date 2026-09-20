import { db, auth } from "./config";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  addDoc,
  getDocs,
  deleteDoc
} from "firebase/firestore";

// ✅ User ka lastLogin update karo — "I'm Alive" button yahi call karega
export async function updateLastLogin() {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  await updateDoc(doc(db, "users", uid), {
    lastLogin: serverTimestamp(),
    status: "active",
  });
}

// ✅ User ka data laao
export async function getUserData() {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

// ✅ Kitne din baaki hain calculate karo
export function getDaysRemaining(lastLogin, inactivityDays = 2) {
  if (!lastLogin) return inactivityDays;
  const last = lastLogin.toDate(); // Firestore Timestamp → JS Date
  const now = new Date();
  const diffMs = now - last;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, inactivityDays - diffDays);
}

// ✅ Asset save karo (encrypted)
export async function addAsset(assetData) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  await addDoc(collection(db, "users", uid, "assets"), {
    ...assetData,
    createdAt: serverTimestamp(),
  });
}

// ✅ Assets laao
export async function getAssets() {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];
  const snap = await getDocs(collection(db, "users", uid, "assets"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ✅ Asset delete karo
export async function deleteAsset(assetId) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  await deleteDoc(doc(db, "users", uid, "assets", assetId));
}

// ✅ Nominee save karo
export async function addNominee(nomineeData) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  await addDoc(collection(db, "users", uid, "nominees"), {
    ...nomineeData,
    createdAt: serverTimestamp(),
  });
}

// ✅ Nominees laao
export async function getNominees() {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];
  const snap = await getDocs(collection(db, "users", uid, "nominees"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}


// ✅ Nominee delete karo
export async function deleteNominee(nomineeId) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  await deleteDoc(doc(db, "users", uid, "nominees", nomineeId));
}

// ============================================================
// INHERITANCE ENGINE
// Firestore schema:
//   users/{uid}/inheritancePlans/{planId}
//     - assetId: string (ref to assets subcollection)
//     - assetTitle: string
//     - assetCategory: string
//     - totalValue: number
//     - currency: string
//     - delayDays: number (0 = immediate)
//     - status: "draft" | "active" | "released"
//     - createdAt: timestamp
//     - beneficiaries: [
//         { nomineeId, nomineeName, relation, percentage, releaseDate }
//       ]
// ============================================================

export async function addInheritancePlan(planData) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  return await addDoc(collection(db, "users", uid, "inheritancePlans"), {
    ...planData,
    status: "active",
    createdAt: serverTimestamp(),
  });
}

export async function getInheritancePlans() {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];
  const snap = await getDocs(collection(db, "users", uid, "inheritancePlans"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function updateInheritancePlan(planId, updates) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  await updateDoc(doc(db, "users", uid, "inheritancePlans", planId), updates);
}

export async function deleteInheritancePlan(planId) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  await deleteDoc(doc(db, "users", uid, "inheritancePlans", planId));
}