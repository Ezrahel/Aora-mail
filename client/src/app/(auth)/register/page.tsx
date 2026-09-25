import { Suspense } from "react";
import RegisterForm from "./register-form";

export default function Page() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
      <RegisterForm />
    </Suspense>
  );
}
