import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <header className="border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
        <div className="mx-auto max-w-5xl px-4 py-4 flex justify-between items-center">
          <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Doorstep Laundry
          </span>
          <nav className="flex gap-6">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-4 py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl">
            Laundry pickup and delivery, at your door
          </h1>
          <p className="mt-6 text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Schedule a pickup, we wash and fold, then deliver back to you. No
            hassle, no trips to the laundromat.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-3 text-base font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200"
            >
              Get started
            </Link>
            <Link
              href="/book"
              className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-6 py-3 text-base font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700"
            >
              Book a pickup
            </Link>
          </div>
        </section>

        <section className="border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
          <div className="mx-auto max-w-5xl px-4 py-16">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 text-center">
              How it works
            </h2>
            <ul className="mt-12 grid gap-10 sm:grid-cols-3">
              <li className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-600 text-zinc-900 dark:text-zinc-100 font-semibold">
                  1
                </div>
                <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">
                  Schedule
                </h3>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                  Pick a pickup and delivery date. Add your address and we&apos;ll
                  handle the rest.
                </p>
              </li>
              <li className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-600 text-zinc-900 dark:text-zinc-100 font-semibold">
                  2
                </div>
                <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">
                  We pick up & wash
                </h3>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                  Our team picks up your laundry, washes and folds it at our
                  facility.
                </p>
              </li>
              <li className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-600 text-zinc-900 dark:text-zinc-100 font-semibold">
                  3
                </div>
                <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">
                  Delivered back
                </h3>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                  We deliver clean, folded laundry to your door on your chosen
                  date.
                </p>
              </li>
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-16 text-center">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Ready to try it?
          </h2>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            Create an account to book your first pickup.
          </p>
          <div className="mt-8">
            <Link
              href="/signup"
              className="inline-flex rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-3 text-base font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200"
            >
              Sign up
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-700 py-8">
        <div className="mx-auto max-w-5xl px-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Doorstep Laundry Service
        </div>
      </footer>
    </div>
  );
}
