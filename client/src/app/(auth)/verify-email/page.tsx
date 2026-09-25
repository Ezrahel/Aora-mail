"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button, buttonClasses } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { ApiClientError } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/auth-context";

export default function VerifyEmailPage() {
  const { session, refresh } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function verify() {
    setLoading(true);
    try {
      const res = await api.verifyEmail();
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
      {session ? (
        <Button
          variant="accent"
          className="mt-6 w-full"
          loading={loading}
          onClick={() => void verify()}
        >
          Verify email
        </Button>
      ) : (
        <Link href="/login?next=/verify-email" className={buttonClasses("accent", "md", "mt-6 w-full")}>
          Sign in to verify
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
