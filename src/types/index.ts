export type UserRole =
  | "managingPartner"
  | "partner"
  | "associate"
  | "paralegal"
  | "finance"
  | "admin"
  | "client";

export type MatterStatus = "open" | "active" | "pending" | "closed" | "archived";
export type PracticeArea =
  | "corporate"
  | "litigation"
  | "employment"
  | "realEstate"
  | "ip"
  | "tax"
  | "banking"
  | "arbitration"
  | "family"
  | "criminal";

export type TaskStatus = "todo" | "inProgress" | "review" | "done" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled" | "partial";
export type ContactType = "client" | "opposingCounsel" | "judge" | "expert" | "witness" | "vendor";
export type ClientType = "individual" | "company" | "government" | "ngo";
export type DocumentType = "contract" | "brief" | "motion" | "correspondence" | "evidence" | "pleading" | "court" | "other";
export type TimeActivity =
  | "legal_research"
  | "drafting"
  | "review"
  | "court"
  | "client_meeting"
  | "negotiation"
  | "correspondence"
  | "filing"
  | "travel"
  | "other";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  department?: string;
  billingRate: number;
  joinDate: string;
  lastLogin?: string;
  active: boolean;
  avatar?: string;
}

export interface Client {
  id: string;
  name: string;
  type: ClientType;
  email: string;
  phone: string;
  address: string;
  taxId?: string;
  website?: string;
  contactPerson?: string;
  portalEnabled: boolean;
  createdAt: string;
  active: boolean;
}

export interface Contact {
  id: string;
  clientId?: string;
  firstName: string;
  lastName: string;
  type: ContactType;
  email?: string;
  phone?: string;
  organization?: string;
  role?: string;
}

export interface Matter {
  id: string;
  matterId: string;
  title: string;
  clientId: string;
  practiceArea: PracticeArea;
  status: MatterStatus;
  openDate: string;
  closeDate?: string;
  jurisdiction: string;
  description?: string;
  opposingCounsel?: string;
  judge?: string;
  court?: string;
  statuteOfLimitations?: string;
  team: MatterTeamMember[];
  billingModel: "hourly" | "flatFee" | "contingency" | "retainer";
  estimatedValue?: number;
}

export interface MatterTeamMember {
  userId: string;
  role: string;
}

export interface Document {
  id: string;
  matterId?: string;
  clientId?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  documentType: DocumentType;
  version: number;
  uploadedBy: string;
  uploadedAt: string;
  checkedOutBy?: string;
  checkedOutAt?: string;
  tags: string[];
  description?: string;
  signed: boolean;
  downloadUrl?: string;
}

export interface Task {
  id: string;
  matterId?: string;
  title: string;
  description?: string;
  assignedTo: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  createdAt: string;
  completedAt?: string;
  reminderDate?: string;
  subtasks?: SubTask[];
}

export interface SubTask {
  id: string;
  title: string;
  done: boolean;
}

export interface TimeEntry {
  id: string;
  matterId: string;
  userId: string;
  date: string;
  hours: number;
  activity: TimeActivity;
  description: string;
  billable: boolean;
  billed: boolean;
  approved: boolean;
  billingRate: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  matterId: string;
  clientId: string;
  invoiceDate: string;
  dueDate: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  amountPaid: number;
  status: InvoiceStatus;
  paymentTerms: string;
  notes?: string;
  billingModel: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  type: "time" | "expense" | "fee";
}

export interface Payment {
  id: string;
  invoiceId: string;
  clientId: string;
  matterId: string;
  amount: number;
  currency: string;
  date: string;
  method: "bankTransfer" | "mobileMoney" | "cash" | "check" | "card";
  reference?: string;
  notes?: string;
  receiptNumber?: string;
}

export type ExpenseCategory =
  | "court_fees" | "travel" | "printing" | "postage" | "filing"
  | "expert_fees" | "translation" | "meals" | "accommodation" | "office" | "other";

export interface Expense {
  id: string;
  matterId?: string;
  clientId?: string;
  userId: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: string;
  billable: boolean;
  billed: boolean;
  receipt?: string;
  approved: boolean;
}

export interface Retainer {
  id: string;
  clientId: string;
  matterId?: string;
  amount: number;
  currency: string;
  startDate: string;
  endDate?: string;
  billingCycle: "monthly" | "quarterly" | "annual" | "onetime";
  status: "active" | "depleted" | "cancelled";
  balanceUsed: number;
  notes?: string;
}

export interface TrustAccount {
  id: string;
  clientId: string;
  accountNumber: string;
  balance: number;
  currency: string;
}

export interface TrustTransaction {
  id: string;
  trustAccountId: string;
  type: "deposit" | "withdrawal" | "transfer";
  amount: number;
  date: string;
  description: string;
  balanceAfter: number;
  reference?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  ipAddress: string;
  details?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: "courtDate" | "meeting" | "deadline" | "hearing" | "deposition" | "reminder";
  matterId?: string;
  startDate: string;
  endDate: string;
  location?: string;
  attendees: string[];
  description?: string;
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  entityId?: string;
  entityType?: string;
}
