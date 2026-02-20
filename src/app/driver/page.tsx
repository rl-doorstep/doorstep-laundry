import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { DriverDashboard } from "./driver-dashboard";

export default async function DriverPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const role = (session.user as { role: string }).role;
  if (role !== "staff" && role !== "admin") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-fern-50">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-xl font-semibold text-fern-900 mb-2">
          Driver – My deliveries
        </h1>
        <p className="text-sm text-fern-600 mb-6">
          Orders with all loads ready are available to any driver. Select which to pick up, optimize your route, then start delivery. Share location so admins can see where you are. Customers are notified when you&apos;re a few stops away.
        </p>
        <DriverDashboard />
      </main>
    </div>
  );
}
