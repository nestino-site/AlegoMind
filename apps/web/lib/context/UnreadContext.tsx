"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { messagesApi, type Message } from "@/lib/api/messages";

const LS_KEY = "alego_last_read";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3000";

function getToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith("am_at="))
    ?.split("=")[1];
}

function loadLastRead(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "{}"); } catch { return {}; }
}
function saveLastRead(data: Record<string, string>) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

interface LatestMessagePreview {
  content: string;
  createdAt: string;
}

interface UnreadContextValue {
  unreadCounts: Record<string, number>;
  totalUnread: number;
  markAsRead: (conversationId: string) => void;
  setActiveConversation: (id: string | null) => void;
  notifPermission: NotificationPermission | "unsupported";
  requestNotifPermission: () => Promise<void>;
  latestMessages: Record<string, LatestMessagePreview>;
}

const UnreadContext = createContext<UnreadContextValue>({
  unreadCounts: {},
  totalUnread: 0,
  markAsRead: () => {},
  setActiveConversation: () => {},
  notifPermission: "unsupported",
  requestNotifPermission: async () => {},
  latestMessages: {},
});

export function useUnread() {
  return useContext(UnreadContext);
}

export function UnreadProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [latestMessages, setLatestMessages] = useState<Record<string, LatestMessagePreview>>({});
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">(
    typeof Notification === "undefined" ? "unsupported" : Notification.permission,
  );
  const activeConvRef = useRef<string | null>(null);
  const lastReadRef = useRef<Record<string, string>>(loadLastRead());

  useEffect(() => {
    if (!user) return;

    const token = getToken();
    if (!token) return;

    const fetchConvs =
      user.accountType === "PROFESSIONAL"
        ? () => messagesApi.getProConversations()
        : () => messagesApi.getConversations();

    const socket: Socket = io(`${WS_URL}/chat`, {
      auth: { token },
      transports: ["websocket"],
    });

    fetchConvs()
      .then(async (convs) => {
        const ids = convs.map((c) => c.id);

        // Get actual unread counts from server (messages from others after lastReadAt)
        const lastRead = lastReadRef.current;
        try {
          // Always include all conv IDs — empty string means "count all messages from others"
          const payload: Record<string, string> = {};
          for (const conv of convs) {
            payload[conv.id] = lastRead[conv.id] ?? "";
          }
          const counts = await messagesApi.getUnreadCounts(payload);
          // For conversations not in lastRead, getUnreadCounts returns total from others
          // Merge with any convs that aren't tracked yet
          const merged: Record<string, number> = {};
          for (const conv of convs) {
            const count = counts[conv.id] ?? 0;
            if (count > 0) merged[conv.id] = count;
          }
          setUnreadCounts(merged);
        } catch {
          // Fallback: use lastMessageAt comparison — shows 1 per unread conversation
          const fallback: Record<string, number> = {};
          for (const conv of convs) {
            if (!conv.lastMessageAt) continue;
            const lr = lastRead[conv.id];
            if (!lr || new Date(conv.lastMessageAt) > new Date(lr)) {
              fallback[conv.id] = 1;
            }
          }
          setUnreadCounts(fallback);
        }

        // Join all conversation rooms for real-time events
        const joinAll = () => { for (const id of ids) socket.emit("join", id); };
        if (socket.connected) joinAll();
        else socket.once("connect", joinAll);
      })
      .catch(() => {});

    socket.on("message", (msg: Message) => {
      // Update the conversation list preview for real-time display (non-system, non-own messages)
      if (msg.senderId !== user.id && !msg.content.startsWith("—")) {
        setLatestMessages((prev) => ({
          ...prev,
          [msg.conversationId]: { content: msg.content, createdAt: msg.createdAt },
        }));
      }

      // Skip messages the user sent themselves for unread counting
      if (msg.senderId === user.id) return;
      // Skip system messages (start/end with —)
      if (msg.content.startsWith("—")) return;
      // Don't count if user is actively viewing this conversation
      if (activeConvRef.current === msg.conversationId) return;

      setUnreadCounts((prev) => ({
        ...prev,
        [msg.conversationId]: (prev[msg.conversationId] ?? 0) + 1,
      }));

      // Per-message browser notification (no tag deduplication)
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("Mesaj nou", {
          body: msg.content.length > 80 ? msg.content.slice(0, 80) + "…" : msg.content,
          icon: "/favicon.ico",
          // No `tag` — each message gets its own notification
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const markAsRead = useCallback((conversationId: string) => {
    const now = new Date().toISOString();
    lastReadRef.current = { ...lastReadRef.current, [conversationId]: now };
    saveLastRead(lastReadRef.current);
    setUnreadCounts((prev) => {
      if (!prev[conversationId]) return prev;
      const next = { ...prev };
      delete next[conversationId];
      return next;
    });
  }, []);

  const setActiveConversation = useCallback(
    (id: string | null) => {
      activeConvRef.current = id;
      if (id) markAsRead(id);
    },
    [markAsRead],
  );

  const requestNotifPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setNotifPermission(result);
  }, []);

  const totalUnread = Object.values(unreadCounts).reduce((sum, n) => sum + n, 0);

  return (
    <UnreadContext.Provider
      value={{ unreadCounts, totalUnread, markAsRead, setActiveConversation, notifPermission, requestNotifPermission, latestMessages }}
    >
      {children}
    </UnreadContext.Provider>
  );
}
