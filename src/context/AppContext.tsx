import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, Notification } from "../types";

const ADMIN_USER: User = {
  id: "u1",
  firstName: "Administrator",
  lastName: "",
  email: "rwouapit@bouquet-innovation.net",
  role: "admin",
  department: "Administration",
  billingRate: 0,
  joinDate: "2026-06-01",
  active: true,
};

const STORAGE_KEY = "dentons_kmn_users";

function loadUsers(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: User[] = JSON.parse(raw);
      // Always ensure admin exists
      if (!parsed.find(u => u.id === "u1")) parsed.unshift(ADMIN_USER);
      return parsed;
    }
  } catch {}
  return [ADMIN_USER];
}

function saveUsers(users: User[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch {}
}

interface AppContextType {
  currentUser: User;
  users: User[];
  setUsers: (users: User[] | ((prev: User[]) => User[])) => void;
  notifications: Notification[];
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser] = useState<User>(ADMIN_USER);
  const [users, setUsersState] = useState<User[]>(loadUsers);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Persist users to localStorage on every change
  const setUsers = (value: User[] | ((prev: User[]) => User[])) => {
    setUsersState(prev => {
      const next = typeof value === "function" ? value(prev) : value;
      saveUsers(next);
      return next;
    });
  };

  // Sync from localStorage if another tab changes it
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try { setUsersState(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const markNotificationRead = (id: string) =>
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const markAllNotificationsRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  return (
    <AppContext.Provider value={{
      currentUser, users, setUsers,
      notifications, sidebarOpen, setSidebarOpen,
      markNotificationRead, markAllNotificationsRead,
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