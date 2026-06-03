import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db, COLLECTIONS } from "../config/firebase";
import { User, Notification } from "../types";
import { clearSession, INITIAL_USERS } from "../services/authService";
import type { Session } from "../services/authService";

interface AppContextType {
  currentUser: User;
  session: Session;
  users: User[];
  setUsers: (v: User[] | ((p: User[]) => User[])) => void;
  notifications: Notification[];
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children, session }: { children: ReactNode; session: Session }) => {
  const [users, setUsersState]         = useState<User[]>([]);
  const [currentUser, setCurrentUser]  = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sidebarOpen, setSidebarOpen]  = useState(true);

  // Load users — from Firebase if configured, otherwise from local list
  useEffect(() => {
    // Always seed local users immediately so UI works without Firebase
    const localList: User[] = INITIAL_USERS.map(u => ({
      id: u.id, firstName: u.firstName, lastName: u.lastName,
      email: u.email, role: u.role, billingRate: u.billingRate,
      department: u.department, joinDate: "", active: true,
    }));
    setUsersState(localList);
    const me = localList.find(u => u.id === session.userId);
    if (me) setCurrentUser(me);

    // Also subscribe to Firebase if configured
    let unsub = () => {};
    try {
      unsub = onSnapshot(collection(db, COLLECTIONS.USERS), snap => {
        if (snap.docs.length > 0) {
          const list: User[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
          setUsersState(list);
          const me2 = list.find(u => u.id === session.userId);
          if (me2) setCurrentUser(me2);
        }
      }, () => {}); // silently ignore Firebase errors
    } catch {}
    return unsub;
  }, [session.userId]);

  const setUsers = (value: User[] | ((prev: User[]) => User[])) => {
    setUsersState(prev => {
      const next = typeof value === "function" ? value(prev) : value;
      // Persist to Firestore
      next.forEach(u => {
        const { id, ...data } = u;
        updateDoc(doc(db, COLLECTIONS.USERS, id), data).catch(() => {});
      });
      return next;
    });
  };

  const markNotificationRead = (id: string) =>
    setNotifications(prev => prev.map(n => n.id===id ? {...n,read:true} : n));

  const markAllNotificationsRead = () =>
    setNotifications(prev => prev.map(n => ({...n,read:true})));

  const logout = () => {
    clearSession();
    window.location.reload();
  };

  return (
    <AppContext.Provider value={{
      currentUser: currentUser || {
        id: session.userId, firstName: session.name.split(" ")[0], lastName: session.name.split(" ").slice(1).join(" "),
        email: session.email, role: session.role, billingRate: 0,
        joinDate: "", active: true,
      } as User,
      session,
      users,
      setUsers,
      notifications,
      sidebarOpen,
      setSidebarOpen,
      markNotificationRead,
      markAllNotificationsRead,
      logout,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};