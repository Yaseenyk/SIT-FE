import type { Metadata } from "next";
import { AdminGate } from "@/components/admin/gate";

export const metadata: Metadata = {
  title: "Admin",
  // The admin screen has nothing for a search engine, and indexing it invites
  // credential-stuffing traffic to a page that exists to be found by exactly nine people.
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminGate />;
}
