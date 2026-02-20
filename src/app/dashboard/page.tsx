import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTimeSlotById } from "@/lib/slots";
import { AppHeader } from "@/components/app-header";

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
    <div className="min-h-screen bg-fern-50">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-xl font-semibold text-fern-900 mb-6">
          My orders
        </h1>
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-fern-200/80 bg-white p-10 text-center shadow-sm">
            <p className="text-fern-600">
              You don&apos;t have any orders yet.
            </p>
            <Link
              href="/book"
              className="mt-5 inline-block rounded-lg bg-fern-500 text-white px-5 py-2.5 text-sm font-medium hover:bg-fern-600 transition-colors"
            >
              Book your first pickup
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.id}`}
                  className="block rounded-2xl border border-fern-200/80 bg-white p-5 hover:bg-fern-50/50 hover:border-fern-200 transition-colors shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-medium text-fern-900">
                        {order.orderNumber}
                      </span>
                      <p className="text-sm text-fern-500 mt-1">
                        Pickup {new Date(order.pickupDate).toLocaleDateString()}
                        {order.pickupTimeSlot && ` ${getTimeSlotById(order.pickupTimeSlot)?.label ?? order.pickupTimeSlot}`}
                        {" · Delivery "}
                        {new Date(order.deliveryDate).toLocaleDateString()}
                        {order.deliveryTimeSlot && ` ${getTimeSlotById(order.deliveryTimeSlot)?.label ?? order.deliveryTimeSlot}`}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        order.status === "delivered"
                          ? "bg-fern-100 text-fern-700"
                          : order.status === "cancelled"
                            ? "bg-fern-100 text-fern-500"
                            : "bg-fern-200 text-fern-800"
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
