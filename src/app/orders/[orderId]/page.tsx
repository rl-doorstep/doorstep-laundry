import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTimeSlotById } from "@/lib/slots";
import { AppHeader } from "@/components/app-header";
import { DeleteDraftOrderButton } from "@/components/delete-draft-order-button";
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
    <div className="min-h-screen bg-fern-50">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-fern-900 font-mono">
            {order.orderNumber}
          </h1>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-fern-600 hover:text-fern-900 transition-colors"
          >
            Back
          </Link>
        </div>
        <div className="rounded-2xl border border-fern-200/80 bg-white p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-fern-500">Status</span>
            <div className="flex items-center gap-2 flex-wrap">
              {order.status === "draft" && !order.stripePaymentId && (
                <PayButton orderId={order.id} variant="icon" />
              )}
              {order.status === "draft" && (
                <Link
                  href={`/orders/${order.id}/edit`}
                  className="rounded-lg border border-fern-200 bg-white p-2 text-fern-700 hover:bg-fern-50 transition-colors inline-flex items-center justify-center"
                  aria-label="Edit order"
                  title="Edit order"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </Link>
              )}
              {order.status === "draft" && (
                <DeleteDraftOrderButton orderId={order.id} variant="icon" />
              )}
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
          </div>
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-fern-500">Pickup</dt>
              <dd className="text-fern-900 mt-0.5">
                {new Date(order.pickupDate).toLocaleDateString()}
                {order.pickupTimeSlot && (
                  <span className="text-fern-600">
                    {" "}({getTimeSlotById(order.pickupTimeSlot)?.label ?? order.pickupTimeSlot})
                  </span>
                )}
                {" – "}
                {order.pickupAddress.street}, {order.pickupAddress.city},{" "}
                {order.pickupAddress.state} {order.pickupAddress.zip}
              </dd>
            </div>
            <div>
              <dt className="text-fern-500">Delivery</dt>
              <dd className="text-fern-900 mt-0.5">
                {new Date(order.deliveryDate).toLocaleDateString()}
                {order.deliveryTimeSlot && (
                  <span className="text-fern-600">
                    {" "}({getTimeSlotById(order.deliveryTimeSlot)?.label ?? order.deliveryTimeSlot})
                  </span>
                )}
                {" – "}
                {order.deliveryAddress.street}, {order.deliveryAddress.city},{" "}
                {order.deliveryAddress.state} {order.deliveryAddress.zip}
              </dd>
            </div>
            {order.notes && (
              <div>
                <dt className="text-fern-500">Notes</dt>
                <dd className="text-fern-900 mt-0.5">{order.notes}</dd>
              </div>
            )}
            <div>
              <dt className="text-fern-500">Loads</dt>
              <dd className="text-fern-900 mt-0.5 font-medium">{(order as { numberOfLoads?: number }).numberOfLoads ?? 1}</dd>
            </div>
            <div>
              <dt className="text-fern-500">Total</dt>
              <dd className="text-fern-900 mt-0.5 font-medium">${(order.totalCents / 100).toFixed(2)}</dd>
            </div>
          </dl>
        </div>

        {order.statusHistory.length > 0 && (
          <div className="rounded-2xl border border-fern-200/80 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-medium text-fern-900 mb-4">
              Status history
            </h2>
            <ul className="space-y-3">
              {order.statusHistory.map((h) => (
                <li key={h.id} className="flex gap-3 text-sm">
                  <span className="text-fern-500 shrink-0">
                    {new Date(h.createdAt).toLocaleString()}
                  </span>
                  <span className="font-medium text-fern-800">
                    {statusLabel[h.status] ?? h.status}
                  </span>
                  {h.note && (
                    <span className="text-fern-600">
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
