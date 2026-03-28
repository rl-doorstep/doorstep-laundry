"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function VerifyEmailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("This verification link is missing a token.");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setStatus("error");
          setErrorMessage(
            typeof data.error === "string"
              ? data.error
              : "Verification link is invalid or expired."
          );
          return;
        }
        setStatus("ok");
        router.replace("/login?verified=1");
      } catch {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage("Something went wrong. Please try again.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  if (status === "loading") {
    return <p className="text-sm text-fern-600">Verifying your email…</p>;
  }

  if (status === "error") {
    return (
      <div className="space-y-4 text-left">
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {errorMessage}
        </p>
        <p className="text-sm text-fern-600">
          You can request a new link from the sign-in page if you still need to verify.
        </p>
        <Link
          href="/login"
          className="inline-block w-full text-center rounded-lg bg-fern-500 text-white py-2.5 px-4 text-sm font-medium hover:bg-fern-600"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return <p className="text-sm text-fern-600">Redirecting to sign in…</p>;
}
