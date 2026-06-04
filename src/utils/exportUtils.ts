import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const FIRM = "Dentons KMN — Kouengoua Minou Nkongho Law Firm";
const ADDR = "Douala, Cameroun | cabinet@dentons-kmn.cm";
const fmt  = (n: number) =>
  new Intl.NumberFormat("fr-CM", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

// ── Excel export ───────────────────────────────────────────────────────────
export function exportToExcel(
  data: Record<string, any>[],
  columns: { key: string; label: string }[],
  fileName: string,
  sheetName = "Report"
) {
  const header = columns.map(c => c.label);
  const rows   = data.map(row => columns.map(c => row[c.key] ?? ""));
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);

  // Column widths
  ws["!cols"] = columns.map(() => ({ wch: 20 }));

  // Style header row (bold)
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  for (let C = range.s.c; C <= range.e.c; C++) {
    const cellAddr = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!ws[cellAddr]) continue;
    ws[cellAddr].s = { font: { bold: true }, fill: { fgColor: { rgb: "0B1F3A" } } };
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

// ── PDF export ─────────────────────────────────────────────────────────────
export function exportToPDF(
  data: Record<string, any>[],
  columns: { key: string; label: string }[],
  title: string,
  fileName: string
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // Header
  doc.setFillColor(11, 31, 58);
  doc.rect(0, 0, 297, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("DENTONS KMN", 14, 12);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(ADDR, 14, 18);

  // Gold accent line
  doc.setFillColor(201, 168, 76);
  doc.rect(0, 22, 297, 1.5, "F");

  // Title
  doc.setTextColor(11, 31, 58);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 34);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleDateString("fr-CM")}`, 14, 40);

  // Table
  const head = [columns.map(c => c.label)];
  const body = data.map(row => columns.map(c => {
    const val = row[c.key];
    return val === undefined || val === null ? "" : String(val);
  }));

  autoTable(doc, {
    head,
    body,
    startY: 45,
    styles:      { fontSize: 8, cellPadding: 3 },
    headStyles:  { fillColor: [11, 31, 58], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    columnStyles: { 0: { cellWidth: "auto" } },
    margin: { left: 14, right: 14 },
  });

  // Footer
  const pages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(FIRM, 14, 200);
    doc.text(`Page ${i} of ${pages}`, 283, 200, { align: "right" });
  }

  doc.save(`${fileName}.pdf`);
}

// ── Convenience wrappers ───────────────────────────────────────────────────
export function exportInvoices(invoices: any[], clients: any[], matters: any[]) {
  const getClient = (id: string) => clients.find((c: any) => c.id === id)?.name || "—";
  const getMatter = (id: string) => matters.find((m: any) => m.id === id)?.matterId || "—";
  const data = invoices.map(inv => ({
    number:   inv.invoiceNumber,
    client:   getClient(inv.clientId),
    matter:   getMatter(inv.matterId),
    date:     inv.invoiceDate,
    due:      inv.dueDate,
    total:    fmt(inv.total),
    paid:     fmt(inv.amountPaid),
    balance:  fmt(inv.total - inv.amountPaid),
    status:   inv.status,
    terms:    inv.paymentTerms,
  }));
  const cols = [
    { key:"number",  label:"Invoice #" },
    { key:"client",  label:"Client" },
    { key:"matter",  label:"Matter" },
    { key:"date",    label:"Invoice Date" },
    { key:"due",     label:"Due Date" },
    { key:"total",   label:"Total" },
    { key:"paid",    label:"Paid" },
    { key:"balance", label:"Balance Due" },
    { key:"status",  label:"Status" },
  ];
  return { data, cols };
}

export function exportExpenses(expenses: any[], matters: any[], users: any[]) {
  const getMatter = (id: string) => matters.find((m: any) => m.id === id)?.matterId || "—";
  const getUser   = (id: string) => { const u = users.find((u: any) => u.id === id); return u ? `${u.firstName} ${u.lastName}` : "—"; };
  const data = expenses.map(e => ({
    date:       e.date,
    category:   (e.category || "").replace("_"," "),
    description:e.description,
    matter:     getMatter(e.matterId),
    by:         getUser(e.userId),
    amount:     fmt(e.amount),
    billable:   e.billable ? "Yes" : "No",
    status:     e.approved ? "Approved" : e.billed ? "Billed" : "Pending",
  }));
  const cols = [
    { key:"date",        label:"Date" },
    { key:"category",    label:"Category" },
    { key:"description", label:"Description" },
    { key:"matter",      label:"Matter" },
    { key:"by",          label:"By" },
    { key:"amount",      label:"Amount" },
    { key:"billable",    label:"Billable" },
    { key:"status",      label:"Status" },
  ];
  return { data, cols };
}

export function exportPayments(payments: any[], invoices: any[], clients: any[]) {
  const getClient  = (id: string) => clients.find((c: any) => c.id === id)?.name || "—";
  const getInvoice = (id: string) => invoices.find((i: any) => i.id === id)?.invoiceNumber || "—";
  const data = payments.map(p => ({
    receipt:   p.receiptNumber || p.id.slice(-6),
    client:    getClient(p.clientId),
    invoice:   getInvoice(p.invoiceId),
    date:      p.date,
    method:    p.method,
    amount:    fmt(p.amount),
    reference: p.reference || "—",
  }));
  const cols = [
    { key:"receipt",   label:"Receipt #" },
    { key:"client",    label:"Client" },
    { key:"invoice",   label:"Invoice" },
    { key:"date",      label:"Date" },
    { key:"method",    label:"Method" },
    { key:"amount",    label:"Amount" },
    { key:"reference", label:"Reference" },
  ];
  return { data, cols };
}

export function exportPLReport(data: Record<string, any>[]) {
  const cols = [
    { key:"category", label:"Category" },
    { key:"amount",   label:"Amount" },
  ];
  return { data, cols };
}

export function exportMatterProfitability(matters: any[], invoices: any[], expenses: any[], clients: any[]) {
  const getClient = (id: string) => clients.find((c: any) => c.id === id)?.name || "—";
  const data = matters
    .filter(m => invoices.some((i: any) => i.matterId === m.id) || expenses.some((e: any) => e.matterId === m.id))
    .map(m => {
      const mI   = invoices.filter((i: any) => i.matterId === m.id);
      const mB   = mI.reduce((s: number, i: any) => s + i.total, 0);
      const mC   = mI.reduce((s: number, i: any) => s + i.amountPaid, 0);
      const mE   = expenses.filter((e: any) => e.matterId === m.id).reduce((s: number, e: any) => s + e.amount, 0);
      return {
        matter:    m.title,
        ref:       m.matterId,
        client:    getClient(m.clientId),
        billed:    fmt(mB),
        collected: fmt(mC),
        expenses:  fmt(mE),
        net:       fmt(mC - mE),
      };
    });
  const cols = [
    { key:"matter",    label:"Matter" },
    { key:"ref",       label:"Ref" },
    { key:"client",    label:"Client" },
    { key:"billed",    label:"Billed" },
    { key:"collected", label:"Collected" },
    { key:"expenses",  label:"Expenses" },
    { key:"net",       label:"Net" },
  ];
  return { data, cols };
}
