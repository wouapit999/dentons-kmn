import { UserRole } from "../types";

// Defines what each role can do
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
  | "audit:read";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  managingPartner: [
    "matters:read","matters:write","clients:read","clients:write",
    "documents:read","documents:write","tasks:read","tasks:write",
    "time:read","time:write","billing:read","billing:write",
    "trust:read","trust:write","reports:read","users:read","audit:read","settings:write",
  ],
  partner: [
    "matters:read","matters:write","clients:read","clients:write",
    "documents:read","documents:write","tasks:read","tasks:write",
    "time:read","time:write","billing:read","billing:write",
    "trust:read","reports:read","audit:read",
  ],
  associate: [
    "matters:read","matters:write","clients:read","clients:write",
    "documents:read","documents:write","tasks:read","tasks:write",
    "time:read","time:write","reports:read",
  ],
  paralegal: [
    "matters:read","clients:read","documents:read","documents:write",
    "tasks:read","tasks:write","time:read","time:write",
  ],
  finance: [
    "time:read","billing:read","billing:write",
    "trust:read","trust:write","reports:read",
  ],
  admin: [
    "matters:read","matters:write","clients:read","clients:write",
    "documents:read","documents:write","tasks:read","tasks:write",
    "time:read","time:write","billing:read","billing:write",
    "trust:read","trust:write","reports:read","users:read","users:write",
    "settings:write","audit:read",
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
  if (can(role,"audit:read"))     nav.push("audit");
  nav.push("settings");
  return nav;
}