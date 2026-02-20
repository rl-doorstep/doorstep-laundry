import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/welcome");

  return <ResetPasswordForm />;
}
