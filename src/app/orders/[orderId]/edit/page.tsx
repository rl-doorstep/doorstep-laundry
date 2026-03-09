import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/app-header";
import { BookForm, type BookFormInitialOrder } from "@/app/book/book-form";
import type { Address } from "@prisma/client";

export default async function OrderEditPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const userId = (session.user as { id: string }).id;
  const { orderId } = await params;

  const [order, userAddresses] = await Promise.all([
    prisma.order.findUnique({
      where: { id: orderId },
      include: {
        pickupAddress: true,
        deliveryAddress: true,
      },
    }),
    prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    }),
  ]);

  if (!order) notFound();
  if (order.customerId !== userId) redirect("/dashboard");
  if (order.status !== "scheduled") redirect(`/orders/${orderId}`);

  const addresses: Address[] = [...userAddresses];
  if (order.pickupAddress && !addresses.some((a) => a.id === order.pickupAddressId)) {
    addresses.unshift(order.pickupAddress as Address);
  }
  if (
    order.deliveryAddress &&
    !addresses.some((a) => a.id === order.deliveryAddressId)
  ) {
    addresses.unshift(order.deliveryAddress as Address);
  }

  const initialOrder: BookFormInitialOrder = {
    numberOfLoads: order.numberOfLoads,
    pickupDate: order.pickupDate,
    deliveryDate: order.deliveryDate,
    pickupTimeSlot: order.pickupTimeSlot ?? "morning",
    deliveryTimeSlot: order.deliveryTimeSlot ?? "morning",
    pickupAddressId: order.pickupAddressId,
    deliveryAddressId: order.deliveryAddressId,
    notes: order.notes ?? "",
  };

  return (
    <div className="min-h-screen bg-fern-50">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-fern-900">
            Edit order {order.orderNumber}
          </h1>
          <Link
            href={`/orders/${orderId}`}
            className="text-sm font-medium text-fern-600 hover:text-fern-900"
          >
            Cancel
          </Link>
        </div>
        <BookForm
          addresses={addresses}
          editOrderId={orderId}
          initialOrder={initialOrder}
        />
      </main>
    </div>
  );
}
