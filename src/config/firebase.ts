// ─────────────────────────────────────────────────────────────────────
//  Firebase Configuration — Dentons KMN
//  Replace the values below with your Firebase project credentials.
//  Setup instructions: see README or ask your administrator.
// ─────────────────────────────────────────────────────────────────────
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
 apiKey:            "AIzaSy...",
authDomain:        "dentons-kmn.firebaseapp.com",
projectId:         "dentons-kmn",
storageBucket:     "dentons-kmn.appspot.com",
messagingSenderId: "123456789",
appId:             "1:123:web:abc123",
};

export const app = initializeApp(firebaseConfig);
export const db  = getFirestore(app);

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
