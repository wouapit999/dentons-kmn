import {
  User, Client, Matter, Document, Task, TimeEntry,
  Invoice, TrustAccount, TrustTransaction, AuditLog, CalendarEvent, Notification
} from "../types";

export const mockUsers: User[] = [
  {
    id: "u1", firstName: "Emmanuel", lastName: "Nkongho", email: "e.nkongho@dentons-kmn.cm",
    role: "managingPartner", department: "Management", billingRate: 75000,
    joinDate: "2018-01-15", lastLogin: "2026-06-01T08:30:00", active: true,
  },
  {
    id: "u2", firstName: "Marie-Claire", lastName: "Kouengoua", email: "m.kouengoua@dentons-kmn.cm",
    role: "partner", department: "Corporate", billingRate: 65000,
    joinDate: "2018-03-01", lastLogin: "2026-06-01T09:15:00", active: true,
  },
  {
    id: "u3", firstName: "Bertrand", lastName: "Minou", email: "b.minou@dentons-kmn.cm",
    role: "partner", department: "Litigation", billingRate: 65000,
    joinDate: "2019-06-10", lastLogin: "2026-05-31T17:45:00", active: true,
  },
  {
    id: "u4", firstName: "Aissatou", lastName: "Diallo", email: "a.diallo@dentons-kmn.cm",
    role: "associate", department: "Corporate", billingRate: 45000,
    joinDate: "2021-09-01", lastLogin: "2026-06-01T08:00:00", active: true,
  },
  {
    id: "u5", firstName: "Jean-Pierre", lastName: "Mvondo", email: "jp.mvondo@dentons-kmn.cm",
    role: "associate", department: "Litigation", billingRate: 40000,
    joinDate: "2022-02-14", lastLogin: "2026-05-30T16:00:00", active: true,
  },
  {
    id: "u6", firstName: "Carine", lastName: "Tchoupo", email: "c.tchoupo@dentons-kmn.cm",
    role: "paralegal", department: "Support", billingRate: 25000,
    joinDate: "2020-07-20", lastLogin: "2026-06-01T07:55:00", active: true,
  },
  {
    id: "u7", firstName: "Paul", lastName: "Biya", email: "p.biya@dentons-kmn.cm",
    role: "finance", department: "Finance", billingRate: 0,
    joinDate: "2019-11-05", lastLogin: "2026-06-01T08:45:00", active: true,
  },
  {
    id: "u8", firstName: "Sophie", lastName: "Admin", email: "s.admin@dentons-kmn.cm",
    role: "admin", department: "IT", billingRate: 0,
    joinDate: "2020-01-15", lastLogin: "2026-06-01T09:00:00", active: true,
  },
];

export const mockClients: Client[] = [
  {
    id: "c1", name: "Société Camerounaise de Pétrole (SCP)", type: "company",
    email: "legal@scp.cm", phone: "+237 222 123 456", address: "Boulevard de la Liberté, Douala",
    taxId: "M098765432A", website: "www.scp.cm", contactPerson: "Dr. Adamou Ndam",
    portalEnabled: true, createdAt: "2022-01-10", active: true,
  },
  {
    id: "c2", name: "Banque Atlantique Cameroun", type: "company",
    email: "direction@bac.cm", phone: "+237 233 456 789", address: "Rue de la Réunification, Yaoundé",
    taxId: "P112233445B", contactPerson: "Mme. Fatou Diop",
    portalEnabled: true, createdAt: "2021-05-20", active: true,
  },
  {
    id: "c3", name: "Groupe Fotso", type: "company",
    email: "info@groupefotso.cm", phone: "+237 243 789 012", address: "Akwa, Douala",
    taxId: "R334455667C", contactPerson: "M. Victor Fotso Jr",
    portalEnabled: false, createdAt: "2020-08-15", active: true,
  },
  {
    id: "c4", name: "République du Cameroun – MINFI", type: "government",
    email: "contentieux@minfi.gov.cm", phone: "+237 222 234 567", address: "Yaoundé, Centre",
    taxId: "ETAT-001", portalEnabled: false, createdAt: "2023-02-01", active: true,
  },
  {
    id: "c5", name: "Mme. Christelle Nguemo", type: "individual",
    email: "c.nguemo@gmail.com", phone: "+237 699 123 456", address: "Bastos, Yaoundé",
    portalEnabled: false, createdAt: "2024-03-15", active: true,
  },
  {
    id: "c6", name: "MTN Cameroon", type: "company",
    email: "legal@mtn.cm", phone: "+237 222 567 890", address: "Avenue du Dr Jamot, Yaoundé",
    taxId: "N556677889D", contactPerson: "Mme. Awa Traore",
    portalEnabled: true, createdAt: "2019-11-10", active: true,
  },
];

export const mockMatters: Matter[] = [
  {
    id: "m1", matterId: "DK-2026-001", title: "SCP vs Consortium International – Arbitrage Pétrolier",
    clientId: "c1", practiceArea: "arbitration", status: "active",
    openDate: "2026-01-15", jurisdiction: "CCJA – Abidjan",
    description: "Arbitrage international relatif à un contrat de production pétrolière",
    opposingCounsel: "Cabinet Dupont & Associés (Paris)", court: "CCJA",
    team: [{ userId: "u1", role: "Partner in Charge" }, { userId: "u4", role: "Associate" }],
    billingModel: "hourly", estimatedValue: 500000000,
  },
  {
    id: "m2", matterId: "DK-2026-002", title: "Acquisition BAC par Groupe Financier Panafricain",
    clientId: "c2", practiceArea: "banking", status: "active",
    openDate: "2026-02-01", jurisdiction: "Douala, Cameroun",
    description: "Due diligence et structuration de l'acquisition",
    team: [{ userId: "u2", role: "Partner in Charge" }, { userId: "u4", role: "Associate" }, { userId: "u6", role: "Paralegal" }],
    billingModel: "flatFee", estimatedValue: 250000000,
  },
  {
    id: "m3", matterId: "DK-2025-089", title: "Litige Foncier Groupe Fotso – Terrain Akwa",
    clientId: "c3", practiceArea: "realEstate", status: "active",
    openDate: "2025-11-10", jurisdiction: "TGI Wouri, Douala",
    opposingCounsel: "Me. Alain Samba", judge: "M. Etama", court: "TGI Wouri",
    team: [{ userId: "u3", role: "Partner in Charge" }, { userId: "u5", role: "Associate" }],
    billingModel: "hourly", estimatedValue: 150000000,
  },
  {
    id: "m4", matterId: "DK-2026-003", title: "Contentieux Fiscal MINFI – Redressement TVA",
    clientId: "c4", practiceArea: "tax", status: "pending",
    openDate: "2026-03-01", jurisdiction: "Tribunal Administratif de Yaoundé",
    court: "Tribunal Administratif", statuteOfLimitations: "2028-03-01",
    team: [{ userId: "u2", role: "Partner in Charge" }, { userId: "u5", role: "Associate" }],
    billingModel: "flatFee",
  },
  {
    id: "m5", matterId: "DK-2026-004", title: "Divorce et Garde d'Enfants – Nguemo",
    clientId: "c5", practiceArea: "family", status: "active",
    openDate: "2026-03-20", jurisdiction: "TGI Mfoundi, Yaoundé",
    court: "TGI Mfoundi",
    team: [{ userId: "u3", role: "Associate" }, { userId: "u6", role: "Paralegal" }],
    billingModel: "flatFee",
  },
  {
    id: "m6", matterId: "DK-2025-067", title: "Contrat de Licence Technologique MTN",
    clientId: "c6", practiceArea: "ip", status: "closed",
    openDate: "2025-06-15", closeDate: "2026-01-30", jurisdiction: "Cameroun",
    team: [{ userId: "u2", role: "Partner in Charge" }, { userId: "u4", role: "Associate" }],
    billingModel: "flatFee", estimatedValue: 50000000,
  },
  {
    id: "m7", matterId: "DK-2026-005", title: "Restructuration Sociale SCP – Licenciements Collectifs",
    clientId: "c1", practiceArea: "employment", status: "open",
    openDate: "2026-05-10", jurisdiction: "TRHC Douala",
    team: [{ userId: "u1", role: "Partner in Charge" }, { userId: "u5", role: "Associate" }],
    billingModel: "hourly",
  },
  {
    id: "m8", matterId: "DK-2024-112", title: "Création Holding – Groupe Fotso",
    clientId: "c3", practiceArea: "corporate", status: "closed",
    openDate: "2024-09-01", closeDate: "2025-04-30", jurisdiction: "OHADA",
    team: [{ userId: "u2", role: "Partner in Charge" }, { userId: "u4", role: "Associate" }],
    billingModel: "flatFee",
  },
];

export const mockDocuments: Document[] = [
  {
    id: "d1", matterId: "m1", fileName: "Mémoire_Arbitrage_SCP_v3.pdf",
    fileSize: 2450000, fileType: "pdf", documentType: "brief",
    version: 3, uploadedBy: "u4", uploadedAt: "2026-05-28T14:30:00",
    tags: ["arbitrage", "mémoire", "principal"], description: "Mémoire principal d'arbitrage",
    signed: false,
  },
  {
    id: "d2", matterId: "m1", fileName: "Contrat_Production_SCP.pdf",
    fileSize: 1800000, fileType: "pdf", documentType: "contract",
    version: 1, uploadedBy: "u1", uploadedAt: "2026-01-20T09:00:00",
    tags: ["contrat", "production"], signed: true,
  },
  {
    id: "d3", matterId: "m2", fileName: "Due_Diligence_BAC_Report.docx",
    fileSize: 5200000, fileType: "docx", documentType: "other",
    version: 2, uploadedBy: "u2", uploadedAt: "2026-03-15T11:00:00",
    tags: ["due diligence", "acquisition"], signed: false,
  },
  {
    id: "d4", matterId: "m3", fileName: "Assignation_TGI_Wouri.pdf",
    fileSize: 450000, fileType: "pdf", documentType: "pleading",
    version: 1, uploadedBy: "u5", uploadedAt: "2025-11-15T10:00:00",
    tags: ["assignation", "foncier"], signed: false,
  },
  {
    id: "d5", matterId: "m2", fileName: "SPA_Draft_v1.docx",
    fileSize: 3100000, fileType: "docx", documentType: "contract",
    version: 1, uploadedBy: "u4", uploadedAt: "2026-04-02T16:00:00",
    checkedOutBy: "u4", checkedOutAt: "2026-05-30T09:00:00",
    tags: ["SPA", "acquisition"], signed: false,
  },
];

export const mockTasks: Task[] = [
  {
    id: "t1", matterId: "m1", title: "Préparer la réplique à l'exception d'incompétence",
    assignedTo: "u4", status: "inProgress", priority: "urgent",
    dueDate: "2026-06-10", createdAt: "2026-05-25T09:00:00",
    description: "Rédiger la réplique suite à l'exception soulevée par la partie adverse",
  },
  {
    id: "t2", matterId: "m2", title: "Finaliser le rapport de due diligence",
    assignedTo: "u2", status: "review", priority: "high",
    dueDate: "2026-06-15", createdAt: "2026-05-20T10:00:00",
  },
  {
    id: "t3", matterId: "m3", title: "Déposer les conclusions récapitulatives",
    assignedTo: "u5", status: "todo", priority: "high",
    dueDate: "2026-06-20", createdAt: "2026-05-28T14:00:00",
  },
  {
    id: "t4", matterId: "m1", title: "Organiser la réunion préparatoire arbitrage",
    assignedTo: "u6", status: "done", priority: "medium",
    dueDate: "2026-05-30", createdAt: "2026-05-15T09:00:00",
    completedAt: "2026-05-29T17:00:00",
  },
  {
    id: "t5", matterId: "m4", title: "Rédiger le recours gracieux au MINFI",
    assignedTo: "u5", status: "todo", priority: "medium",
    dueDate: "2026-06-30", createdAt: "2026-06-01T08:00:00",
  },
  {
    id: "t6", matterId: "m5", title: "Constituer le dossier de divorce",
    assignedTo: "u6", status: "inProgress", priority: "medium",
    dueDate: "2026-06-25", createdAt: "2026-03-22T10:00:00",
  },
  {
    id: "t7", matterId: "m7", title: "Analyse des contrats de travail individuels",
    assignedTo: "u5", status: "todo", priority: "high",
    dueDate: "2026-06-08", createdAt: "2026-05-12T09:00:00",
  },
  {
    id: "t8", title: "Renouvellement de la patente du cabinet",
    assignedTo: "u8", status: "todo", priority: "low",
    dueDate: "2026-07-31", createdAt: "2026-06-01T09:00:00",
    description: "Renouveler la patente professionnelle du cabinet pour l'exercice 2026-2027",
  },
];

export const mockTimeEntries: TimeEntry[] = [
  {
    id: "te1", matterId: "m1", userId: "u4", date: "2026-05-30",
    hours: 3.5, activity: "drafting", description: "Rédaction mémoire arbitrage",
    billable: true, billed: false, approved: true, billingRate: 45000,
  },
  {
    id: "te2", matterId: "m1", userId: "u1", date: "2026-05-30",
    hours: 1.5, activity: "review", description: "Revue du mémoire principal",
    billable: true, billed: false, approved: true, billingRate: 75000,
  },
  {
    id: "te3", matterId: "m2", userId: "u2", date: "2026-05-29",
    hours: 4, activity: "legal_research", description: "Analyse réglementaire acquisition bancaire",
    billable: true, billed: false, approved: true, billingRate: 65000,
  },
  {
    id: "te4", matterId: "m3", userId: "u5", date: "2026-05-28",
    hours: 2, activity: "court", description: "Audience TGI Wouri",
    billable: true, billed: true, approved: true, billingRate: 40000,
  },
  {
    id: "te5", matterId: "m2", userId: "u4", date: "2026-05-28",
    hours: 5, activity: "drafting", description: "Rédaction contrat SPA",
    billable: true, billed: false, approved: false, billingRate: 45000,
  },
  {
    id: "te6", matterId: "m1", userId: "u6", date: "2026-05-27",
    hours: 2, activity: "correspondence", description: "Préparation correspondances CCJA",
    billable: true, billed: false, approved: true, billingRate: 25000,
  },
  {
    id: "te7", matterId: "m5", userId: "u3", date: "2026-06-01",
    hours: 1.5, activity: "client_meeting", description: "Consultation avec Mme. Nguemo",
    billable: true, billed: false, approved: false, billingRate: 65000,
  },
];

export const mockInvoices: Invoice[] = [
  {
    id: "i1", invoiceNumber: "DK-INV-2026-001", matterId: "m6", clientId: "c6",
    invoiceDate: "2026-02-01", dueDate: "2026-03-03",
    lineItems: [
      { id: "li1", description: "Honoraires – Contrat Licence Technologique (forfait)", quantity: 1, rate: 15000000, amount: 15000000, type: "fee" },
      { id: "li2", description: "Débours et frais de greffe", quantity: 1, rate: 450000, amount: 450000, type: "expense" },
    ],
    subtotal: 15450000, taxRate: 19.25, taxAmount: 2974125, discount: 0,
    total: 18424125, amountPaid: 18424125, status: "paid", billingModel: "flatFee",
    paymentTerms: "30 jours",
  },
  {
    id: "i2", invoiceNumber: "DK-INV-2026-002", matterId: "m3", clientId: "c3",
    invoiceDate: "2026-04-01", dueDate: "2026-05-01",
    lineItems: [
      { id: "li3", description: "Honoraires temps passé – Avril 2026 (12h @ 40 000 FCFA)", quantity: 12, rate: 40000, amount: 480000, type: "time" },
      { id: "li4", description: "Frais de déplacement TGI Wouri", quantity: 1, rate: 50000, amount: 50000, type: "expense" },
    ],
    subtotal: 530000, taxRate: 19.25, taxAmount: 101525, discount: 0,
    total: 631525, amountPaid: 0, status: "overdue", billingModel: "hourly",
    paymentTerms: "30 jours",
  },
  {
    id: "i3", invoiceNumber: "DK-INV-2026-003", matterId: "m1", clientId: "c1",
    invoiceDate: "2026-05-01", dueDate: "2026-06-01",
    lineItems: [
      { id: "li5", description: "Honoraires temps passé – Arbitrage SCP (38h)", quantity: 38, rate: 60000, amount: 2280000, type: "time" },
      { id: "li6", description: "Frais CCJA et débours", quantity: 1, rate: 500000, amount: 500000, type: "expense" },
    ],
    subtotal: 2780000, taxRate: 19.25, taxAmount: 534850, discount: 0,
    total: 3314850, amountPaid: 1657425, status: "partial", billingModel: "hourly",
    paymentTerms: "30 jours",
  },
  {
    id: "i4", invoiceNumber: "DK-INV-2026-004", matterId: "m2", clientId: "c2",
    invoiceDate: "2026-05-15", dueDate: "2026-06-15",
    lineItems: [
      { id: "li7", description: "Honoraires – Due Diligence BAC (tranche 1/3)", quantity: 1, rate: 5000000, amount: 5000000, type: "fee" },
    ],
    subtotal: 5000000, taxRate: 19.25, taxAmount: 962500, discount: 250000,
    total: 5712500, amountPaid: 0, status: "sent", billingModel: "flatFee",
    paymentTerms: "30 jours",
  },
];

export const mockTrustAccounts: TrustAccount[] = [
  { id: "ta1", clientId: "c1", accountNumber: "SEQ-2026-001", balance: 50000000, currency: "XAF" },
  { id: "ta2", clientId: "c2", accountNumber: "SEQ-2026-002", balance: 10000000, currency: "XAF" },
  { id: "ta3", clientId: "c3", accountNumber: "SEQ-2024-003", balance: 5000000, currency: "XAF" },
];

export const mockTrustTransactions: TrustTransaction[] = [
  { id: "tt1", trustAccountId: "ta1", type: "deposit", amount: 50000000, date: "2026-01-20", description: "Provision arbitrage SCP", balanceAfter: 50000000, reference: "VIR-2026-001" },
  { id: "tt2", trustAccountId: "ta2", type: "deposit", amount: 10000000, date: "2026-02-05", description: "Provision acquisition BAC", balanceAfter: 10000000 },
  { id: "tt3", trustAccountId: "ta3", type: "deposit", amount: 8000000, date: "2024-09-10", description: "Provision dossier Fotso", balanceAfter: 8000000 },
  { id: "tt4", trustAccountId: "ta3", type: "withdrawal", amount: 3000000, date: "2025-04-30", description: "Imputation honoraires création holding", balanceAfter: 5000000 },
];

export const mockAuditLogs: AuditLog[] = [
  { id: "al1", userId: "u4", action: "create", entityType: "Document", entityId: "d1", timestamp: "2026-05-28T14:30:00", ipAddress: "196.201.52.14", details: "Uploaded Mémoire_Arbitrage_SCP_v3.pdf" },
  { id: "al2", userId: "u2", action: "update", entityType: "Matter", entityId: "m2", timestamp: "2026-05-29T11:00:00", ipAddress: "196.201.52.15", details: "Updated matter status to active" },
  { id: "al3", userId: "u1", action: "login", entityType: "User", entityId: "u1", timestamp: "2026-06-01T08:30:00", ipAddress: "196.201.52.10" },
  { id: "al4", userId: "u7", action: "create", entityType: "Invoice", entityId: "i4", timestamp: "2026-05-15T10:00:00", ipAddress: "196.201.52.20", details: "Created invoice DK-INV-2026-004" },
  { id: "al5", userId: "u8", action: "create", entityType: "User", entityId: "u5", timestamp: "2022-02-14T09:00:00", ipAddress: "196.201.52.01", details: "Created user account for jp.mvondo" },
];

export const mockCalendarEvents: CalendarEvent[] = [
  { id: "ev1", title: "Audience Arbitrage CCJA – SCP", type: "hearing", matterId: "m1", startDate: "2026-06-15T10:00:00", endDate: "2026-06-15T17:00:00", location: "CCJA, Abidjan", attendees: ["u1", "u4"] },
  { id: "ev2", title: "Réunion BAC – Revue Due Diligence", type: "meeting", matterId: "m2", startDate: "2026-06-10T14:00:00", endDate: "2026-06-10T16:00:00", location: "Bureaux BAC, Yaoundé", attendees: ["u2", "u4", "u6"] },
  { id: "ev3", title: "Délai dépôt conclusions – TGI Wouri", type: "deadline", matterId: "m3", startDate: "2026-06-20T23:59:00", endDate: "2026-06-20T23:59:00", attendees: ["u3", "u5"] },
  { id: "ev4", title: "Consultation Mme. Nguemo", type: "meeting", matterId: "m5", startDate: "2026-06-08T09:00:00", endDate: "2026-06-08T10:00:00", location: "Cabinet Dentons KMN, Douala", attendees: ["u3"] },
  { id: "ev5", title: "Échéance facture DK-INV-2026-004", type: "deadline", matterId: "m2", startDate: "2026-06-15T23:59:00", endDate: "2026-06-15T23:59:00", attendees: ["u7"] },
];

export const mockNotifications: Notification[] = [
  { id: "n1", type: "deadlineApproaching", message: "Délai dépôt conclusions TGI Wouri dans 19 jours", read: false, createdAt: "2026-06-01T08:00:00", entityId: "m3", entityType: "Matter" },
  { id: "n2", type: "taskAssigned", message: "Nouvelle tâche assignée: Préparer la réplique à l'exception d'incompétence", read: false, createdAt: "2026-05-25T09:00:00", entityId: "t1", entityType: "Task" },
  { id: "n3", type: "invoicePaid", message: "Facture DK-INV-2026-001 payée (18 424 125 FCFA)", read: true, createdAt: "2026-02-28T14:00:00", entityId: "i1", entityType: "Invoice" },
  { id: "n4", type: "documentUploaded", message: "Nouveau document: Mémoire_Arbitrage_SCP_v3.pdf", read: false, createdAt: "2026-05-28T14:30:00", entityId: "d1", entityType: "Document" },
];

