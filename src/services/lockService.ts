import {
  doc, getDoc, setDoc, deleteDoc, serverTimestamp
} from "firebase/firestore";
import { db, COLLECTIONS } from "../config/firebase";

const LOCK_TTL_MS = 30 * 60 * 1000; // 30 minutes

export interface LockInfo {
  lockedBy: string;
  lockedByName: string;
  lockedAt: string;
}

export async function acquireLock(resourceId: string, userId: string, userName: string): Promise<{ acquired: boolean; lockedBy?: LockInfo }> {
  const lockRef = doc(db, COLLECTIONS.LOCKS, resourceId);
  try {
    const snap = await getDoc(lockRef);
    if (snap.exists()) {
      const data = snap.data();
      // Check if lock has expired
      const lockedAt = data.lockedAt?.toMillis ? data.lockedAt.toMillis() : Date.now();
      if (Date.now() - lockedAt < LOCK_TTL_MS && data.lockedBy !== userId) {
        return {
          acquired: false,
          lockedBy: { lockedBy: data.lockedBy, lockedByName: data.lockedByName, lockedAt: new Date(lockedAt).toLocaleTimeString() },
        };
      }
    }
    await setDoc(lockRef, { lockedBy: userId, lockedByName: userName, lockedAt: serverTimestamp() });
    return { acquired: true };
  } catch { return { acquired: true }; } // Fail open if Firestore unavailable
}

export async function releaseLock(resourceId: string, userId: string): Promise<void> {
  try {
    const lockRef = doc(db, COLLECTIONS.LOCKS, resourceId);
    const snap = await getDoc(lockRef);
    if (snap.exists() && snap.data().lockedBy === userId) {
      await deleteDoc(lockRef);
    }
  } catch {}
}

export async function getLockInfo(resourceId: string): Promise<LockInfo | null> {
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.LOCKS, resourceId));
    if (!snap.exists()) return null;
    const data = snap.data();
    const lockedAt = data.lockedAt?.toMillis ? data.lockedAt.toMillis() : Date.now();
    if (Date.now() - lockedAt >= LOCK_TTL_MS) return null;
    return { lockedBy: data.lockedBy, lockedByName: data.lockedByName, lockedAt: new Date(lockedAt).toLocaleTimeString() };
  } catch { return null; }
}