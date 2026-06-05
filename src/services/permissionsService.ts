import { UserRole } from "../types";

export type Permission =
  | "matters:read" | "matters:write"
  | "clients:read" | "clients:write"
  | "documents:read" | "documents:write"
  | "tasks:read" | "tasks:write"
  | "time:read" | "time:write"
  | "billing:read" | "billing:write"
  | "trust:read" | "trust:write"
  | "reports:read"
  | "users:read" | "users:write"
  | "settings:write"
  | "audit:read"
  | "expenses:submit" | "expenses:approve";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  managingPartner: [
    "matters:read","matters:write","clients:read","clients:write",
    "documents:read","documents:write","tasks:read","tasks:write",
    "time:read","time:write","billing:read","billing:write",
    "trust:read","trust:write","reports:read","users:read",
    "expenses:submit","expenses:approve",
    // Settings & audit restricted to Admin + Finance only
  ],
  partner: [
    "matters:read","matters:write","clients:read","clients:write",
    "documents:read","documents:write","tasks:read","tasks:write",
    "time:read","time:write","billing:read","billing:write",
    "trust:read","reports:read","expenses:submit",
  ],
  associate: [
    "matters:read","matters:write","clients:read","clients:write",
    "documents:read","documents:write","tasks:read","tasks:write",
    "time:read","time:write","reports:read","expenses:submit",
  ],
  paralegal: [
    "matters:read","clients:read","documents:read","documents:write",
    "tasks:read","tasks:write","time:read","time:write","expenses:submit",
  ],
  finance: [
    "time:read","billing:read","billing:write",
    "trust:read","trust:write","reports:read",
    "audit:read","settings:write",          // Finance sees audit + settings
    "expenses:submit","expenses:approve",   // Finance approves expenses
  ],
  admin: [
    "matters:read","matters:write","clients:read","clients:write",
    "documents:read","documents:write","tasks:read","tasks:write",
    "time:read","time:write","billing:read","billing:write",
    "trust:read","trust:write","reports:read","users:read","users:write",
    "settings:write","audit:read",
    "expenses:submit","expenses:approve",
  ],
  client: ["matters:read","documents:read","billing:read"],
};

export function can(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getNavItems(role: UserRole): string[] {
  const nav: string[] = ["dashboard"];
  if (can(role,"matters:read"))   nav.push("matters");
  if (can(role,"clients:read"))   nav.push("clients");
  if (can(role,"documents:read")) nav.push("documents");
  if (can(role,"tasks:read"))     nav.push("tasks");
  if (can(role,"tasks:read"))     nav.push("calendar");
  if (can(role,"time:read"))      nav.push("time");
  if (can(role,"billing:read"))   nav.push("billing");
  if (can(role,"trust:read"))     nav.push("trust");
  if (can(role,"reports:read"))   nav.push("reports");
  if (can(role,"users:read"))     nav.push("users");
  // Audit Log: Admin + Finance only
  // Expenses: everyone with expenses:submit
  if (can(role,"expenses:submit")) nav.push("expenses");
  if (can(role,"audit:read"))     nav.push("audit");
  // Settings: Admin + Finance only
  if (can(role,"settings:write")) nav.push("settings");
  return nav;
}
