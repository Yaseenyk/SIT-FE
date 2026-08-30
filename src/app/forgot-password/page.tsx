import type { Metadata } from "next";
import { ForgotPasswordPage } from "@/components/auth/pages";

export const metadata: Metadata = {
  title: "Reset your password",
  description: "Request a password reset link for your AISA account.",
};

export default function Page() {
  return <ForgotPasswordPage />;
}
