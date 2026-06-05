import { doc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { db, COLLECTIONS } from "../config/firebase";
import { UserRole } from "../types";

// ── Password hashing ───────────────────────────────────────────────────────
async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text + "DENTONS_KMN_SALT_2026");
  const buf  = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
}
export async function hashPwd(password: string): Promise<string> {
  return sha256(password);
}

// ── Session ────────────────────────────────────────────────────────────────
const SESSION_KEY = "dkmn_session";
export interface Session { userId: string; email: string; role: UserRole; name: string; }
export function getSession(): Session | null {
  try { const r = localStorage.getItem(SESSION_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}
export function setSession(s: Session) { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); }
export function clearSession() { localStorage.removeItem(SESSION_KEY); }

// ── All 17 users (hardcoded from Excel — always available, no network needed) ─
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

// ── LOGIN ─────────────────────────────────────────────────────────────────
// Priority:
//   1. Firestore (has latest passwords set by admin)
//   2. Hardcoded list fallback (works offline, uses original passwords)
export async function login(
  email: string,
  password: string
): Promise<{ success: boolean; session?: Session; error?: string }> {

  const e = email.trim().toLowerCase();
  const p = password.trim();

  // ── Step 1: Try Firestore first (5-second timeout) ──────────────────────
  try {
    const q    = query(collection(db, COLLECTIONS.USERS), where("email", "==", e));
    const snap = await Promise.race([
      getDocs(q),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)),
    ]) as Awaited<ReturnType<typeof getDocs>>;

    if (!snap.empty) {
      const userDoc  = snap.docs[0];
      const userData = userDoc.data() as Record<string, any>;

      if (!userData.active) {
        return { success: false, error: "Account is deactivated. Contact the Administrator." };
      }

      // Check hashed password (set by admin via change-password)
      if (userData.passwordHash) {
        const inputHash = await hashPwd(p);
        if (inputHash !== userData.passwordHash) {
          return { success: false, error: "Incorrect password. Please try again." };
        }
      } else {
        // No hash in Firestore yet — check against hardcoded plain-text fallback
        const localUser = INITIAL_USERS.find(u => u.email.toLowerCase() === e);
        if (!localUser || localUser.password !== p) {
          return { success: false, error: "Incorrect password. Please try again." };
        }
        // Store the hash now for future logins
        const hash = await hashPwd(p);
        updateDoc(doc(db, COLLECTIONS.USERS, userDoc.id), { passwordHash: hash }).catch(() => {});
      }

      // Update lastLogin
      updateDoc(doc(db, COLLECTIONS.USERS, userDoc.id), {
        lastLogin: new Date().toISOString(),
      }).catch(() => {});

      const session: Session = {
        userId: userDoc.id,
        email:  userData.email,
        role:   userData.role as UserRole,
        name:   `${userData.firstName} ${userData.lastName || ""}`.trim(),
      };
      setSession(session);
      return { success: true, session };
    }
    // User not in Firestore yet — fall through to hardcoded list
  } catch {
    // Firestore unavailable — fall through to hardcoded list
  }

  // ── Step 2: Hardcoded fallback (offline / first time before sync) ────────
  const localUser = INITIAL_USERS.find(u => u.email.toLowerCase() === e);
  if (!localUser) {
    return { success: false, error: "Email address not found. Please check and try again." };
  }

  if (localUser.password !== p) {
    return { success: false, error: "Incorrect password. Please try again." };
  }

  const session: Session = {
    userId: localUser.id,
    email:  localUser.email,
    role:   localUser.role,
    name:   `${localUser.firstName} ${localUser.lastName}`.trim(),
  };
  setSession(session);

  // Sync to Firebase in background
  syncToFirebase(localUser).catch(() => {});

  return { success: true, session };
}

// ── Background Firebase sync (does NOT block login) ────────────────────────
async function syncToFirebase(user: typeof INITIAL_USERS[0]): Promise<void> {
  try {
    const pwdHash = await hashPwd(user.password);
    await setDoc(doc(db, COLLECTIONS.USERS, user.id), {
      firstName: user.firstName, lastName: user.lastName,
      email: user.email.toLowerCase(), role: user.role,
      billingRate: user.billingRate, department: user.department,
      passwordHash: pwdHash, active: true,
      joinDate: new Date().toISOString().split("T")[0],
      lastLogin: serverTimestamp(),
      forcePasswordChange: false,
    }, { merge: true });
  } catch { /* Firebase unavailable — silently ignore */ }
}

// ── Seed all users into Firebase (called once on app start) ───────────────
export async function seedUsersIfNeeded(): Promise<void> {
  try {
    for (const u of INITIAL_USERS) {
      await syncToFirebase(u);
    }
  } catch { /* silently ignore */ }
}

// ── Change password (admin only) ──────────────────────────────────────────
export async function changePassword(userId: string, newPassword: string): Promise<boolean> {
  try {
    const hash = await hashPwd(newPassword);
    await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
      passwordHash: hash, forcePasswordChange: false,
    });
    return true;
  } catch { return false; }
}