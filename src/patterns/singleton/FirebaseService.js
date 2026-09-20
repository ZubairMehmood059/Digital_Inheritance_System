/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║           PATTERN 1: SINGLETON PATTERN                          ║
 * ║  File: src/patterns/singleton/FirebaseService.js                ║
 * ║                                                                  ║
 * ║  WHAT IT DOES:                                                   ║
 * ║  Ensures only ONE instance of Firebase (app, auth, db) exists   ║
 * ║  throughout the entire application lifetime. No matter how many ║
 * ║  times you import this file, the same instance is returned.     ║
 * ║                                                                  ║
 * ║  WHERE IT'S APPLIED:                                             ║
 * ║  → firebase/config.js already initializes Firebase once, but    ║
 * ║    it has no protection against re-initialization. This class   ║
 * ║    wraps it with a strict singleton guard.                       ║
 * ║  → Used by: NetWorth, MedicalPassport, EmergencyCard,           ║
 * ║    LegacyTrigger, and any page that directly calls db/auth.     ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import { app as configuredApp, auth as configuredAuth, db as configuredDb } from "../../firebase/config";
import { getStorage } from "firebase/storage";

class FirebaseService {
  // ── The one and only instance ──────────────────────────────────────
  static #instance = null;

  #app  = null;
  #auth = null;
  #db   = null;
  #storage = null;

  // ── Private constructor — nobody can call `new FirebaseService()` ──
  constructor() {
    this.#app = configuredApp;
    this.#auth = configuredAuth;
    this.#db = configuredDb;
    this.#storage = this.#app ? getStorage(this.#app) : null;

    console.log("[Singleton] FirebaseService instance created.");
  }

  // ── Static accessor — this is the ONLY way to get the instance ────
  static getInstance() {
    if (!FirebaseService.#instance) {
      FirebaseService.#instance = new FirebaseService();
    }
    return FirebaseService.#instance;
  }

  // ── Public getters ─────────────────────────────────────────────────
  get app()     { return this.#app; }
  get auth()    { return this.#auth; }
  get db()      { return this.#db; }
  get storage() { return this.#storage; }

  // ── Convenience: current user UID ─────────────────────────────────
  get uid() {
    return this.#auth.currentUser?.uid ?? null;
  }
}

// ── Export the singleton instance and its services ─────────────────
const firebaseService = FirebaseService.getInstance();

export const app     = firebaseService.app;
export const auth    = firebaseService.auth;
export const db      = firebaseService.db;
export const storage = firebaseService.storage;

export default firebaseService;
