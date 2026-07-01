"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { Message } from "@/lib/api/messages";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3000";

function getAccessToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith("am_at="))
    ?.split("=")[1];
}

export interface MessagesReadEvent {
  conversationId: string;
  readAt: string;
  isSeeker: boolean;
}

interface UseChatOptions {
  conversationId: string | null;
  userId?: string;
  onMessage: (msg: Message) => void;
  onConversationReset?: () => void;
  onMessagesRead?: (event: MessagesReadEvent) => void;
}

export function useChat({
  conversationId,
  userId,
  onMessage,
  onConversationReset,
  onMessagesRead,
}: UseChatOptions) {
  const socketRef = useRef<Socket | null>(null);
  const onMessageRef = useRef(onMessage);
  const onResetRef = useRef(onConversationReset);
  const onReadRef = useRef(onMessagesRead);
  onMessageRef.current = onMessage;
  onResetRef.current = onConversationReset;
  onReadRef.current = onMessagesRead;

  useEffect(() => {
    const token = getAccessToken();
    if (!token || !conversationId) return;

    const socket = io(`${WS_URL}/chat`, {
      auth: { token },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join", conversationId);
      // `join` on the gateway auto-marks as read and broadcasts messages:read to the other party
    });

    socket.on("message", (msg: Message) => {
      onMessageRef.current(msg);
      // If incoming message is from someone else, tell the server we've seen it
      if (userId && msg.senderId !== userId && msg.conversationId === conversationId) {
        socket.emit("read", conversationId);
      }
    });

    socket.on("messages:read", (event: MessagesReadEvent) => {
      onReadRef.current?.(event);
    });

    socket.on("conversation:reset", () => {
      onResetRef.current?.();
    });

    return () => {
      if (conversationId) socket.emit("leave", conversationId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = useCallback(
    (content: string) => {
      if (!socketRef.current?.connected || !conversationId) return false;
      socketRef.current.emit("message", { conversationId, content });
      return true;
    },
    [conversationId],
  );

  return { sendMessage };
}
