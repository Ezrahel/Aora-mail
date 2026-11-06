import type { Metadata } from "next";
import { Suspense } from "react";
import { privatePage } from "@/lib/seo/metadata";
import LoginPage from "./login-form";

export const metadata: Metadata = privatePage("Sign in");

export default function Page() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
      <LoginPage />
    </Suspense>
  );
}
