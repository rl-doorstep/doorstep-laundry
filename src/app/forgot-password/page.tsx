import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ForgotPasswordForm } from "./forgot-password-form";

export default async function ForgotPasswordPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/welcome");

  return <ForgotPasswordForm />;
}
