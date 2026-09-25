"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/lib/validation/schemas";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    const res = await api.forgotPassword(values.email);
    setSent(true);
    toast.success(res.message ?? "Check your email");
  }

  return (
    <>
      <h1 className="text-xl font-semibold text-ink">Reset password</h1>
      <p className="mt-1 text-sm text-muted">
        Enter your account email and we will send reset instructions if it
        exists.
      </p>
      {sent ? (
        <div className="mt-6 rounded-md border border-border bg-surface p-4 text-sm text-ink">
          If an account exists for that address, reset instructions are on the
          way. Check your inbox and spam folder.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 space-y-4"
          noValidate
        >
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <Button
            type="submit"
            variant="accent"
            className="w-full"
            loading={isSubmitting}
          >
            Send reset link
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/login" className="font-medium text-ink hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
