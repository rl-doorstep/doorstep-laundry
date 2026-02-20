import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { DebugTools } from "./debug-tools";

export default async function DebugPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const role = (session.user as { role: string }).role;
  if (role !== "admin") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-fern-50">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-xl font-semibold text-fern-900 mb-6">
          Debug
        </h1>
        <p className="text-sm text-fern-600 mb-8">
          Test Twilio SMS, Resend email, and route optimization. Admin only.
        </p>
        <DebugTools />
      </main>
    </div>
  );
}
