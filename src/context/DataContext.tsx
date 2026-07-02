import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import {
  collection, onSnapshot, doc, setDoc,
  addDoc as fsAddDoc
} from "firebase/firestore";
import { db, COLLECTIONS } from "../config/firebase";
import {
  Matter, Client, Document, Task, TimeEntry,
  Invoice, TrustAccount, TrustTransaction, AuditLog, CalendarEvent,
  Payment, Expense, Retainer
} from "../types";

const LS_PREFIX = "dkmn_data_";

// ── localStorage helpers ───────────────────────────────────────────────────
function lsLoad<T>(col: string): T[] {
  try {
    const raw = localStorage.getItem(LS_PREFIX + col);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function lsSave<T>(col: string, data: T[]) {
  try { localStorage.setItem(LS_PREFIX + col, JSON.stringify(data)); } catch {}
}

// ── Retry queue for failed Firestore writes ──────────────────────────────
const RETRY_KEY = "dkmn_retry_queue";
interface RetryEntry { col: string; id: string; data: any; attempts: number; }

function loadRetryQueue(): RetryEntry[] {
  try { return JSON.parse(localStorage.getItem(RETRY_KEY) || "[]"); } catch { return []; }
}
function saveRetryQueue(q: RetryEntry[]) {
  try { localStorage.setItem(RETRY_KEY, JSON.stringify(q)); } catch {}
}
function enqueueRetry(col: string, id: string, data: any) {
  const q = loadRetryQueue();
  const idx = q.findIndex(e => e.col === col && e.id === id);
  if (idx >= 0) { q[idx] = { col, id, data, attempts: q[idx].attempts }; }
  else { q.push({ col, id, data, attempts: 0 }); }
  saveRetryQueue(q);
}

// Process retry queue periodically
let _retryTimer: ReturnType<typeof setInterval> | null = null;
function startRetryProcessor() {
  if (_retryTimer) return;
  _retryTimer = setInterval(async () => {
    const q = loadRetryQueue();
    if (q.length === 0) return;
    const remaining: RetryEntry[] = [];
    for (const entry of q) {
      try {
        await setDoc(doc(db, entry.col, entry.id), { ...entry.data, _updatedAt: new Date().toISOString() }, { merge: true });
      } catch {
        if (entry.attempts < 10) remaining.push({ ...entry, attempts: entry.attempts + 1 });
      }
    }
    saveRetryQueue(remaining);
  }, 15000);
}
startRetryProcessor();

// ── Sync warning state ───────────────────────────────────────────────────
let _syncWarningShown = false;
function showSyncWarning() {
  if (_syncWarningShown) return;
  _syncWarningShown = true;
  const el = document.createElement("div");
  el.id = "dkmn-sync-warning";
  el.style.cssText = "position:fixed;top:0;left:0;right:0;background:#d32f2f;color:#fff;padding:8px 16px;text-align:center;z-index:99999;font-size:14px;";
  el.textContent = "⚠ Some changes failed to sync to the cloud. They are saved locally and will retry automatically.";
  const close = document.createElement("button");
  close.textContent = "✕";
  close.style.cssText = "background:none;border:none;color:#fff;font-size:18px;cursor:pointer;margin-left:16px;";
  close.onclick = () => { el.remove(); _syncWarningShown = false; };
  el.appendChild(close);
  document.body.appendChild(el);
}

// ── Write one item to Firestore + localStorage ─────────────────────────────
function saveItem(col: string, item: any, allItems: any[]) {
  lsSave(col, allItems);
  try {
    const { id, ...data } = item;
    setDoc(doc(db, col, id), { ...data, _updatedAt: new Date().toISOString() }, { merge: true })
      .catch(() => {
        enqueueRetry(col, item.id, data);
        showSyncWarning();
      });
  } catch {
    const { id, ...data } = item;
    enqueueRetry(col, id, data);
    showSyncWarning();
  }
}

// ── Generic collection state — localStorage + Firestore ───────────────────
function useCollectionState<T extends { id: string }>(col: string) {
  // Initialise from localStorage immediately (no flicker, instant load)
  const [items, setItems]     = useState<T[]>(() => lsLoad<T>(col));
  const itemsRef              = useRef<T[]>(lsLoad<T>(col));
  const lastLocalWriteRef     = useRef<number>(0);

  // Keep ref in sync
  useEffect(() => { itemsRef.current = items; }, [items]);

  // Subscribe to Firestore for real-time cross-device sync
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, col),
      snap => {
        // Skip Firestore snapshot for 3s after a local write (avoid overwrite)
        if (Date.now() - lastLocalWriteRef.current < 3000) return;
        if (snap.docs.length === 0 && itemsRef.current.length > 0) {
          // Firestore is empty but we have local data → re-seed Firestore
          itemsRef.current.forEach(item => {
            try {
              const { id, ...data } = item as any;
              setDoc(doc(db, col, id), { ...data, _seeded: true }, { merge: true }).catch(() => {});
            } catch {}
          });
          return;
        }
        if (snap.docs.length > 0) {
          const fresh = snap.docs.map(d => ({ id: d.id, ...d.data() } as T));
          setItems(fresh);
          itemsRef.current = fresh;
          lsSave(col, fresh); // keep localStorage in sync with Firestore
        }
      },
      () => {} // offline — keep local state unchanged
    );
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [col]);

  // Setter: instant UI + localStorage, then Firestore in background
  const setter = useCallback((value: T[] | ((prev: T[]) => T[])) => {
    const prev = itemsRef.current;
    const next = typeof value === "function" ? value(prev) : value;

    lastLocalWriteRef.current = Date.now();
    setItems(next);
    itemsRef.current = next;
    lsSave(col, next); // persist locally immediately

    // Find new/changed items and write to Firestore
    next.forEach(item => {
      const existing  = prev.find(p => p.id === item.id);
      const isNew     = !existing;
      const isChanged = existing && JSON.stringify(existing) !== JSON.stringify(item);
      if (isNew || isChanged) saveItem(col, item, next);
    });
  }, [col]);

  return [items, setter] as const;
}

// ── Context type ──────────────────────────────────────────────────────────
interface DataContextType {
  matters:              Matter[];
  setMatters:           (v: Matter[]           | ((p: Matter[])           => Matter[]))           => void;
  clients:              Client[];
  setClients:           (v: Client[]           | ((p: Client[])           => Client[]))           => void;
  documents:            Document[];
  setDocuments:         (v: Document[]         | ((p: Document[])         => Document[]))         => void;
  tasks:                Task[];
  setTasks:             (v: Task[]             | ((p: Task[])             => Task[]))             => void;
  timeEntries:          TimeEntry[];
  setTimeEntries:       (v: TimeEntry[]        | ((p: TimeEntry[])        => TimeEntry[]))        => void;
  invoices:             Invoice[];
  setInvoices:          (v: Invoice[]          | ((p: Invoice[])          => Invoice[]))          => void;
  trustAccounts:        TrustAccount[];
  setTrustAccounts:     (v: TrustAccount[]     | ((p: TrustAccount[])     => TrustAccount[]))     => void;
  trustTransactions:    TrustTransaction[];
  setTrustTransactions: (v: TrustTransaction[] | ((p: TrustTransaction[]) => TrustTransaction[])) => void;
  auditLogs:            AuditLog[];
  setAuditLogs:         (v: AuditLog[]         | ((p: AuditLog[])         => AuditLog[]))         => void;
  calendarEvents:       CalendarEvent[];
  setCalendarEvents:    (v: CalendarEvent[]    | ((p: CalendarEvent[])    => CalendarEvent[]))    => void;
  payments:             Payment[];
  setPayments:          (v: Payment[]          | ((p: Payment[])          => Payment[]))          => void;
  expenses:             Expense[];
  setExpenses:          (v: Expense[]          | ((p: Expense[])          => Expense[]))          => void;
  retainers:            Retainer[];
  setRetainers:         (v: Retainer[]         | ((p: Retainer[])         => Retainer[]))         => void;
  loading:              boolean;
  addDoc_:     (col: string, data: any) => Promise<string>;
  updateDoc_:  (col: string, id: string, data: any) => Promise<void>;
  deleteDoc_:  (col: string, id: string) => Promise<void>;
  addAuditLog: (action: string, entityType: string, entityId: string, details?: string, userId?: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────
export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [matters,           setMatters]           = useCollectionState<Matter>(COLLECTIONS.MATTERS);
  const [clients,           setClients]           = useCollectionState<Client>(COLLECTIONS.CLIENTS);
  const [documents,         setDocuments]         = useCollectionState<Document>(COLLECTIONS.DOCUMENTS);
  const [tasks,             setTasks]             = useCollectionState<Task>(COLLECTIONS.TASKS);
  const [timeEntries,       setTimeEntries]       = useCollectionState<TimeEntry>(COLLECTIONS.TIME_ENTRIES);
  const [invoices,          setInvoices]          = useCollectionState<Invoice>(COLLECTIONS.INVOICES);
  const [trustAccounts,     setTrustAccounts]     = useCollectionState<TrustAccount>(COLLECTIONS.TRUST_ACCOUNTS);
  const [trustTransactions, setTrustTransactions] = useCollectionState<TrustTransaction>(COLLECTIONS.TRUST_TRANSACTIONS);
  const [auditLogs,         setAuditLogs]         = useCollectionState<AuditLog>(COLLECTIONS.AUDIT_LOGS);
  const [calendarEvents,    setCalendarEvents]    = useCollectionState<CalendarEvent>(COLLECTIONS.CALENDAR_EVENTS);
  const [payments,          setPayments]          = useCollectionState<Payment>(COLLECTIONS.PAYMENTS);
  const [expenses,          setExpenses]          = useCollectionState<Expense>(COLLECTIONS.EXPENSES);
  const [retainers,         setRetainers]         = useCollectionState<Retainer>(COLLECTIONS.RETAINERS);

  const loading = false;

  const addDoc_ = useCallback(async (col: string, data: any): Promise<string> => {
    const ref = await fsAddDoc(collection(db, col), { ...data, _createdAt: new Date().toISOString() });
    return ref.id;
  }, []);

  const updateDoc_ = useCallback(async (col: string, id: string, data: any): Promise<void> => {
    try {
      setDoc(doc(db, col, id), { ...data, _updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
    } catch {}
  }, []);

  const deleteDoc_ = useCallback(async (col: string, id: string): Promise<void> => {
    try {
      const { deleteDoc: fsDeleteDoc } = await import("firebase/firestore");
      await fsDeleteDoc(doc(db, col, id));
    } catch {}
  }, []);

  const addAuditLog = useCallback((
    action: string, entityType: string, entityId: string,
    details?: string, userId?: string
  ) => {
    fsAddDoc(collection(db, COLLECTIONS.AUDIT_LOGS), {
      userId: userId || "system", action, entityType, entityId,
      timestamp: new Date().toISOString(), ipAddress: "—", details: details || "",
    }).catch(() => {});
  }, []);

  return (
    <DataContext.Provider value={{
      matters, setMatters,
      clients, setClients,
      documents, setDocuments,
      tasks, setTasks,
      timeEntries, setTimeEntries,
      invoices, setInvoices,
      trustAccounts, setTrustAccounts,
      trustTransactions, setTrustTransactions,
      auditLogs, setAuditLogs,
      calendarEvents, setCalendarEvents,
      payments, setPayments,
      expenses, setExpenses,
      retainers, setRetainers,
      loading, addDoc_, updateDoc_, deleteDoc_, addAuditLog,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
};
