"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

const inputClass =
  "mt-1 block w-full rounded-lg border border-fern-200 bg-white px-3 py-2.5 text-fern-900 placeholder-fern-400 focus:border-fern-500 focus:outline-none focus:ring-2 focus:ring-fern-500/20 transition-colors";
const labelClass = "block text-sm font-medium text-fern-700";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }
      const redirect = res?.url ?? callbackUrl;
      router.push(redirect);
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-fern-50 px-4">
      <div className="w-full max-w-sm space-y-8 rounded-2xl border border-fern-200/80 bg-white p-8 shadow-lg shadow-fern-900/5">
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="flex items-center justify-center gap-2 text-fern-900 mb-4">
            <img src="/doorstep/doorstep-logo-icon.svg" alt="" className="h-12 w-auto" />
            <img src="/doorstep/doorstep-logo-wordmark.svg" alt="Doorstep" className="h-8 w-auto" />
          </Link>
          <img src="/doorstep/doorstep-logo-subtext.svg" alt="" className="h-10 w-auto opacity-90" />
          <h1 className="mt-6 text-2xl font-semibold text-fern-900">
            Sign in
          </h1>
        </div>
        <form onSubmit={handleCredentials} className="space-y-5">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
          <div>
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="password" className={labelClass}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-fern-500 text-white py-2.5 px-4 font-medium hover:bg-fern-600 disabled:opacity-50 transition-colors"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        {process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true" && (
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-fern-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-fern-500">Or</span>
            </div>
          </div>
        )}
        {process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true" && (
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl })}
            className="w-full rounded-lg border border-fern-200 bg-white py-2 px-4 font-medium text-fern-700 hover:bg-fern-50 transition-colors"
          >
            Sign in with Google
          </button>
        )}
        <p className="text-center text-sm text-fern-600">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-fern-600 hover:text-fern-700">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
