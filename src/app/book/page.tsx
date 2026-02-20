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
    <div className="min-h-screen bg-fern-50">
      <header className="border-b border-fern-200/80 bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-fern-900">
            Book a pickup
          </h1>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-fern-600 hover:text-fern-900 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        {addresses.length === 0 ? (
          <div className="rounded-2xl border border-fern-200/80 bg-white p-8 shadow-sm">
            <p className="text-fern-600 mb-6">
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
