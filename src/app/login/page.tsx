import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/dashboard");

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-fern-50 text-fern-600">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
