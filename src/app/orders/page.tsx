import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/app-header";
import { OrdersTable } from "./orders-table";

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const role = (session.user as { role: string }).role;
  if (role !== "staff" && role !== "admin") redirect("/dashboard");

  const orders = await prisma.order.findMany({
    where: { status: { notIn: ["draft", "cancelled"] } },
    orderBy: { pickupDate: "asc" },
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      pickupAddress: true,
      deliveryAddress: true,
      orderLoads: { orderBy: { loadNumber: "asc" } },
    },
  });

  return (
    <div className="min-h-screen bg-fern-50">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-xl font-semibold text-fern-900 mb-2">
          Orders
        </h1>
        <p className="text-sm text-fern-600 mb-6">
          One row per order. Status is &quot;In progress&quot; when any load has started; &quot;Ready for delivery&quot; when all loads are folded.
        </p>
        <OrdersTable initialOrders={orders} />
      </main>
    </div>
  );
}
