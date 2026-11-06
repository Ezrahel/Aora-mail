import type { Metadata } from "next";
import { Suspense } from "react";
import { publicPage } from "@/lib/seo/metadata";
import RegisterForm from "./register-form";

export const metadata: Metadata = publicPage({
  title: "Create Your Business Email Account",
  description: "Create your Aora account and set up professional email on your own domain, with guided DNS setup from the first step.",
  path: "/register",
  sharedCard: true,
});

export default function Page() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
      <RegisterForm />
    </Suspense>
  );
}
