import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import {
  collection, onSnapshot, doc, setDoc,
  addDoc as fsAddDoc
} from "firebase/firestore";
import { db, COLLECTIONS } from "../config/firebase";
import {
  Matter, Client, Document, Task, TimeEntry,
  Invoice, TrustAccount, TrustTransaction, AuditLog, CalendarEvent
} from "../types";

// ── Write one item to Firestore (background, never throws) ────────────────
function saveToFirestore(col: string, item: any) {
  try {
    const { id, ...data } = item;
    setDoc(doc(db, col, id), data, { merge: true }).catch(() => {});
  } catch {}
}

// ── Generic collection state with Firestore real-time sync ────────────────
function useCollectionState<T extends { id: string }>(col: string) {
  const [items, setItems] = useState<T[]>([]);
  const itemsRef          = useRef<T[]>([]);   // always holds latest value

  // Keep ref in sync with state
  useEffect(() => { itemsRef.current = items; }, [items]);

  // Subscribe to Firestore real-time updates
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, col),
      snap => setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as T))),
      ()   => {} // offline — keep local state as-is
    );
    return unsub;
  }, [col]);

  // Setter: updates local state immediately, then writes to Firestore
  const setter = useCallback((value: T[] | ((prev: T[]) => T[])) => {
    const prev = itemsRef.current;
    const next = typeof value === "function" ? value(prev) : value;

    // 1. Update UI instantly
    setItems(next);

    // 2. Write new/changed items to Firestore (outside React render)
    next.forEach(item => {
      const existing = prev.find(p => p.id === item.id);
      const isNew     = !existing;
      const isChanged = existing && JSON.stringify(existing) !== JSON.stringify(item);
      if (isNew || isChanged) {
        saveToFirestore(col, item);
      }
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

  const loading = false; // UI never blocks on loading

  const addAuditLog = useCallback((
    action: string, entityType: string, entityId: string,
    details?: string, userId?: string
  ) => {
    fsAddDoc(collection(db, COLLECTIONS.AUDIT_LOGS), {
      userId: userId || "system", action, entityType, entityId,
      timestamp: new Date().toISOString(), ipAddress: "—",
      details: details || "",
    }).catch(() => {});
  }, []);

  // Keep addDoc_ and updateDoc_ for components that use them directly
  const addDoc_    = useCallback(async (col: string, data: any): Promise<string> => {
    const ref = await fsAddDoc(collection(db, col), { ...data, _createdAt: new Date().toISOString() });
    return ref.id;
  }, []);

  const updateDoc_ = useCallback(async (col: string, id: string, data: any): Promise<void> => {
    saveToFirestore(col, { id, ...data });
  }, []);

  const deleteDoc_ = useCallback(async (col: string, id: string): Promise<void> => {
    try {
      const { deleteDoc: fsDeleteDoc } = await import("firebase/firestore");
      await fsDeleteDoc(doc(db, col, id));
    } catch {}
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
