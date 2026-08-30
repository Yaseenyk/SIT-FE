import type { Metadata } from "next";
import { AccountGate } from "@/components/account/gate";

export const metadata: Metadata = {
  title: "My account",
  description: "Your AISA profile, event registrations and committee applications.",
};

export default function Page() {
  return <AccountGate />;
}
