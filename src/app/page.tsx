export default function ComingSoonPage() {
  return (
    <div className="min-h-screen bg-fern-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="flex justify-center mb-8">
          <img
            src="/doorstep/doorstep-laundry-logo-v3.svg"
            alt="Doorstep Laundry"
            className="h-20 w-auto sm:h-24"
          />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-fern-900 sm:text-4xl">
          Something fresh is on the way
        </h1>
        <p className="mt-4 text-lg text-fern-600">
          Laundry pickup and delivery, at your door. We&apos;re getting ready to launch.
        </p>
        <p className="mt-2 text-sm text-fern-500">
          Check back soon.
        </p>
      </div>
      <footer className="mt-16 text-sm text-fern-400">
        Doorstep Laundry · wash · fold · delivered
      </footer>
    </div>
  );
}
