/**
 * The API contract, mirrored from the Spring Boot DTOs.
 *
 * Hand-written rather than generated, because the surface is small and stable and a
 * generator would be one more build step to keep alive. The names match the Java records
 * one-for-one so a change on either side is greppable on the other.
 *
 * Source of truth: `be/src/main/java/org/aisa/api/**\/*Dtos.java`.
 */

export type CommitteeType = "advisory" | "executive" | "functional";

export interface Committee {
  id: string;
  order: number;
  type: CommitteeType;
  name: string;
  icon: string | null;
  gradient: string | null;
  sizeLabel: string | null;
  badge: string | null;
  coordLabel: string | null;
  coordinator: string | null;
  coordinatorSub: string | null;
  coordinatorPhoto: string | null;
  coord2Label: string | null;
  coordinator2: string | null;
  coordinator2Photo: string | null;
  responsibilities: string[];
  memberCount: number;
}

export interface Member {
  id: string;
  name: string;
  role: string;
  committeeId: string | null;
  committeeName: string | null;
  academicYear: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  email: string | null;
  photoUrl: string | null;
  order: number;
}

export type EventStatus = "upcoming" | "past";

export interface AisaEvent {
  id: string;
  title: string;
  /** ISO date, e.g. "2025-01-18". */
  startsOn: string;
  endsOn: string | null;
  /** Pre-formatted by the server. Never re-derive this in the client. */
  dateLabel: string;
  status: EventStatus;
  tag: string | null;
  emoji: string | null;
  description: string | null;
  linkUrl: string | null;
  bannerUrl: string | null;
}

export interface GalleryItem {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  takenOn: string | null;
  url: string;
  albumId: string | null;
  albumTitle: string | null;
  albumIndex: number | null;
  albumTotal: number | null;
}

export interface Achievement {
  id: string;
  title: string;
  student: string;
  category: string | null;
  achievedOn: string | null;
  description: string | null;
  photoUrl: string | null;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface Feature {
  title: string | null;
  description: string | null;
}

export interface Announcement {
  text: string;
  expiresAt: string | null;
}

export interface SiteSettings {
  phone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  linkedin: string | null;
  instagram: string | null;
  aboutTitle: string | null;
  aboutDescription: string | null;
  features: Feature[];
  /** Null when there is no announcement, or the server has judged it expired. */
  announcement: Announcement | null;
}

export interface AdminSettings {
  publicSettings: SiteSettings;
  notificationEmail: string | null;
  updatedAt: string;
}

export interface PublicStats {
  committees: number;
  members: number;
  events: number;
  upcomingEvents: number;
  photos: number;
  achievements: number;
}

export interface AdminStats {
  counts: PublicStats;
  unreadMessages: number;
}


/** Everything the browser needs to POST an image straight to Cloudinary. */
export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  transformation: string;
  signature: string;
  uploadUrl: string;
}

/** The single error body every failing request returns. See GlobalExceptionHandler. */
export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors?: Record<string, string>;
}

// ── Accounts ────────────────────────────────────────────────────────────────

export type UserRole = "STUDENT" | "ADMIN";

/**
 * The signed-in caller.
 *
 * `state` is the field the whole account UI turns on, and it exists because "signed in"
 * is not one condition: a caller can hold a perfectly valid token and still be
 * unregistered, unverified or suspended, each needing a different screen. Without it the
 * frontend would be guessing from status codes.
 */
export interface Me {
  uid: string;
  email: string | null;
  name: string | null;
  role: UserRole | null;
  state: "UNREGISTERED" | "UNVERIFIED" | "SUSPENDED" | "ACTIVE";
  emailVerified: boolean;
  rollNumber: string | null;
  year: number | null;
  photoUrl: string | null;
  lastLoginAt: string | null;
}

/** A row in the admin user list. */
export interface UserSummary {
  uid: string;
  email: string | null;
  name: string | null;
  role: UserRole;
  status: "ACTIVE" | "SUSPENDED";
  rollNumber: string | null;
  year: number | null;
  photoUrl: string | null;
  lastLoginAt: string | null;
  createdAt: string | null;
}

// ── Event registration ──────────────────────────────────────────────────────

/** The student's own view: which events they are signed up for. */
export interface MyRegistration {
  eventId: string;
  title: string;
  startsOn: string;
  dateLabel: string;
  registeredAt: string;
}

/** The admin's attendance list. */
export interface RegistrationSummary {
  uid: string;
  name: string | null;
  email: string | null;
  rollNumber: string | null;
  year: number | null;
  registeredAt: string;
}

// ── Committee applications ──────────────────────────────────────────────────

export type ApplicationStatus = "PENDING" | "ACCEPTED" | "REJECTED";

/** The student's own view. No reviewer identity — that is not their business. */
export interface MyApplication {
  id: string;
  committeeId: string;
  committeeName: string | null;
  motivation: string;
  status: ApplicationStatus;
  appliedAt: string;
  reviewedAt: string | null;
}

export interface ApplicationSummary {
  id: string;
  uid: string;
  applicantName: string | null;
  applicantEmail: string | null;
  rollNumber: string | null;
  year: number | null;
  committeeId: string;
  committeeName: string | null;
  motivation: string;
  status: ApplicationStatus;
  appliedAt: string;
  reviewedAt: string | null;
}
