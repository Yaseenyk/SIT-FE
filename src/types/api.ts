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

export interface LoginResponse {
  token: string;
  tokenType: string;
  expiresInSeconds: number;
  username: string;
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
