import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { AdminUserList } from "./admin-user-list";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const role = (session.user as { role: string }).role;
  if (role !== "admin") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-fern-50">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-xl font-semibold text-fern-900 mb-6">
          Admin – User roles
        </h1>
        <p className="text-sm text-fern-600 mb-6">
          Set each user&apos;s role. Changes take effect on their next request or when they sign in again.
        </p>
        <AdminUserList />
      </main>
    </div>
  );
}
