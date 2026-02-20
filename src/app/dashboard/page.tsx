import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role: string }).role;
  if (role === "staff" || role === "admin") redirect("/staff");

  const orders = await prisma.order.findMany({
    where: { customerId: userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const statusLabel: Record<string, string> = {
    draft: "Draft",
    scheduled: "Scheduled",
    picked_up: "Picked up",
    in_progress: "In progress",
    out_for_delivery: "Out for delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <header className="border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
        <div className="mx-auto max-w-4xl px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            My orders
          </h1>
          <div className="flex gap-4">
            <Link
              href="/account"
              className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Account
            </Link>
            <Link
              href="/book"
              className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200"
            >
              Book pickup
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        {orders.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-8 text-center">
            <p className="text-zinc-600 dark:text-zinc-400">
              You don&apos;t have any orders yet.
            </p>
            <Link
              href="/book"
              className="mt-4 inline-block rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium"
            >
              Book your first pickup
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.id}`}
                  className="block rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                        {order.orderNumber}
                      </span>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        Pickup {new Date(order.pickupDate).toLocaleDateString()} · Delivery{" "}
                        {new Date(order.deliveryDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        order.status === "delivered"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : order.status === "cancelled"
                            ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}
                    >
                      {statusLabel[order.status] ?? order.status}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
