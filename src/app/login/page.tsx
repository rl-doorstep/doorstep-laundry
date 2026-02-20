import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-fern-50 text-fern-600">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
