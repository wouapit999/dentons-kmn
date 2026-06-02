import {
  collection, doc, getDocs, setDoc, updateDoc, query, where, serverTimestamp
} from "firebase/firestore";
import { db, COLLECTIONS } from "../config/firebase";
import { UserRole } from "../types";

async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(password + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2,"0")).join("");
}
const SALT = "DENTONS_KMN_SALT_2026";
export async function hashPwd(password: string): Promise<string> {
  return hashPassword(password, SALT);
}

const SESSION_KEY = "dkmn_session";
export interface Session { userId: string; email: string; role: UserRole; name: string; }
export function getSession(): Session | null {
  try { const raw = localStorage.getItem(SESSION_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
export function setSession(session: Session) { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); }
export function clearSession() { localStorage.removeItem(SESSION_KEY); }

export async function login(email: string, password: string): Promise<{ success: boolean; session?: Session; error?: string }> {
  try {
    const q = query(collection(db, COLLECTIONS.USERS), where("email", "==", email.toLowerCase().trim()));
    const snap = await getDocs(q);
    if (snap.empty) return { success: false, error: "Email address not found." };
    const userDoc = snap.docs[0];
    const userData = userDoc.data();
    if (!userData.active) return { success: false, error: "Account deactivated. Contact the administrator." };
    const hashed = await hashPwd(password);
    if (userData.passwordHash !== hashed) return { success: false, error: "Incorrect password." };
    await updateDoc(doc(db, COLLECTIONS.USERS, userDoc.id), { lastLogin: serverTimestamp() });
    await setDoc(doc(collection(db, COLLECTIONS.AUDIT_LOGS)), {
      userId: userDoc.id, action: "login", entityType: "User",
      entityId: userDoc.id, timestamp: new Date().toISOString(), ipAddress: "—",
    });
    const session: Session = { userId: userDoc.id, email: userData.email, role: userData.role, name: `${userData.firstName} ${userData.lastName}`.trim() };
    setSession(session);
    return { success: true, session };
  } catch (err: any) {
    console.error("Login error:", err);
    if (err?.code === "unavailable" || String(err).includes("offline") || String(err).includes("network")) {
      return { success: false, error: "Cannot connect to server. Check your internet connection." };
    }
    return { success: false, error: "Login failed. Please try again." };
  }
}

export const INITIAL_USERS: Array<{ id:string; firstName:string; lastName:string; email:string; role:UserRole; billingRate:number; department:string; password:string; }> = [
  { id:"u1",  firstName:"KOUENGOUA",  lastName:"",          email:"kouengoua@dentons.com",         role:"managingPartner", billingRate:75000, department:"Management",  password:"9006714" },
  { id:"u2",  firstName:"Sterling",   lastName:"MINOU",     email:"sterling.minou@dentons.com",    role:"managingPartner", billingRate:75000, department:"Management",  password:"8521347" },
  { id:"u3",  firstName:"Agbor",      lastName:"Nkongho T.",email:"nkongho.agbor@dentons.com",     role:"managingPartner", billingRate:75000, department:"Management",  password:"2241918" },
  { id:"u4",  firstName:"Nadine",     lastName:"YANOU",     email:"nadine.bethmba@dentons.com",    role:"partner",         billingRate:65000, department:"Corporate",   password:"8059549" },
  { id:"u5",  firstName:"Philippe",   lastName:"KOUENGOUA", email:"philippe.kouengoua@dentons.com",role:"partner",         billingRate:65000, department:"Litigation",  password:"3419299" },
  { id:"u6",  firstName:"Joel",       lastName:"NGAMI",     email:"joel.ngami@dentons.com",        role:"partner",         billingRate:65000, department:"Banking",     password:"7886378" },
  { id:"u7",  firstName:"Maxime",     lastName:"MINOU",     email:"maxime.minou@dentons.com",      role:"partner",         billingRate:65000, department:"Tax",         password:"3092765" },
  { id:"u8",  firstName:"Arrey",      lastName:"Arrey-AKO", email:"arrey.ako@dentons.com",         role:"associate",       billingRate:45000, department:"Litigation",  password:"2915564" },
  { id:"u9",  firstName:"Kevin",      lastName:"FOYOU",     email:"kevin.foyou@dentons.com",       role:"associate",       billingRate:40000, department:"Corporate",   password:"6594005" },
  { id:"u10", firstName:"Steve",      lastName:"BASSOU",    email:"steve.bassou@dentons.com",      role:"associate",       billingRate:40000, department:"Arbitration", password:"2246903" },
  { id:"u11", firstName:"Tina",       lastName:"KOTI",      email:"tina.koti@dentons.com",         role:"paralegal",       billingRate:25000, department:"Support",     password:"9309608" },
  { id:"u12", firstName:"Michelle",   lastName:"NANGA",     email:"michelle.nanga@dentons.com",    role:"paralegal",       billingRate:25000, department:"Support",     password:"3608969" },
  { id:"u13", firstName:"Felicity",   lastName:"NGANU",     email:"felicity.nganu@dentons.com",    role:"paralegal",       billingRate:25000, department:"Support",     password:"6733630" },
  { id:"u14", firstName:"Desire",     lastName:"NZEGA",     email:"desire.nzega@dentons.com",      role:"paralegal",       billingRate:25000, department:"Support",     password:"8105284" },
  { id:"u15", firstName:"Christian",  lastName:"Ekwe",      email:"christian.ekwe@dentons.com",    role:"finance",         billingRate:0,     department:"Finance",     password:"1904714" },
  { id:"u16", firstName:"Bangoup",    lastName:"Loic",      email:"loic.bangoup@dentons.com",      role:"associate",       billingRate:40000, department:"Employment",  password:"5690140" },
  { id:"u17", firstName:"Roland",     lastName:"Wouapit",   email:"roland.wouapit@dentons.com",    role:"admin",           billingRate:0,     department:"IT",          password:"2890998" },
];

export async function seedUsersIfNeeded(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.USERS));
    if (snap.size >= INITIAL_USERS.length) return;
    for (const u of INITIAL_USERS) {
      const pwdHash = await hashPwd(u.password);
      await setDoc(doc(db, COLLECTIONS.USERS, u.id), {
        firstName: u.firstName, lastName: u.lastName, email: u.email.toLowerCase(),
        role: u.role, billingRate: u.billingRate, department: u.department,
        passwordHash: pwdHash, active: true,
        joinDate: new Date().toISOString().split("T")[0], lastLogin: null,
        forcePasswordChange: false,
      });
    }
  } catch (err) { console.error("Seed error:", err); }
}

export async function changePassword(userId: string, newPassword: string): Promise<boolean> {
  try {
    const hash = await hashPwd(newPassword);
    await updateDoc(doc(db, COLLECTIONS.USERS, userId), { passwordHash: hash, forcePasswordChange: false });
    return true;
  } catch { return false; }
}