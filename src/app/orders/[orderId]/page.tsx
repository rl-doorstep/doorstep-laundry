import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PayButton } from "./pay-button";

const statusLabel: Record<string, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  picked_up: "Picked up",
  in_progress: "In progress",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const userId = (session.user as { id: string }).id;
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      pickupAddress: true,
      deliveryAddress: true,
      statusHistory: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!order) notFound();
  if (order.customerId !== userId) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <header className="border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
        <div className="mx-auto max-w-4xl px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
            {order.orderNumber}
          </h1>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Back to dashboard
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6">
          <div className="flex justify-between items-start mb-4">
            <span className="text-zinc-500 dark:text-zinc-400">Status</span>
            <div className="flex items-center gap-3">
              {order.status === "draft" && !order.stripePaymentId && (
                <PayButton orderId={order.id} />
              )}
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
          </div>
          <dl className="grid gap-2 text-sm">
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Pickup</dt>
              <dd>
                {new Date(order.pickupDate).toLocaleDateString()} –{" "}
                {order.pickupAddress.street}, {order.pickupAddress.city},{" "}
                {order.pickupAddress.state} {order.pickupAddress.zip}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Delivery</dt>
              <dd>
                {new Date(order.deliveryDate).toLocaleDateString()} –{" "}
                {order.deliveryAddress.street}, {order.deliveryAddress.city},{" "}
                {order.deliveryAddress.state} {order.deliveryAddress.zip}
              </dd>
            </div>
            {order.notes && (
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">Notes</dt>
                <dd>{order.notes}</dd>
              </div>
            )}
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Total</dt>
              <dd>${(order.totalCents / 100).toFixed(2)}</dd>
            </div>
          </dl>
        </div>

        {order.statusHistory.length > 0 && (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6">
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-4">
              Status history
            </h2>
            <ul className="space-y-3">
              {order.statusHistory.map((h) => (
                <li key={h.id} className="flex gap-3 text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400 shrink-0">
                    {new Date(h.createdAt).toLocaleString()}
                  </span>
                  <span className="font-medium">
                    {statusLabel[h.status] ?? h.status}
                  </span>
                  {h.note && (
                    <span className="text-zinc-600 dark:text-zinc-400">
                      – {h.note}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
