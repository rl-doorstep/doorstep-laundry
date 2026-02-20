import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <header className="border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
        <div className="mx-auto max-w-4xl px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Account
          </h1>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Back to dashboard
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        <section className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-4">
            Profile
          </h2>
          <AccountForm
            name={user?.name ?? ""}
            email={user?.email ?? ""}
            phone={user?.phone ?? ""}
          />
        </section>
        <section className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-4">
            Addresses
          </h2>
          <ul className="space-y-3">
            {addresses.map((addr) => (
              <li
                key={addr.id}
                className="flex justify-between items-start rounded-lg border border-zinc-200 dark:border-zinc-600 p-3"
              >
                <div>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {addr.label}
                    {addr.isDefault && (
                      <span className="ml-2 text-xs text-zinc-500">(default)</span>
                    )}
                  </span>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    {addr.street}, {addr.city}, {addr.state} {addr.zip}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Add or edit addresses when booking a pickup.
          </p>
        </section>
      </main>
    </div>
  );
}
