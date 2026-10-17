"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const params = useSearchParams(); const router = useRouter();
  const [password, setPassword] = useState(""); const [loading, setLoading] = useState(false);
  async function reset(): Promise<void> {
    const token = params.get("token");
    if (!token || password.length < 10) { toast.error("Use the reset link and a password of at least 10 characters."); return; }
    setLoading(true);
    try { await api.resetPassword(token, password); toast.success("Password reset. You can now sign in."); router.push("/login"); }
    catch { toast.error("That reset link is invalid or has expired."); }
    finally { setLoading(false); }
  }
  return <><h1 className="text-xl font-semibold text-ink">Choose a new password</h1><p className="mt-1 text-sm text-muted">Use at least 10 characters.</p><div className="mt-6 space-y-3"><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} aria-label="New password" /><Button className="w-full" loading={loading} onClick={() => void reset()}>Reset password</Button></div></>;
}
