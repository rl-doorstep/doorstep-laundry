"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

const inputClass =
  "mt-1 block w-full rounded-lg border border-fern-200 bg-white px-3 py-2.5 text-fern-900 placeholder-fern-400 focus:border-fern-500 focus:outline-none focus:ring-2 focus:ring-fern-500/20 transition-colors";
const labelClass = "block text-sm font-medium text-fern-700";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: name || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Sign up failed");
        setLoading(false);
        return;
      }
      router.push("/login?registered=1");
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-fern-50 px-4">
      <div className="w-full max-w-sm space-y-8 rounded-2xl border border-fern-200/80 bg-white p-8 shadow-lg shadow-fern-900/5">
        <div>
          <h1 className="text-2xl font-semibold text-fern-900">
            Create account
          </h1>
          <p className="mt-1 text-sm text-fern-500">
            Doorstep Laundry Service
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
          <div>
            <label htmlFor="name" className={labelClass}>
              Name (optional)
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>
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
              autoComplete="new-password"
              required
              minLength={8}
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
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>
        <p className="text-center text-sm text-fern-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-fern-600 hover:text-fern-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
