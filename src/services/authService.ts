import { doc, setDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db, COLLECTIONS } from "../config/firebase";
import { UserRole } from "../types";

// ── Password hashing ──────────────────────────────────────────────────────────
async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text + "DENTONS_KMN_SALT_2026");
  const buf  = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
}
export async function hashPwd(password: string): Promise<string> {
  return sha256(password);
}

// ── Local password overrides (admin-changed passwords stored locally) ─────────
// Key: email → hashed password. This is the most reliable layer.
const OVERRIDES_KEY = "dkmn_pwd_overrides";

function getOverrides(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(OVERRIDES_KEY) || "{}"); } catch { return {}; }
}

export function savePasswordOverride(email: string, hash: string) {
  const o = getOverrides();
  o[email.toLowerCase()] = hash;
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(o));
}

function getOverrideHash(email: string): string | null {
  return getOverrides()[email.toLowerCase()] || null;
}

// ── Session ───────────────────────────────────────────────────────────────────
const SESSION_KEY = "dkmn_session";
export interface Session { userId: string; email: string; role: UserRole; name: string; }
export function getSession(): Session | null {
  try { const r = localStorage.getItem(SESSION_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}
export function setSession(s: Session) { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); }
export function clearSession()         { localStorage.removeItem(SESSION_KEY); }

// ── Local login-activity log ──────────────────────────────────────────────────
const ACTIVITY_KEY = "dkmn_login_activity";
export interface LoginRecord { userId: string; email: string; name: string; at: string; }

export function recordLogin(session: Session) {
  try {
    const prev: LoginRecord[] = JSON.parse(localStorage.getItem(ACTIVITY_KEY) || "[]");
    prev.unshift({ userId: session.userId, email: session.email, name: session.name, at: new Date().toISOString() });
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(prev.slice(0, 200)));
  } catch {}
}

export function getLoginActivity(): LoginRecord[] {
  try { return JSON.parse(localStorage.getItem(ACTIVITY_KEY) || "[]"); } catch { return []; }
}

// ── All 17 users (hardcoded fallback) ─────────────────────────────────────────
export const INITIAL_USERS: Array<{
  id:string; firstName:string; lastName:string; email:string;
  role:UserRole; billingRate:number; department:string; password:string;
}> = [
  { id:"u1",  firstName:"KOUENGOUA",  lastName:"",           email:"kouengoua@dentons.com",         role:"managingPartner", billingRate:75000, department:"Management",  password:"7772608" },
  { id:"u2",  firstName:"Sterling",   lastName:"MINOU",      email:"sterling.minou@dentons.com",    role:"managingPartner", billingRate:75000, department:"Management",  password:"9104505" },
  { id:"u3",  firstName:"Agbor",      lastName:"Nkongho T.", email:"nkongho.agbor@dentons.com",     role:"managingPartner", billingRate:75000, department:"Management",  password:"9339193" },
  { id:"u4",  firstName:"Nadine",     lastName:"YANOU",      email:"nadine.bethmba@dentons.com",    role:"partner",         billingRate:65000, department:"Corporate",   password:"1714140" },
  { id:"u5",  firstName:"Philippe",   lastName:"KOUENGOUA",  email:"philippe.kouengoua@dentons.com",role:"partner",         billingRate:65000, department:"Litigation",  password:"9167951" },
  { id:"u6",  firstName:"Joel",       lastName:"NGAMI",      email:"joel.ngami@dentons.com",        role:"partner",         billingRate:65000, department:"Banking",     password:"4839763" },
  { id:"u7",  firstName:"Maxime",     lastName:"MINOU",      email:"maxime.minou@dentons.com",      role:"partner",         billingRate:65000, department:"Tax",         password:"3641584" },
  { id:"u8",  firstName:"Arrey",      lastName:"Arrey-AKO",  email:"arrey.ako@dentons.com",         role:"associate",       billingRate:45000, department:"Litigation",  password:"1277692" },
  { id:"u9",  firstName:"Kevin",      lastName:"FOYOU",      email:"kevin.foyou@dentons.com",       role:"associate",       billingRate:40000, department:"Corporate",   password:"1007691" },
  { id:"u10", firstName:"Steve",      lastName:"BASSOU",     email:"steve.bassou@dentons.com",      role:"associate",       billingRate:40000, department:"Arbitration", password:"6784651" },
  { id:"u11", firstName:"Tina",       lastName:"KOTI",       email:"tina.koti@dentons.com",         role:"paralegal",       billingRate:25000, department:"Support",     password:"6630077" },
  { id:"u12", firstName:"Michelle",   lastName:"NANGA",      email:"michelle.nanga@dentons.com",    role:"paralegal",       billingRate:25000, department:"Support",     password:"2169886" },
  { id:"u13", firstName:"Felicity",   lastName:"NGANU",      email:"felicity.nganu@dentons.com",    role:"paralegal",       billingRate:25000, department:"Support",     password:"6106378" },
  { id:"u14", firstName:"Desire",     lastName:"NZEGA",      email:"desire.nzega@dentons.com",      role:"paralegal",       billingRate:25000, department:"Support",     password:"3174700" },
  { id:"u15", firstName:"Christian",  lastName:"Ekwe",       email:"christian.ekwe@dentons.com",    role:"finance",         billingRate:0,     department:"Finance",     password:"9638692" },
  { id:"u16", firstName:"Bangoup",    lastName:"Loic",       email:"loic.bangoup@dentons.com",      role:"associate",       billingRate:40000, department:"Employment",  password:"4505232" },
  { id:"u17", firstName:"Roland",     lastName:"Wouapit",    email:"roland.wouapit@dentons.com",    role:"admin",           billingRate:0,     department:"IT",          password:"4133648" },
];

// ── LOGIN — 3-layer password check ────────────────────────────────────────────
export async function login(
  email:    string,
  password: string
): Promise<{ success: boolean; session?: Session; error?: string }> {

  const e = email.trim().toLowerCase();
  const p = password.trim();

  // Find the user in the hardcoded list first (identifies the user, always works)
  const localUser = INITIAL_USERS.find(u => u.email.toLowerCase() === e);
  if (!localUser) {
    return { success: false, error: "Email address not found. Please check and try again." };
  }

  // ── Layer 1: Local password overrides (set by admin via change-password) ───
  // This is the MOST RELIABLE layer — stored in localStorage, instant, no network.
  const overrideHash = getOverrideHash(e);
  if (overrideHash) {
    const inputHash = await hashPwd(p);
    if (inputHash !== overrideHash) {
      return { success: false, error: "Incorrect password. Please try again." };
    }
    // Password matched override — log in
    return buildSession(localUser, p);
  }

  // ── Layer 2: Firestore password (may have been changed via admin panel) ────
  try {
    const snap = await Promise.race([
      getDocs(query(collection(db, COLLECTIONS.USERS), where("email", "==", e))),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
    ]);

    if (snap && typeof snap === "object" && "docs" in snap && !snap.empty) {
      const data = snap.docs[0].data() as Record<string, any>;

      // Check if account is deactivated
      if (data.active === false) {
        return { success: false, error: "Account is deactivated. Contact the Administrator." };
      }

      if (data.passwordHash) {
        const inputHash = await hashPwd(p);
        if (inputHash !== data.passwordHash) {
          // Wrong password — don't fall through to hardcoded!
          return { success: false, error: "Incorrect password. Please try again." };
        }
        // ✅ Firestore password matched — save as override for future offline use
        savePasswordOverride(e, data.passwordHash);
        return buildSession(localUser, p, data);
      }
    }
  } catch {
    // Firestore unavailable — fall through to hardcoded
  }

  // ── Layer 3: Hardcoded original password (offline fallback) ───────────────
  if (localUser.password !== p) {
    return { success: false, error: "Incorrect password. Please try again." };
  }

  // Hash and save for future use
  const hash = await hashPwd(p);
  savePasswordOverride(e, hash);

  return buildSession(localUser, p);
}

function buildSession(
  localUser: typeof INITIAL_USERS[0],
  _password: string,
  firestoreData?: Record<string, any>
): { success: boolean; session: Session } {
  const session: Session = {
    userId: localUser.id,
    email:  localUser.email,
    role:   (firestoreData?.role as UserRole) || localUser.role,
    name:   firestoreData
      ? `${firestoreData.firstName || localUser.firstName} ${firestoreData.lastName || localUser.lastName}`.trim()
      : `${localUser.firstName} ${localUser.lastName}`.trim(),
  };
  setSession(session);
  recordLogin(session);

  // Update Firestore lastLogin in background
  try {
    getDocs(query(collection(db, COLLECTIONS.USERS), where("email", "==", localUser.email)))
      .then(snap => {
        if (!snap.empty) {
          updateDoc(doc(db, COLLECTIONS.USERS, snap.docs[0].id), {
            lastLogin: new Date().toISOString(),
          }).catch(() => {});
        }
      }).catch(() => {});
  } catch {}

  return { success: true, session };
}

// ── Seed users into Firestore ─────────────────────────────────────────────────
async function syncToFirebase(user: typeof INITIAL_USERS[0]): Promise<void> {
  try {
    const pwdHash = await hashPwd(user.password);
    await setDoc(doc(db, COLLECTIONS.USERS, user.id), {
      firstName: user.firstName, lastName: user.lastName,
      email: user.email.toLowerCase(), role: user.role,
      billingRate: user.billingRate, department: user.department,
      passwordHash: pwdHash, active: true,
      joinDate: new Date().toISOString().split("T")[0],
      lastLogin: null, forcePasswordChange: false,
    }, { merge: true });
  } catch {}
}

export async function seedUsersIfNeeded(): Promise<void> {
  try {
    for (const u of INITIAL_USERS) { await syncToFirebase(u); }
  } catch {}
}

// ── Change password (updates Firestore + local override) ─────────────────────
export async function changePassword(userId: string, email: string, newPassword: string): Promise<boolean> {
  try {
    const hash = await hashPwd(newPassword.trim());
    // Save to Firestore
    await updateDoc(doc(db, COLLECTIONS.USERS, userId), { passwordHash: hash, forcePasswordChange: false });
    // Save to local override so it works immediately without network
    savePasswordOverride(email.toLowerCase(), hash);
    return true;
  } catch { return false; }
}
