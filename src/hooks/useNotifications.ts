import { useEffect, useRef, useCallback } from "react";
import { Task, CalendarEvent } from "../types";

const NOTIF_KEY  = "dkmn_sent_notifs";
const CHECK_MS   = 60_000; // check every 60 seconds
const REMIND_MIN = 10;     // remind X minutes before

export interface AppNotification {
  id:      string;
  type:    "reminder" | "overdue" | "missed";
  title:   string;
  body:    string;
  entityId: string;
  entityType: "task" | "event";
  at:      Date;
  read:    boolean;
}

// ── Track which notifications have already been sent ──────────────────────
function getSentIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(NOTIF_KEY) || "[]")); }
  catch { return new Set(); }
}
function markSent(id: string) {
  const s = getSentIds();
  s.add(id);
  // Keep only last 500
  const arr = Array.from(s).slice(-500);
  localStorage.setItem(NOTIF_KEY, JSON.stringify(arr));
}

// ── Request browser notification permission ───────────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

// ── Fire a browser notification ────────────────────────────────────────────
function fireBrowserNotif(title: string, body: string, icon?: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, {
      body,
      icon: icon || "/favicon.ico",
      badge: "/favicon.ico",
      tag: title + body,
    });
    n.onclick = () => { window.focus(); n.close(); };
    setTimeout(() => n.close(), 8000);
  } catch {}
}

// ── Main notification hook ────────────────────────────────────────────────
export function useNotifications(
  tasks:          Task[],
  calendarEvents: CalendarEvent[],
  currentUserId:  string,
  lang:           string,
  onNewNotif:     (n: AppNotification) => void
) {
  const tasksRef  = useRef(tasks);
  const eventsRef = useRef(calendarEvents);
  const langRef   = useRef(lang);

  useEffect(() => { tasksRef.current  = tasks;  }, [tasks]);
  useEffect(() => { eventsRef.current = calendarEvents; }, [calendarEvents]);
  useEffect(() => { langRef.current   = lang; }, [lang]);

  const isFr = () => langRef.current === "fr";

  const check = useCallback(() => {
    const now     = new Date();
    const sent    = getSentIds();
    const remind  = REMIND_MIN * 60_000; // ms

    // ── Check TASKS ───────────────────────────────────────────────────────
    tasksRef.current.forEach(task => {
      if (task.status === "done" || task.status === "cancelled") return;
      // Notify all assignees (multi-user support)
      const assignees = task.assignees?.length ? task.assignees : (task.assignedTo ? [task.assignedTo] : []);
      if (!assignees.includes(currentUserId)) return;
      const due = new Date(task.dueDate + "T23:59:59");

      // 10-minute reminder (fire once when due is within 10 min from now)
      const reminderKey = `reminder_task_${task.id}`;
      if (!sent.has(reminderKey) && due.getTime() - now.getTime() <= remind && due.getTime() > now.getTime()) {
        const title = isFr() ? "⏰ Rappel de Tâche" : "⏰ Task Reminder";
        const body  = isFr()
          ? `Tâche "${task.title}" — Échéance dans moins de ${REMIND_MIN} minutes`
          : `Task "${task.title}" — Due in less than ${REMIND_MIN} minutes`;
        fireBrowserNotif(title, body);
        markSent(reminderKey);
        onNewNotif({ id: reminderKey, type:"reminder", title, body, entityId:task.id, entityType:"task", at:new Date(), read:false });
      }

      // Overdue notification (fire once when due has passed)
      const overdueKey = `overdue_task_${task.id}`;
      if (!sent.has(overdueKey) && due.getTime() < now.getTime()) {
        const title = isFr() ? "🔴 Tâche en Retard" : "🔴 Overdue Task";
        const body  = isFr()
          ? `Tâche "${task.title}" n'a pas été complétée à temps`
          : `Task "${task.title}" was not completed on time`;
        fireBrowserNotif(title, body);
        markSent(overdueKey);
        onNewNotif({ id: overdueKey, type:"overdue", title, body, entityId:task.id, entityType:"task", at:new Date(), read:false });
      }
    });

    // ── Check CALENDAR EVENTS ─────────────────────────────────────────────
    eventsRef.current.forEach(event => {
      // Only notify attendees that include the current user
      if (event.attendees.length > 0 && !event.attendees.includes(currentUserId)) return;
      const start = new Date(event.startDate);

      // 10-minute reminder
      const reminderKey = `reminder_event_${event.id}`;
      if (!sent.has(reminderKey) && start.getTime() - now.getTime() <= remind && start.getTime() > now.getTime()) {
        const label = isFr() ? (event.type === "courtDate" ? "Audience" : event.type === "deadline" ? "Délai" : "Réunion") : (event.type === "courtDate" ? "Court Date" : event.type === "deadline" ? "Deadline" : "Meeting");
        const title = isFr() ? `⏰ Rappel — ${label}` : `⏰ Reminder — ${label}`;
        const body  = isFr()
          ? `"${event.title}" — Dans moins de ${REMIND_MIN} minutes${event.location ? ` · ${event.location}` : ""}`
          : `"${event.title}" — Starts in less than ${REMIND_MIN} minutes${event.location ? ` · ${event.location}` : ""}`;
        fireBrowserNotif(title, body);
        markSent(reminderKey);
        onNewNotif({ id: reminderKey, type:"reminder", title, body, entityId:event.id, entityType:"event", at:new Date(), read:false });
      }

      // Missed event notification (fires once, 5 min after start)
      const missedKey = `missed_event_${event.id}`;
      const fiveMinAfter = start.getTime() + 5 * 60_000;
      if (!sent.has(missedKey) && event.type === "deadline" && now.getTime() > fiveMinAfter) {
        const title = isFr() ? "⚠️ Délai Dépassé" : "⚠️ Deadline Passed";
        const body  = isFr()
          ? `Le délai "${event.title}" est dépassé`
          : `Deadline "${event.title}" has passed`;
        fireBrowserNotif(title, body);
        markSent(missedKey);
        onNewNotif({ id: missedKey, type:"missed", title, body, entityId:event.id, entityType:"event", at:new Date(), read:false });
      }
    });
  }, [currentUserId, onNewNotif]);

  // Run immediately and then every minute
  useEffect(() => {
    requestNotificationPermission();
    check();
    const interval = setInterval(check, CHECK_MS);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
