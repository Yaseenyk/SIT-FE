/**
 * Every call this app makes, in one file.
 *
 * Components never build a URL. Keeping them here means a route change on the server is a
 * one-line change on the client, and the full API surface is readable at a glance.
 */

import { API_V1, api } from "./client";
import type {
  Achievement,
  ApplicationSummary,
  AdminSettings,
  AdminStats,
  AisaEvent,
  Committee,
  ContactMessage,
  EventStatus,
  GalleryItem,
  Me,
  Member,
  MyApplication,
  MyRegistration,
  PublicStats,
  RegistrationSummary,
  SiteSettings,
  UploadSignature,
  UserSummary,
} from "@/types/api";

const path = (segment: string) => `${API_V1}${segment}`;

export const auth = {
  /**
   * Completes signup for a caller who already holds a Firebase credential.
   *
   * There is no login or password call anywhere in this file — the browser talks to
   * Firebase for credentials and to this API for everything else, so nothing here can
   * see a password.
   */
  register: (body: { name: string; rollNumber: string | null; year: number | null }) =>
    api.post<Me>(path("/auth/register"), body),

  me: () => api.get<Me>(path("/auth/me")),

  /** Same shape as me(), and also stamps lastLoginAt. Called once per session. */
  session: () => api.post<Me>(path("/auth/session")),

  updateProfile: (body: {
    name: string;
    rollNumber: string | null;
    year: number | null;
    photoUrl: string | null;
    photoPublicId: string | null;
  }) => api.put<Me>(path("/auth/profile"), body),
};

export const users = {
  list: () => api.get<UserSummary[]>(path("/admin/users")),
  update: (uid: string, body: { role?: string; status?: string }) =>
    api.patch<UserSummary>(path(`/admin/users/${uid}`), body),
  remove: (uid: string) => api.delete<void>(path(`/admin/users/${uid}`)),
};

export const registrations = {
  register: (eventId: string) =>
    api.post<MyRegistration>(path(`/events/${eventId}/registration`)),
  cancel: (eventId: string) => api.delete<void>(path(`/events/${eventId}/registration`)),
  mine: () => api.get<MyRegistration[]>(path("/me/registrations")),
  forEvent: (eventId: string) =>
    api.get<RegistrationSummary[]>(path(`/events/${eventId}/registrations`)),
};

export const applications = {
  apply: (body: { committeeId: string; motivation: string }) =>
    api.post<MyApplication>(path("/applications"), body),
  mine: () => api.get<MyApplication[]>(path("/me/applications")),
  withdraw: (id: string) => api.delete<void>(path(`/me/applications/${id}`)),

  list: (status?: string) =>
    api.get<ApplicationSummary[]>(path("/applications"), { query: { status } }),
  review: (id: string, body: { status: "ACCEPTED" | "REJECTED"; role?: string }) =>
    api.patch<ApplicationSummary>(path(`/applications/${id}`), body),
};

export const committees = {
  list: (type?: string) => api.get<Committee[]>(path("/committees"), { query: { type } }),
  get: (id: string) => api.get<Committee>(path(`/committees/${id}`)),
  create: (body: unknown) => api.post<Committee>(path("/committees"), body),
  update: (id: string, body: unknown) => api.put<Committee>(path(`/committees/${id}`), body),
  move: (id: string, direction: "up" | "down") =>
    api.patch<Committee[]>(path(`/committees/${id}/order`), { direction }),
  remove: (id: string) => api.delete<void>(path(`/committees/${id}`)),
};

export const members = {
  list: (committeeId?: string) => api.get<Member[]>(path("/members"), { query: { committeeId } }),
  create: (body: unknown) => api.post<Member>(path("/members"), body),
  update: (id: string, body: unknown) => api.put<Member>(path(`/members/${id}`), body),
  remove: (id: string) => api.delete<void>(path(`/members/${id}`)),
};

export const events = {
  list: (status?: EventStatus) => api.get<AisaEvent[]>(path("/events"), { query: { status } }),
  create: (body: unknown) => api.post<AisaEvent>(path("/events"), body),
  update: (id: string, body: unknown) => api.put<AisaEvent>(path(`/events/${id}`), body),
  remove: (id: string) => api.delete<void>(path(`/events/${id}`)),
};

export const gallery = {
  list: (category?: string) => api.get<GalleryItem[]>(path("/gallery"), { query: { category } }),
  album: (albumId: string) => api.get<GalleryItem[]>(path(`/gallery/albums/${albumId}`)),
  create: (body: unknown) => api.post<GalleryItem[]>(path("/gallery"), body),
  update: (id: string, body: unknown) => api.put<GalleryItem>(path(`/gallery/${id}`), body),
  remove: (id: string) => api.delete<void>(path(`/gallery/${id}`)),
  removeAlbum: (albumId: string) => api.delete<void>(path(`/gallery/albums/${albumId}`)),
};

export const achievements = {
  list: (category?: string) =>
    api.get<Achievement[]>(path("/achievements"), { query: { category } }),
  create: (body: unknown) => api.post<Achievement>(path("/achievements"), body),
  update: (id: string, body: unknown) => api.put<Achievement>(path(`/achievements/${id}`), body),
  remove: (id: string) => api.delete<void>(path(`/achievements/${id}`)),
};

export const messages = {
  /**
   * `website` is the honeypot. It is always sent and always empty for a real visitor —
   * the field is hidden from people but visible to the naive bots that fill every input.
   */
  send: (body: {
    name: string;
    email: string;
    subject?: string;
    message: string;
    website: string;
  }) => api.post<{ message: string }>(path("/messages"), body, { anonymous: true }),

  list: () => api.get<ContactMessage[]>(path("/messages")),
  markRead: (id: string, read: boolean) =>
    api.patch<ContactMessage>(path(`/messages/${id}/read`), { read }),
  remove: (id: string) => api.delete<void>(path(`/messages/${id}`)),
};

export const settings = {
  get: () => api.get<SiteSettings>(path("/settings")),
  getForAdmin: () => api.get<AdminSettings>(path("/settings/admin")),
  update: (body: unknown) => api.put<AdminSettings>(path("/settings"), body),
  setAnnouncement: (text: string, expiresAt: string | null) =>
    api.put<{ text: string; expiresAt: string | null }>(path("/settings/announcement"), {
      text,
      expiresAt,
    }),
  clearAnnouncement: () => api.delete<void>(path("/settings/announcement")),
};

export const stats = {
  get: () => api.get<PublicStats>(path("/stats")),
  getForAdmin: () => api.get<AdminStats>(path("/stats/admin")),
};

export type UploadFolder =
  | "gallery"
  | "members"
  | "events"
  | "achievements"
  | "committees"
  | "avatars";

export const media = {
  sign: (folder: UploadFolder) => api.post<UploadSignature>(path("/media/signature"), { folder }),
  remove: (publicId: string) =>
    api.delete<void>(path("/media"), { query: { publicId } }),
};
