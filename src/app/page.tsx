import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-fern-50">
      <header className="border-b border-fern-200/80 bg-white shadow-sm">
        <div className="mx-auto max-w-5xl px-4 py-4 flex justify-between items-center">
          <span className="text-lg font-semibold text-fern-900">
            Doorstep Laundry
          </span>
          <nav className="flex gap-6">
            <Link
              href="/login"
              className="text-sm font-medium text-fern-600 hover:text-fern-900 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-fern-500 text-white px-4 py-2 text-sm font-medium hover:bg-fern-600 transition-colors shadow-sm"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-4 py-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-fern-900 sm:text-5xl">
            Laundry pickup and delivery, at your door
          </h1>
          <p className="mt-6 text-lg text-fern-600 max-w-2xl mx-auto">
            Schedule a pickup, we wash and fold, then deliver back to you. No
            hassle, no trips to the laundromat.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-xl bg-fern-500 text-white px-6 py-3 text-base font-medium hover:bg-fern-600 transition-colors shadow-md"
            >
              Get started
            </Link>
            <Link
              href="/book"
              className="rounded-xl border-2 border-fern-300 bg-white text-fern-700 px-6 py-3 text-base font-medium hover:bg-fern-50 hover:border-fern-400 transition-colors"
            >
              Book a pickup
            </Link>
          </div>
        </section>

        <section className="border-t border-fern-200/80 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-20">
            <h2 className="text-2xl font-semibold text-fern-900 text-center">
              How it works
            </h2>
            <ul className="mt-14 grid gap-12 sm:grid-cols-3">
              <li className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-fern-100 text-fern-700 font-semibold text-lg">
                  1
                </div>
                <h3 className="mt-5 text-lg font-medium text-fern-900">
                  Schedule
                </h3>
                <p className="mt-2 text-fern-600">
                  Pick a pickup and delivery date. Add your address and we&apos;ll
                  handle the rest.
                </p>
              </li>
              <li className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-fern-100 text-fern-700 font-semibold text-lg">
                  2
                </div>
                <h3 className="mt-5 text-lg font-medium text-fern-900">
                  We pick up & wash
                </h3>
                <p className="mt-2 text-fern-600">
                  Our team picks up your laundry, washes and folds it at our
                  facility.
                </p>
              </li>
              <li className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-fern-100 text-fern-700 font-semibold text-lg">
                  3
                </div>
                <h3 className="mt-5 text-lg font-medium text-fern-900">
                  Delivered back
                </h3>
                <p className="mt-2 text-fern-600">
                  We deliver clean, folded laundry to your door on your chosen
                  date.
                </p>
              </li>
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-20 text-center bg-fern-50">
          <h2 className="text-2xl font-semibold text-fern-900">
            Ready to try it?
          </h2>
          <p className="mt-4 text-fern-600">
            Create an account to book your first pickup.
          </p>
          <div className="mt-8">
            <Link
              href="/signup"
              className="inline-flex rounded-xl bg-fern-500 text-white px-6 py-3 text-base font-medium hover:bg-fern-600 transition-colors shadow-md"
            >
              Sign up
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-fern-200/80 bg-white py-8">
        <div className="mx-auto max-w-5xl px-4 text-center text-sm text-fern-500">
          Doorstep Laundry Service
        </div>
      </footer>
    </div>
  );
}
