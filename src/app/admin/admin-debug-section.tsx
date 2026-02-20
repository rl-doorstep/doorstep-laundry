"use client";

import { useState } from "react";
import { DebugTools } from "@/app/debug/debug-tools";

export function AdminDebugSection() {
  const [showDebug, setShowDebug] = useState(false);

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <input
          type="checkbox"
          id="admin-show-debug"
          checked={showDebug}
          onChange={(e) => setShowDebug(e.target.checked)}
          className="h-4 w-4 rounded border-fern-300 text-fern-600 focus:ring-fern-500"
        />
        <label htmlFor="admin-show-debug" className="text-sm font-medium text-fern-900 cursor-pointer">
          Show debug tools (Twilio, Resend, route optimization)
        </label>
      </div>
      {showDebug && (
        <div className="mt-2">
          <DebugTools />
        </div>
      )}
    </section>
  );
}
