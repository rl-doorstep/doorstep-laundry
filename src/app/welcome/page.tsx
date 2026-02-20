import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function WelcomePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const role = (session.user as { role?: string }).role;
  if (role === "staff" || role === "admin") redirect("/staff");
  redirect("/dashboard");
}
