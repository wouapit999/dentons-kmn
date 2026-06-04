import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import {
  collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc,
  addDoc as fsAddDoc
} from "firebase/firestore";
import { db, COLLECTIONS } from "../config/firebase";
import {
  Matter, Client, Document, Task, TimeEntry,
  Invoice, TrustAccount, TrustTransaction, AuditLog, CalendarEvent
} from "../types";

// ── Generic hook: local state + Firestore real-time sync ───────────────────
function useFirestoreState<T extends { id: string }>(col: string): [
  T[],
  React.Dispatch<React.SetStateAction<T[]>>,
  boolean
] {
  const [data, setData]       = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribed = false;
    const unsub = onSnapshot(
      collection(db, col),
      snap => {
        if (!unsubscribed) {
          setData(snap.docs.map(d => ({ id: d.id, ...d.data() } as T)));
          setLoading(false);
        }
      },
      err => {
        console.warn(`Firestore ${col} offline, using local state:`, err.message);
        setLoading(false);
      }
    );
    return () => { unsubscribed = true; unsub(); };
  }, [col]);

  return [data, setData, loading];
}

// ── Write a single item to Firestore (background, non-blocking) ────────────
function persistItem(col: string, item: any) {
  const { id, ...data } = item;
  setDoc(doc(db, col, id), data, { merge: true }).catch(() => {
    // Silently ignore — local state already updated
  });
}

// ── Make a setter that updates local state immediately + syncs to Firestore ─
function makeOptimisticSetter<T extends { id: string }>(
  col: string,
  setLocal: React.Dispatch<React.SetStateAction<T[]>>
) {
  return (value: T[] | ((prev: T[]) => T[])): void => {
    setLocal(prev => {
      const next = typeof value === "function" ? value(prev) : value;

      // Find items that are new or changed compared to previous state
      next.forEach(item => {
        const existing = prev.find(p => p.id === item.id);
        const isNew     = !existing;
        const isChanged = existing && JSON.stringify(existing) !== JSON.stringify(item);
        if (isNew || isChanged) {
          persistItem(col, item);
        }
      });

      return next;
    });
  };
}

// ── Context type ───────────────────────────────────────────────────────────
interface DataContextType {
  matters:           Matter[];
  setMatters:        (v: Matter[]           | ((p: Matter[])           => Matter[]))           => void;
  clients:           Client[];
  setClients:        (v: Client[]           | ((p: Client[])           => Client[]))           => void;
  documents:         Document[];
  setDocuments:      (v: Document[]         | ((p: Document[])         => Document[]))         => void;
  tasks:             Task[];
  setTasks:          (v: Task[]             | ((p: Task[])             => Task[]))             => void;
  timeEntries:       TimeEntry[];
  setTimeEntries:    (v: TimeEntry[]        | ((p: TimeEntry[])        => TimeEntry[]))        => void;
  invoices:          Invoice[];
  setInvoices:       (v: Invoice[]          | ((p: Invoice[])          => Invoice[]))          => void;
  trustAccounts:     TrustAccount[];
  setTrustAccounts:  (v: TrustAccount[]    | ((p: TrustAccount[])    => TrustAccount[]))    => void;
  trustTransactions: TrustTransaction[];
  setTrustTransactions: (v: TrustTransaction[] | ((p: TrustTransaction[]) => TrustTransaction[])) => void;
  auditLogs:         AuditLog[];
  setAuditLogs:      (v: AuditLog[]         | ((p: AuditLog[])         => AuditLog[]))         => void;
  calendarEvents:    CalendarEvent[];
  setCalendarEvents: (v: CalendarEvent[]   | ((p: CalendarEvent[])   => CalendarEvent[]))   => void;
  loading:           boolean;
  addDoc_:    (col: string, data: any) => Promise<string>;
  updateDoc_: (col: string, id: string, data: any) => Promise<void>;
  deleteDoc_: (col: string, id: string) => Promise<void>;
  addAuditLog: (action: string, entityType: string, entityId: string, details?: string, userId?: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// ── Provider ───────────────────────────────────────────────────────────────
export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [matters,           setMattersLocal,           mattersLoading]  = useFirestoreState<Matter>(COLLECTIONS.MATTERS);
  const [clients,           setClientsLocal,           clientsLoading]  = useFirestoreState<Client>(COLLECTIONS.CLIENTS);
  const [documents,         setDocumentsLocal]                          = useFirestoreState<Document>(COLLECTIONS.DOCUMENTS);
  const [tasks,             setTasksLocal]                              = useFirestoreState<Task>(COLLECTIONS.TASKS);
  const [timeEntries,       setTimeEntriesLocal]                        = useFirestoreState<TimeEntry>(COLLECTIONS.TIME_ENTRIES);
  const [invoices,          setInvoicesLocal]                           = useFirestoreState<Invoice>(COLLECTIONS.INVOICES);
  const [trustAccounts,     setTrustAccountsLocal]                      = useFirestoreState<TrustAccount>(COLLECTIONS.TRUST_ACCOUNTS);
  const [trustTransactions, setTrustTransactionsLocal]                  = useFirestoreState<TrustTransaction>(COLLECTIONS.TRUST_TRANSACTIONS);
  const [auditLogs,         setAuditLogsLocal]                          = useFirestoreState<AuditLog>(COLLECTIONS.AUDIT_LOGS);
  const [calendarEvents,    setCalendarEventsLocal]                     = useFirestoreState<CalendarEvent>(COLLECTIONS.CALENDAR_EVENTS);

  const loading = mattersLoading || clientsLoading;

  // Optimistic setters — update UI instantly, sync to Firestore in background
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setMatters           = useCallback(makeOptimisticSetter(COLLECTIONS.MATTERS,            setMattersLocal),           []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setClients           = useCallback(makeOptimisticSetter(COLLECTIONS.CLIENTS,            setClientsLocal),           []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setDocuments         = useCallback(makeOptimisticSetter(COLLECTIONS.DOCUMENTS,          setDocumentsLocal),         []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setTasks             = useCallback(makeOptimisticSetter(COLLECTIONS.TASKS,              setTasksLocal),             []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setTimeEntries       = useCallback(makeOptimisticSetter(COLLECTIONS.TIME_ENTRIES,       setTimeEntriesLocal),       []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setInvoices          = useCallback(makeOptimisticSetter(COLLECTIONS.INVOICES,           setInvoicesLocal),          []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setTrustAccounts     = useCallback(makeOptimisticSetter(COLLECTIONS.TRUST_ACCOUNTS,     setTrustAccountsLocal),     []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setTrustTransactions = useCallback(makeOptimisticSetter(COLLECTIONS.TRUST_TRANSACTIONS, setTrustTransactionsLocal), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setAuditLogs         = useCallback(makeOptimisticSetter(COLLECTIONS.AUDIT_LOGS,         setAuditLogsLocal),         []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setCalendarEvents    = useCallback(makeOptimisticSetter(COLLECTIONS.CALENDAR_EVENTS,    setCalendarEventsLocal),    []);

  // ── Direct Firestore CRUD helpers ─────────────────────────────────────────
  const addDoc_ = useCallback(async (col: string, data: any): Promise<string> => {
    const ref = await fsAddDoc(collection(db, col), { ...data, _createdAt: new Date().toISOString() });
    return ref.id;
  }, []);

  const updateDoc_ = useCallback(async (col: string, id: string, data: any): Promise<void> => {
    await updateDoc(doc(db, col, id), { ...data, _updatedAt: new Date().toISOString() });
  }, []);

  const deleteDoc_ = useCallback(async (col: string, id: string): Promise<void> => {
    await deleteDoc(doc(db, col, id));
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
