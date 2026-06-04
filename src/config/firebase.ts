// ─────────────────────────────────────────────────────────────────────
//  Firebase Configuration — Dentons KMN
//  Replace the values below with your Firebase project credentials.
//  Setup instructions: see README or ask your administrator.
// ─────────────────────────────────────────────────────────────────────
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey:            "AIzaSyC5zm9WOA8cKB_voDJtWGJuXoj9u4V26vY",
  authDomain:        "dentons-kmn.firebaseapp.com",
  databaseURL:       "https://dentons-kmn-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:         "dentons-kmn",
  storageBucket:     "dentons-kmn.firebasestorage.app",
  messagingSenderId: "689398115566",
  appId:             "1:689398115566:web:c908e00b64b451802217ff",
};

export const app     = initializeApp(firebaseConfig);
export const db      = getFirestore(app);
export const storage = getStorage(app);

// Enable offline persistence so the app keeps working briefly if network drops
enableIndexedDbPersistence(db).catch(() => {/* multi-tab mode — ignore */});

export const COLLECTIONS = {
  USERS:              "users",
  MATTERS:            "matters",
  CLIENTS:            "clients",
  DOCUMENTS:          "documents",
  TASKS:              "tasks",
  TIME_ENTRIES:       "timeEntries",
  INVOICES:           "invoices",
  TRUST_ACCOUNTS:     "trustAccounts",
  TRUST_TRANSACTIONS: "trustTransactions",
  AUDIT_LOGS:         "auditLogs",
  CALENDAR_EVENTS:    "calendarEvents",
  LOCKS:              "locks",
  SETTINGS:           "settings",
} as const;
