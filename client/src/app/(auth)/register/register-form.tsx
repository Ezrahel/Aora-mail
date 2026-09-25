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
import { getPlanBySlug } from "@/lib/constants/plans";
import {
  registerSchema,
  type RegisterFormValues,
} from "@/lib/validation/schemas";

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuth();
  const planSlug = searchParams.get("plan");

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      businessName: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    try {
      const res = await api.register({
        name: values.name,
        businessName: values.businessName,
        email: values.email,
        password: values.password,
        acceptTerms: values.acceptTerms,
      });
      setSession(res.data);

      const plan = planSlug
        ? getPlanBySlug(planSlug as "starter" | "business" | "pro")
        : undefined;
      if (plan) {
        await api.selectPlan(plan.id);
      }

      toast.success("Account created");
      router.push("/onboarding");
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.fieldErrors) {
          for (const [field, message] of Object.entries(err.fieldErrors)) {
            setError(field as keyof RegisterFormValues, { message });
          }
        }
        toast.error(err.message);
        return;
      }
      toast.error("We couldn't create your account. Please try again.");
    }
  }

  return (
    <>
      <h1 className="text-xl font-semibold text-ink">Create your account</h1>
      <p className="mt-1 text-sm text-muted">
        Set up professional email for your business.
      </p>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 space-y-4"
        noValidate
      >
        <Input
          label="Full name"
          autoComplete="name"
          error={errors.name?.message}
          {...register("name")}
        />
        <Input
          label="Business / company name"
          autoComplete="organization"
          error={errors.businessName?.message}
          {...register("businessName")}
        />
        <Input
          label="Work email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters, with a letter and a number"
          error={errors.password?.message}
          {...register("password")}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <label className="flex items-start gap-2 text-sm text-ink">
          <input
            type="checkbox"
            className="mt-0.5 size-4 rounded border-border"
            {...register("acceptTerms")}
          />
          <span>
            I agree to the terms of service and privacy policy.
            {errors.acceptTerms?.message ? (
              <span className="mt-1 block text-xs text-danger" role="alert">
                {errors.acceptTerms.message}
              </span>
            ) : null}
          </span>
        </label>
        <Button type="submit" variant="accent" className="w-full" loading={isSubmitting}>
          Create account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-ink hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
