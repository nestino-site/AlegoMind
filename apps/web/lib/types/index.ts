// ─── Enums (match Prisma schema exactly) ──────────────────────────────────────

export type AccountType = "SEEKER" | "PROFESSIONAL";

export type ProfessionalType = "THERAPIST" | "COACH" | "MENTOR";

/** Maps to Prisma SessionFormat enum */
export type SessionFormat = "TEXT" | "VIDEO" | "VOICE" | "IN_PERSON";

export type SubscriptionTier = "FREE" | "PLUS";

export type AvailabilityStatus = "available" | "busy" | "offline";

export type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

// ─── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  firstName: string | null;
  avatar: string | null;
  accountType: AccountType;
  subscriptionTier: SubscriptionTier;
  isAnonymous: boolean;
  isEmailVerified: boolean;
  preferredLanguage: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export interface Provider {
  id: string;
  displayName: string;
  avatarUrl?: string;
  type: ProfessionalType;
  specializations: string[];
  rating: number;
  reviewCount: number;
  sessionCount: number;
  experienceYears: number;
  pricePerSession: number; // RON
  formats: SessionFormat[];
  availability: AvailabilityStatus;
  bio?: string;
  responseRate?: number;
  isVerified?: boolean;
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  seeker: { displayName: string | null; avatar: string | null };
}

// ─── Session ──────────────────────────────────────────────────────────────────

export interface Session {
  id: string;
  provider: Provider;
  format: SessionFormat;
  durationMinutes: 30 | 50 | 80;
  scheduledAt: string;
  status: BookingStatus;
  price: number;
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

export const SEEKER_TOPICS = [
  "anxiety", "depression", "relationships", "career", "trauma",
  "burnout", "grief", "stress", "self_esteem", "life_transitions",
  "addiction", "family", "parenting", "identity", "sleep", "motivation",
] as const;

export type SeekerTopic = (typeof SEEKER_TOPICS)[number];

export interface OnboardingState {
  topics: SeekerTopic[];
  communicationFormats: SessionFormat[];
  providerGender?: "male" | "female" | "any";
  providerAgeMin?: number;
  providerAgeMax?: number;
}
