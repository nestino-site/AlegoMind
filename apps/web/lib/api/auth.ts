import type { AuthTokens, OnboardingState } from "@/lib/types";
import { api } from "./client";

export const authApi = {
  register: (body: {
    email: string;
    password: string;
    accountType: "SEEKER" | "PROFESSIONAL";
    firstName?: string;
    displayName?: string;
    isAnonymous?: boolean;
  }) => api.post<{ message: string; userId: string }>("/auth/register", body),

  verifyEmail: (body: { email: string; code: string }) =>
    api.post<AuthTokens>("/auth/verify-email", body),

  resendVerification: (email: string) =>
    api.post<{ message: string }>("/auth/resend-verification", { email }),

  login: (body: { email: string; password: string }) =>
    api.post<AuthTokens>("/auth/login", body),

  logout: (refreshToken: string) =>
    api.post<{ message: string }>("/auth/logout", { refreshToken }),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>("/auth/forgot-password", { email }),

  resetPassword: (body: { email: string; code: string; newPassword: string }) =>
    api.post<{ message: string }>("/auth/reset-password", body),

  me: (token: string) =>
    api.get<AuthTokens["user"]>("/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    }),

  savePreferences: (prefs: OnboardingState, token: string) =>
    api.post<{ message: string }>("/users/me/preferences", prefs, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateMe: (body: { displayName?: string; firstName?: string; avatar?: string }) =>
    api.patch<AuthTokens["user"]>("/users/me", body),
};
