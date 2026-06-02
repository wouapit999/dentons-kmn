import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import {
  collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc,
  addDoc as fsAddDoc
} from "firebase/firestore";
import { db, COLLECTIONS } from "../config/firebase";
import { Matter, Client, Document, Task, TimeEntry, Invoice, TrustAccount, TrustTransaction, AuditLog, CalendarEvent } from "../types";

function useFirestoreCollection<T extends { id: string }>(col: string): [T[], boolean] {
  const [data, setData]       = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, col),
      snap => { setData(snap.docs.map(d => ({ id: d.id, ...d.data() } as T))); setLoading(false); },
      err  => { console.error(col, err); setLoading(false); }
    );
    return unsub;
  }, [col]);
  return [data, loading];
}

function makeFirestoreSetter<T extends { id: string }>(col: string, liveData: T[]) {
  return (value: T[] | ((prev: T[]) => T[])): void => {
    const next = typeof value === "function" ? value(liveData) : value;
    next.forEach(item => {
      const { id, ...data } = item as any;
      setDoc(doc(db, col, id), data).catch(() => {});
    });
  };
}

interface DataContextType {
  matters: Matter[];
  setMatters: (v: Matter[] | ((p: Matter[]) => Matter[])) => void;
  clients: Client[];
  setClients: (v: Client[] | ((p: Client[]) => Client[])) => void;
  documents: Document[];
  setDocuments: (v: Document[] | ((p: Document[]) => Document[])) => void;
  tasks: Task[];
  setTasks: (v: Task[] | ((p: Task[]) => Task[])) => void;
  timeEntries: TimeEntry[];
  setTimeEntries: (v: TimeEntry[] | ((p: TimeEntry[]) => TimeEntry[])) => void;
  invoices: Invoice[];
  setInvoices: (v: Invoice[] | ((p: Invoice[]) => Invoice[])) => void;
  trustAccounts: TrustAccount[];
  setTrustAccounts: (v: TrustAccount[] | ((p: TrustAccount[]) => TrustAccount[])) => void;
  trustTransactions: TrustTransaction[];
  setTrustTransactions: (v: TrustTransaction[] | ((p: TrustTransaction[]) => TrustTransaction[])) => void;
  auditLogs: AuditLog[];
  setAuditLogs: (v: AuditLog[] | ((p: AuditLog[]) => AuditLog[])) => void;
  calendarEvents: CalendarEvent[];
  setCalendarEvents: (v: CalendarEvent[] | ((p: CalendarEvent[]) => CalendarEvent[])) => void;
  loading: boolean;
  addDoc_: (col: string, data: any) => Promise<string>;
  updateDoc_: (col: string, id: string, data: any) => Promise<void>;
  deleteDoc_: (col: string, id: string) => Promise<void>;
  addAuditLog: (action: string, entityType: string, entityId: string, details?: string, userId?: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [matters,           mattersLoading]  = useFirestoreCollection<Matter>(COLLECTIONS.MATTERS);
  const [clients,           clientsLoading]  = useFirestoreCollection<Client>(COLLECTIONS.CLIENTS);
  const [documents]          = useFirestoreCollection<Document>(COLLECTIONS.DOCUMENTS);
  const [tasks]              = useFirestoreCollection<Task>(COLLECTIONS.TASKS);
  const [timeEntries]        = useFirestoreCollection<TimeEntry>(COLLECTIONS.TIME_ENTRIES);
  const [invoices]           = useFirestoreCollection<Invoice>(COLLECTIONS.INVOICES);
  const [trustAccounts]      = useFirestoreCollection<TrustAccount>(COLLECTIONS.TRUST_ACCOUNTS);
  const [trustTransactions]  = useFirestoreCollection<TrustTransaction>(COLLECTIONS.TRUST_TRANSACTIONS);
  const [auditLogs]          = useFirestoreCollection<AuditLog>(COLLECTIONS.AUDIT_LOGS);
  const [calendarEvents]     = useFirestoreCollection<CalendarEvent>(COLLECTIONS.CALENDAR_EVENTS);

  const loading = mattersLoading || clientsLoading;

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

  const addAuditLog = useCallback((action: string, entityType: string, entityId: string, details?: string, userId?: string) => {
    fsAddDoc(collection(db, COLLECTIONS.AUDIT_LOGS), {
      userId: userId || "system", action, entityType, entityId,
      timestamp: new Date().toISOString(), ipAddress: "—", details: details || "",
    }).catch(() => {});
  }, []);

  return (
    <DataContext.Provider value={{
      matters,           setMatters:           makeFirestoreSetter(COLLECTIONS.MATTERS,            matters),
      clients,           setClients:           makeFirestoreSetter(COLLECTIONS.CLIENTS,            clients),
      documents,         setDocuments:         makeFirestoreSetter(COLLECTIONS.DOCUMENTS,          documents),
      tasks,             setTasks:             makeFirestoreSetter(COLLECTIONS.TASKS,              tasks),
      timeEntries,       setTimeEntries:       makeFirestoreSetter(COLLECTIONS.TIME_ENTRIES,       timeEntries),
      invoices,          setInvoices:          makeFirestoreSetter(COLLECTIONS.INVOICES,           invoices),
      trustAccounts,     setTrustAccounts:     makeFirestoreSetter(COLLECTIONS.TRUST_ACCOUNTS,     trustAccounts),
      trustTransactions, setTrustTransactions: makeFirestoreSetter(COLLECTIONS.TRUST_TRANSACTIONS, trustTransactions),
      auditLogs,         setAuditLogs:         makeFirestoreSetter(COLLECTIONS.AUDIT_LOGS,         auditLogs),
      calendarEvents,    setCalendarEvents:    makeFirestoreSetter(COLLECTIONS.CALENDAR_EVENTS,    calendarEvents),
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
