import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/app-header";
import { getBookingAvailability } from "@/lib/settings";
import { BookForm } from "./book-form";

export default async function BookPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role: string }).role;
  if (role === "staff" || role === "admin") redirect("/wash");

  const [addresses, user] = await Promise.all([
    prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { defaultLoadOptions: true },
    }),
  ]);

  const defaultLoadOptions =
    user?.defaultLoadOptions && typeof user.defaultLoadOptions === "object"
      ? (user.defaultLoadOptions as Record<string, boolean>)
      : null;

  const bookingAvailability = await getBookingAvailability();

  return (
    <div className="min-h-screen bg-fern-50">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-xl font-semibold text-fern-900 mb-6">
          Book a pickup
        </h1>
        {addresses.length === 0 ? (
          <div>
            <p className="text-fern-600 mb-4">
              Add an address when you continue, or use an existing one from your account.
            </p>
            <BookForm
              addresses={[]}
              defaultLoadOptions={defaultLoadOptions}
              bookingAvailability={bookingAvailability}
            />
          </div>
        ) : (
          <BookForm
            addresses={addresses}
            defaultLoadOptions={defaultLoadOptions}
            bookingAvailability={bookingAvailability}
          />
        )}
      </main>
    </div>
  );
}
