import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/app-header";
import { StaffDashboard } from "./staff-dashboard";

export default async function StaffPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const role = (session.user as { role: string }).role;
  if (role !== "staff" && role !== "admin") redirect("/dashboard");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  const orders = await prisma.order.findMany({
    where: {
      pickupDate: { gte: today, lte: endOfToday },
    },
    orderBy: { pickupDate: "asc" },
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      pickupAddress: true,
      deliveryAddress: true,
    },
  });

  return (
    <div className="min-h-screen bg-fern-50">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-xl font-semibold text-fern-900 mb-6">
          Staff – Today&apos;s loads
        </h1>
        <StaffDashboard initialOrders={orders} />
      </main>
    </div>
  );
}
