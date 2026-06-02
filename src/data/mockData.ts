import {
  User, Client, Matter, Document, Task, TimeEntry,
  Invoice, TrustAccount, TrustTransaction, AuditLog, CalendarEvent, Notification
} from "../types";

export const mockUsers: User[] = [
  {
    id: "u1",
    firstName: "Administrator",
    lastName: "",
    email: "rwouapit@bouquet-innovation.net",
    role: "admin",
    department: "Administration",
    billingRate: 0,
    joinDate: new Date().toISOString().split("T")[0],
    lastLogin: new Date().toISOString(),
    active: true,
  },
];

export const mockClients: Client[] = [];
export const mockMatters: Matter[] = [];
export const mockDocuments: Document[] = [];
export const mockTasks: Task[] = [];
export const mockTimeEntries: TimeEntry[] = [];
export const mockInvoices: Invoice[] = [];
export const mockTrustAccounts: TrustAccount[] = [];
export const mockTrustTransactions: TrustTransaction[] = [];
export const mockAuditLogs: AuditLog[] = [];
export const mockCalendarEvents: CalendarEvent[] = [];
export const mockNotifications: Notification[] = [];
