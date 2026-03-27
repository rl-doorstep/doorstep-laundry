"use client";

import { useEffect, useState } from "react";

const SCRIPT_URL = "https://maps.googleapis.com/maps/api/js";
const CALLBACK_NAME = "__googleMapsPlacesReady__";

declare global {
  interface Window {
    [CALLBACK_NAME]?: () => void;
    google?: {
      maps: {
        places: unknown;
      };
    };
  }
}

/**
 * Loads the Google Maps JavaScript API with the Places library.
 * Use NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (or same key as server with HTTP referrer restrictions).
 */
export function useGoogleMapsScript(apiKey: string | undefined) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiKey?.trim()) {
      return;
    }
    if (typeof window === "undefined") {
      return;
    }
    if (window.google?.maps?.places) {
      queueMicrotask(() => setLoaded(true));
      return;
    }
    const existing = document.querySelector(
      `script[src^="${SCRIPT_URL}"]`
    );
    if (existing) {
      const check = () => {
        if (window.google?.maps?.places) setLoaded(true);
        else setTimeout(check, 100);
      };
      check();
      return;
    }
    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.src = `${SCRIPT_URL}?key=${encodeURIComponent(apiKey)}&libraries=places&callback=${CALLBACK_NAME}`;
    window[CALLBACK_NAME] = () => {
      if (window.google?.maps?.places) {
        setLoaded(true);
      } else {
        setError("Places library failed to load");
      }
    };
    script.onerror = () => setError("Failed to load Google Maps script");
    document.head.appendChild(script);
    return () => {
      delete window[CALLBACK_NAME];
    };
  }, [apiKey]);

  return { loaded, error };
}
