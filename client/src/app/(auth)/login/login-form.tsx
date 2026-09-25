"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { ApiClientError } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/auth-context";
import {
  loginSchema,
  type LoginFormValues,
} from "@/lib/validation/schemas";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuth();
  const next = searchParams.get("next") ?? "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: true },
  });

  async function onSubmit(values: LoginFormValues) {
    try {
      const res = await api.login(values);
      setSession(res.data);
      toast.success("Signed in");
      router.push(next);
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : "We couldn't sign you in. Please try again.";
      toast.error(message);
    }
  }

  return (
    <>
      <h1 className="text-xl font-semibold text-ink">Sign in</h1>
      <p className="mt-1 text-sm text-muted">
        Access your business email dashboard.
      </p>
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
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              className="size-4 rounded border-border"
              {...register("remember")}
            />
            Remember session
          </label>
          <Link
            href="/forgot-password"
            className="text-sm text-muted hover:text-ink"
          >
            Forgot password?
          </Link>
        </div>
        <Button type="submit" variant="accent" className="w-full" loading={isSubmitting}>
          Sign in
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        No account?{" "}
        <Link href="/register" className="font-medium text-ink hover:underline">
          Create one
        </Link>
      </p>
    </>
  );
}
