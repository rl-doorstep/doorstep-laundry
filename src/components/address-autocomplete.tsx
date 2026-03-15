"use client";

import { useEffect, useRef } from "react";
import { parseAddressComponents, type AddressParts } from "@/lib/address-parse";

type PlaceResult = {
  address_components?: Array<{ long_name: string; short_name: string; types: string[] }>;
};

export type AddressAutocompleteProps = {
  /** Google Maps API key (client-side). Use NEXT_PUBLIC_GOOGLE_MAPS_API_KEY. */
  apiKey: string | undefined;
  /** Whether the script has finished loading. */
  scriptLoaded: boolean;
  /** Called when user selects an address from suggestions. */
  onSelect: (address: AddressParts) => void;
  /** Placeholder for the input. */
  placeholder?: string;
  /** Optional initial value (e.g. combined address string for display). */
  value?: string;
  /** Input className. */
  className?: string;
  /** Optional id for the input. */
  id?: string;
};

export function AddressAutocomplete({
  apiKey,
  scriptLoaded,
  onSelect,
  placeholder = "Start typing your address…",
  value = "",
  className,
  id,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!scriptLoaded || !apiKey || !inputRef.current || typeof google === "undefined") return;
    if (autocompleteRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ["address"],
      componentRestrictions: { country: "us" },
      fields: ["address_components"],
    });

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace() as PlaceResult;
      const components = place?.address_components;
      if (!Array.isArray(components) || components.length === 0) return;
      const parts = parseAddressComponents(components);
      onSelect(parts);
    });

    autocompleteRef.current = autocomplete;
    return () => {
      if (listener) google.maps.event.removeListener(listener);
      autocompleteRef.current = null;
    };
  }, [scriptLoaded, apiKey, onSelect]);

  return (
    <input
      ref={inputRef}
      type="text"
      id={id}
      autoComplete="off"
      placeholder={placeholder}
      defaultValue={value}
      className={className}
      aria-label="Address search"
    />
  );
}
