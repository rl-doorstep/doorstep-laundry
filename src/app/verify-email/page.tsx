import Link from "next/link";
import { Suspense } from "react";
import { VerifyEmailClient } from "./verify-email-client";

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-fern-50 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-fern-200/80 bg-white p-8 shadow-lg shadow-fern-900/5 text-center">
        <h1 className="text-xl font-semibold text-fern-900">Verify email</h1>
        <Suspense
          fallback={
            <p className="text-sm text-fern-600">Verifying your email…</p>
          }
        >
          <VerifyEmailClient />
        </Suspense>
        <p className="text-sm text-fern-600">
          <Link
            href="/login"
            className="font-medium text-fern-600 hover:text-fern-700"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
