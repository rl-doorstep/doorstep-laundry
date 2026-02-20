import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/app-header";
import { AccountForm } from "./account-form";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role: string }).role;
  if (role === "staff" || role === "admin") redirect("/staff");

  const [user, addresses] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, phone: true },
    }),
    prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    }),
  ]);

  return (
    <div className="min-h-screen bg-fern-50">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        <h1 className="text-xl font-semibold text-fern-900 mb-6">
          Account
        </h1>
        <section className="rounded-2xl border border-fern-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-fern-900 mb-4">
            Profile
          </h2>
          <AccountForm
            name={user?.name ?? ""}
            email={user?.email ?? ""}
            phone={user?.phone ?? ""}
          />
        </section>
        <section className="rounded-2xl border border-fern-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-fern-900 mb-4">
            Addresses
          </h2>
          <ul className="space-y-3">
            {addresses.map((addr) => (
              <li
                key={addr.id}
                className="flex justify-between items-start rounded-xl border border-fern-200/80 p-4 bg-fern-50/50"
              >
                <div>
                  <span className="font-medium text-fern-900">
                    {addr.label}
                    {addr.isDefault && (
                      <span className="ml-2 text-xs text-fern-500">(default)</span>
                    )}
                  </span>
                  <p className="text-sm text-fern-600 mt-1">
                    {addr.street}, {addr.city}, {addr.state} {addr.zip}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-fern-500">
            Add or edit addresses when booking a pickup.
          </p>
        </section>
      </main>
    </div>
  );
}
