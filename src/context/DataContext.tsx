import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  Matter, Client, Document, Task, TimeEntry,
  Invoice, TrustAccount, TrustTransaction, AuditLog, CalendarEvent
} from "../types";

// ─── Helpers ────────────────────────────────────────────────────────────────
function load<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem("dkmn_" + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function save<T>(key: string, data: T[]) {
  try { localStorage.setItem("dkmn_" + key, JSON.stringify(data)); } catch {}
}

function makeSetter<T>(key: string, setState: React.Dispatch<React.SetStateAction<T[]>>) {
  return (value: T[] | ((prev: T[]) => T[])) => {
    setState(prev => {
      const next = typeof value === "function" ? value(prev) : value;
      save(key, next);
      return next;
    });
  };
}

// ─── Context type ────────────────────────────────────────────────────────────
interface DataContextType {
  matters: Matter[];           setMatters: (v: Matter[]           | ((p: Matter[])           => Matter[])           ) => void;
  clients: Client[];           setClients: (v: Client[]           | ((p: Client[])           => Client[])           ) => void;
  documents: Document[];       setDocuments: (v: Document[]       | ((p: Document[])         => Document[])         ) => void;
  tasks: Task[];               setTasks: (v: Task[]               | ((p: Task[])             => Task[])             ) => void;
  timeEntries: TimeEntry[];    setTimeEntries: (v: TimeEntry[]    | ((p: TimeEntry[])        => TimeEntry[])        ) => void;
  invoices: Invoice[];         setInvoices: (v: Invoice[]         | ((p: Invoice[])          => Invoice[])          ) => void;
  trustAccounts: TrustAccount[];    setTrustAccounts: (v: TrustAccount[]    | ((p: TrustAccount[])    => TrustAccount[])    ) => void;
  trustTransactions: TrustTransaction[]; setTrustTransactions: (v: TrustTransaction[] | ((p: TrustTransaction[]) => TrustTransaction[])) => void;
  auditLogs: AuditLog[];       setAuditLogs: (v: AuditLog[]       | ((p: AuditLog[])         => AuditLog[])         ) => void;
  calendarEvents: CalendarEvent[]; setCalendarEvents: (v: CalendarEvent[] | ((p: CalendarEvent[]) => CalendarEvent[])) => void;
  addAuditLog: (action: string, entityType: string, entityId: string, details?: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [matters,           setMattersState]           = useState<Matter[]>(           () => load("matters",           []));
  const [clients,           setClientsState]           = useState<Client[]>(           () => load("clients",           []));
  const [documents,         setDocumentsState]         = useState<Document[]>(         () => load("documents",         []));
  const [tasks,             setTasksState]             = useState<Task[]>(             () => load("tasks",             []));
  const [timeEntries,       setTimeEntriesState]       = useState<TimeEntry[]>(        () => load("timeEntries",       []));
  const [invoices,          setInvoicesState]          = useState<Invoice[]>(          () => load("invoices",          []));
  const [trustAccounts,     setTrustAccountsState]     = useState<TrustAccount[]>(     () => load("trustAccounts",     []));
  const [trustTransactions, setTrustTransactionsState] = useState<TrustTransaction[]>( () => load("trustTransactions", []));
  const [auditLogs,         setAuditLogsState]         = useState<AuditLog[]>(         () => load("auditLogs",         []));
  const [calendarEvents,    setCalendarEventsState]    = useState<CalendarEvent[]>(    () => load("calendarEvents",    []));

  const setMatters           = makeSetter("matters",           setMattersState);
  const setClients           = makeSetter("clients",           setClientsState);
  const setDocuments         = makeSetter("documents",         setDocumentsState);
  const setTasks             = makeSetter("tasks",             setTasksState);
  const setTimeEntries       = makeSetter("timeEntries",       setTimeEntriesState);
  const setInvoices          = makeSetter("invoices",          setInvoicesState);
  const setTrustAccounts     = makeSetter("trustAccounts",     setTrustAccountsState);
  const setTrustTransactions = makeSetter("trustTransactions", setTrustTransactionsState);
  const setAuditLogs         = makeSetter("auditLogs",         setAuditLogsState);
  const setCalendarEvents    = makeSetter("calendarEvents",    setCalendarEventsState);

  const addAuditLog = (action: string, entityType: string, entityId: string, details?: string) => {
    const log: AuditLog = {
      id: `al${Date.now()}`,
      userId: "u1",
      action,
      entityType,
      entityId,
      timestamp: new Date().toISOString(),
      ipAddress: "—",
      details,
    };
    setAuditLogs(prev => [log, ...prev].slice(0, 500));
  };

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
      addAuditLog,
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