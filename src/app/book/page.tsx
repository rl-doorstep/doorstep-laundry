import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BookForm } from "./book-form";

const DEFAULT_TOTAL_CENTS = 2500; // $25.00

export default async function BookPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role: string }).role;
  if (role === "staff" || role === "admin") redirect("/staff");

  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <header className="border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
        <div className="mx-auto max-w-4xl px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Book a pickup
          </h1>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Dashboard
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        {addresses.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-8">
            <p className="text-zinc-600 dark:text-zinc-400">
              Add an address in your account first, or add one below.
            </p>
            <BookForm addresses={[]} defaultTotalCents={DEFAULT_TOTAL_CENTS} />
          </div>
        ) : (
          <BookForm
            addresses={addresses}
            defaultTotalCents={DEFAULT_TOTAL_CENTS}
          />
        )}
      </main>
    </div>
  );
}
