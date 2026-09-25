"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button, buttonClasses } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api/client";
import { ApiClientError } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/auth-context";
import {
  settingsProfileSchema,
  type SettingsProfileFormValues,
} from "@/lib/validation/schemas";
import Link from "next/link";

export default function SettingsPage() {
  const { session, setSession } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SettingsProfileFormValues>({
    resolver: zodResolver(settingsProfileSchema),
  });

  useEffect(() => {
    if (session) {
      reset({
        name: session.user.name,
        businessName: session.organization.name,
      });
    }
  }, [session, reset]);

  const mutation = useMutation({
    mutationFn: (values: SettingsProfileFormValues) => api.updateProfile(values),
    onSuccess: (res) => {
      setSession(res.data);
      toast.success(res.message ?? "Profile updated");
      reset({
        name: res.data.user.name,
        businessName: res.data.organization.name,
      });
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiClientError ? err.message : "Could not save settings.",
      );
    },
  });

  if (!session) return null;

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Settings</h1>
        <p className="mt-1 text-sm text-muted">Manage your account profile.</p>
      </div>

      <section className="rounded-md border border-border bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-ink">Email</p>
            <p className="text-sm text-muted">{session.user.email}</p>
          </div>
          <StatusBadge
            label={session.user.emailVerified ? "Verified" : "Unverified"}
            tone={session.user.emailVerified ? "success" : "warning"}
          />
        </div>
        {!session.user.emailVerified ? (
          <Link href="/verify-email" className={buttonClasses("secondary", "sm", "mt-3 inline-flex")}>
            Verify email
          </Link>
        ) : null}
      </section>

      <form
        className="space-y-4 rounded-md border border-border bg-white p-5"
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        noValidate
      >
        <Input
          label="Full name"
          error={errors.name?.message}
          {...register("name")}
        />
        <Input
          label="Business name"
          error={errors.businessName?.message}
          {...register("businessName")}
        />
        <Button
          type="submit"
          variant="accent"
          disabled={!isDirty}
          loading={mutation.isPending}
        >
          Save changes
        </Button>
      </form>
    </div>
  );
}
