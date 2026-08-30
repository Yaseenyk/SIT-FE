import type { Metadata } from "next";
import { SignInPage } from "@/components/auth/pages";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your AISA account.",
};

export default function Page() {
  return <SignInPage />;
}
