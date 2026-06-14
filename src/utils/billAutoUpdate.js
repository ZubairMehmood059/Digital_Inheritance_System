/**
 * FEATURE: Bill Auto-Status Updater
 * On every app load, sweeps all unpaid bills with dueDate < today
 * and batch-writes status: "overdue" to Firestore.
 * Called once from App_updated.jsx after auth resolves.
 */

import { db, auth } from "../firebase/config";
import {
  collection, query, where, getDocs, writeBatch, doc,
} from "firebase/firestore";

export async function runBillAutoUpdate() {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  try {
    const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
    const q = query(
      collection(db, "utilityBills"),
      where("uid",    "==", uid),
      where("status", "==", "unpaid"),
    );

    const snap  = await getDocs(q);
    const batch = writeBatch(db);
    let   count = 0;

    snap.docs.forEach(d => {
      const bill = d.data();
      if (bill.dueDate && bill.dueDate < today) {
        batch.update(doc(db, "utilityBills", d.id), { status: "overdue" });
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
      console.log(`[BillAutoUpdate] Marked ${count} bill(s) as overdue.`);
    }
  } catch (err) {
    // Silent fail — non-critical background task
    console.warn("[BillAutoUpdate] Failed:", err.message);
  }
}
