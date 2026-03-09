"use client";

function PdfIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9h6M9 13h6M9 17h4" />
    </svg>
  );
}

const iconBtnClass =
  "rounded-lg border p-2 transition-colors inline-flex items-center justify-center border-fern-200 bg-white text-fern-700 hover:bg-fern-50 hover:border-fern-300";

export function ReceiptDownloadButton({
  orderId,
  variant = "button",
}: {
  orderId: string;
  variant?: "button" | "icon";
}) {
  const href = `/api/orders/${orderId}/receipt`;

  if (variant === "icon") {
    return (
      <a
        href={href}
        download
        aria-label="Download receipt (PDF)"
        title="Download receipt"
        className={iconBtnClass}
      >
        <PdfIcon />
      </a>
    );
  }

  return (
    <a
      href={href}
      download
      className="rounded-lg border border-fern-200 bg-white px-4 py-2 font-medium text-fern-700 hover:bg-fern-50 transition-colors inline-flex items-center gap-2"
    >
      <PdfIcon className="w-4 h-4" />
      Download receipt
    </a>
  );
}
