import type { Metadata } from "next";
import { SignUpPage } from "@/components/auth/pages";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create an AISA account with your institute email address.",
};

export default function Page() {
  return <SignUpPage />;
}
