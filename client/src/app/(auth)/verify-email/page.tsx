"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button, buttonClasses } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { ApiClientError } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/auth-context";

export default function VerifyEmailPage() {
  const { session, refresh } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  async function verify() {
    setLoading(true);
    try {
      const token = searchParams.get("token");
      if (!token) { toast.error("Open the verification link we sent to your inbox."); return; }
      const res = await api.verifyEmail(token);
      await refresh();
      toast.success(res.message ?? "Email verified");
      router.push("/dashboard");
    } catch (err) {
      toast.error(
        err instanceof ApiClientError
          ? err.message
          : "Verification failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-xl font-semibold text-ink">Verify your email</h1>
      <p className="mt-1 text-sm text-muted">
        {session
          ? `Confirm ${session.user.email} to secure your account.`
          : "Sign in first, then verify your email address."}
      </p>
      {searchParams.get("token") ? (
        <Button
          variant="accent"
          className="mt-6 w-full"
          loading={loading}
          onClick={() => void verify()}
        >
          Confirm email
        </Button>
      ) : (
        <Link href="/login?next=/verify-email" className={buttonClasses("accent", "md", "mt-6 w-full")}>
          Check your inbox for the verification link
        </Link>
      )}
      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/dashboard" className="font-medium text-ink hover:underline">
          Skip for now
        </Link>
      </p>
    </>
  );
}
