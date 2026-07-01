import { api } from "./client";

/* ── types ──────────────────────────────────────────────────── */

export interface ConversationParticipant {
  firstName: string | null;
  displayName: string | null;
  avatar: string | null;
}

export interface ConversationProfessional {
  id: string;
  type: "THERAPIST" | "COACH" | "MENTOR";
  user: ConversationParticipant;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: "USER" | "PROFESSIONAL" | "AI";
  content: string;
  createdAt: string;
}

export type ConversationStatus = "PENDING_TOPIC" | "ACTIVE";
export type ConversationTopicType = "FREE" | "PAID";

export interface Conversation {
  id: string;
  seekerId: string;
  professionalId: string;
  lastMessageAt: string | null;
  status: ConversationStatus;
  topicLabel: string | null;
  topicType: ConversationTopicType | null;
  topicCost: number | null;
  professional: ConversationProfessional;
  messages: Message[];
}

// Pro-side conversation (seeker info instead of professional info)
export interface ProConversation {
  id: string;
  seekerId: string;
  professionalId: string;
  lastMessageAt: string | null;
  status: ConversationStatus;
  topicLabel: string | null;
  seeker: ConversationParticipant;
  messages: Message[];
}

export interface MessagesPage {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  seekerLastReadAt: string | null;
  proLastReadAt: string | null;
}

export interface ChatTopicOption {
  id?: string;
  label: string;
  description?: string | null;
  price: number;
  type: "FREE" | "PAID";
}

export interface ConversationOptions {
  freeOptions: ChatTopicOption[];
  paidOptions: ChatTopicOption[];
  conversationStatus: ConversationStatus;
  topicLabel: string | null;
  topicType: ConversationTopicType | null;
  topicCost: number | null;
}

export interface SelectTopicResult {
  status: "ACTIVE" | "PENDING_PAYMENT";
  clientSecret?: string | null;
  message?: Message;
}

/* ── api ────────────────────────────────────────────────────── */

export const messagesApi = {
  getConversations: () => api.get<Conversation[]>("/conversations"),

  getProConversations: () => api.get<ProConversation[]>("/conversations/professional"),

  createConversation: (professionalId: string) =>
    api.post<Conversation>("/conversations", { professionalId }),

  getConversationOptions: (conversationId: string) =>
    api.get<ConversationOptions>(`/conversations/${conversationId}/options`),

  selectTopic: (
    conversationId: string,
    topicLabel: string,
    topicType: "FREE" | "PAID",
    opts?: { chatServiceId?: string; price?: number },
  ) =>
    api.post<SelectTopicResult>(`/conversations/${conversationId}/select-topic`, {
      topicLabel,
      topicType,
      ...opts,
    }),

  confirmTopicPayment: (conversationId: string, paymentIntentId: string) =>
    api.post<{ status: string }>(`/conversations/${conversationId}/confirm-topic-payment`, {
      paymentIntentId,
    }),

  getMessages: (conversationId: string, page = 1, limit = 30) =>
    api.get<MessagesPage>(`/conversations/${conversationId}/messages?page=${page}&limit=${limit}`),

  sendMessage: (conversationId: string, content: string) =>
    api.post<Message>(`/conversations/${conversationId}/messages`, { content }),

  endSession: (conversationId: string) =>
    api.post<{ message: Message }>(`/conversations/${conversationId}/end-session`, {}),

  getUnreadCounts: (readTimestamps: Record<string, string>) =>
    api.post<Record<string, number>>("/conversations/unread-counts", { readTimestamps }),
};
