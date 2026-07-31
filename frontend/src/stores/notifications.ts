import { io, type Socket } from "socket.io-client";
import { defineStore } from "pinia";
import { auditApiHost } from "../audit-service";

export type AuditLogNotification = {
  event_id: string;
  event_type: string;
  book_snapshot: { title?: unknown };
};

type NotificationState = {
  notifications: AuditLogNotification[];
  userId: number | null;
};

let socket: Socket | undefined;

export const useNotificationStore = defineStore("notifications", {
  state: (): NotificationState => ({ notifications: [], userId: null }),

  getters: {
    unreadCount: (state) => state.notifications.length,
  },

  actions: {
    connect(userId: number, token: string): void {
      if (this.userId !== userId) {
        this.disconnect();
        this.userId = userId;
        this.notifications = storedNotifications(userId);
      }

      if (socket !== undefined) return;

      socket = io(auditApiHost, {
        auth: { authorization: `Bearer ${token}` },
      });
      socket.on("audit.log.created", (auditLog: unknown) => {
        if (isAuditLogNotification(auditLog)) this.add(auditLog);
      });
    },

    add(auditLog: AuditLogNotification): void {
      if (
        this.userId === null ||
        this.notifications.some(
          (notification) => notification.event_id === auditLog.event_id,
        )
      ) {
        return;
      }

      this.notifications.unshift(auditLog);
      saveNotifications(this.userId, this.notifications);
    },

    clear(): void {
      const userId = this.userId;

      this.disconnect();
      this.notifications = [];
      this.userId = null;
      if (userId !== null) localStorage.removeItem(notificationKey(userId));
    },

    disconnect(): void {
      socket?.disconnect();
      socket = undefined;
    },
  },
});

function notificationKey(userId: number): string {
  return `book-management.audit-notifications.${userId}`;
}

function storedNotifications(userId: number): AuditLogNotification[] {
  try {
    const stored = JSON.parse(
      localStorage.getItem(notificationKey(userId)) ?? "[]",
    ) as unknown;

    return Array.isArray(stored) ? stored.filter(isAuditLogNotification) : [];
  } catch {
    return [];
  }
}

function saveNotifications(
  userId: number,
  notifications: AuditLogNotification[],
): void {
  localStorage.setItem(notificationKey(userId), JSON.stringify(notifications));
}

function isAuditLogNotification(value: unknown): value is AuditLogNotification {
  if (typeof value !== "object" || value === null) return false;

  const auditLog = value as Record<string, unknown>;

  return (
    typeof auditLog.event_id === "string" &&
    typeof auditLog.event_type === "string" &&
    typeof auditLog.book_snapshot === "object" &&
    auditLog.book_snapshot !== null
  );
}
