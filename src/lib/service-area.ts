import { getCompanyInfo, getMaxServiceDistanceMiles } from "@/lib/settings";

type LatLng = { lat: number; lng: number };

type GeocodeResponse = {
  results?: Array<{
    geometry?: { location?: { lat: number; lng: number } };
  }>;
  status?: string;
};

let facilityLatLngCache: { at: number; value: LatLng | null; address: string } | null = null;
const FACILITY_CACHE_MS = 5 * 60 * 1000;

export function haversineMiles(a: LatLng, b: LatLng): number {
  const R = 3958.7613; // Earth radius in miles (mean)
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export async function geocodeToLatLng(fullAddress: string): Promise<LatLng | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key || !fullAddress.trim()) return null;
  const url =
    "https://maps.googleapis.com/maps/api/geocode/json?" +
    new URLSearchParams({
      address: fullAddress.trim(),
      key,
    }).toString();
  try {
    const res = await fetch(url);
    const data = (await res.json()) as GeocodeResponse;
    if (data.status !== "OK" || !data.results?.[0]?.geometry?.location) {
      return null;
    }
    const { lat, lng } = data.results[0].geometry.location;
    if (typeof lat !== "number" || typeof lng !== "number") return null;
    return { lat, lng };
  } catch (e) {
    console.error("[service-area] geocode failed:", e);
    return null;
  }
}

function formatAddressLine(parts: {
  street: string;
  city: string;
  state: string;
  zip: string;
}): string {
  return [parts.street, parts.city, parts.state, parts.zip].filter(Boolean).join(", ");
}

async function getFacilityLatLng(facilityAddress: string): Promise<LatLng | null> {
  const now = Date.now();
  if (
    facilityLatLngCache &&
    facilityLatLngCache.address === facilityAddress &&
    now - facilityLatLngCache.at < FACILITY_CACHE_MS
  ) {
    return facilityLatLngCache.value;
  }
  const value = await geocodeToLatLng(facilityAddress);
  facilityLatLngCache = { at: now, value, address: facilityAddress };
  return value;
}

export type ServiceAreaResult = { ok: true } | { ok: false; error: string };

/**
 * When max distance is 0 or facility address is empty, always ok.
 * When max > 0, requires GOOGLE_MAPS_API_KEY and valid geocodes for both addresses.
 */
export async function checkAddressWithinServiceArea(parts: {
  street: string;
  city: string;
  state: string;
  zip: string;
}): Promise<ServiceAreaResult> {
  const maxMiles = await getMaxServiceDistanceMiles();
  if (maxMiles <= 0) {
    return { ok: true };
  }

  const company = await getCompanyInfo();
  const facilityAddress = company.address.trim();
  if (!facilityAddress) {
    return { ok: true };
  }

  if (!process.env.GOOGLE_MAPS_API_KEY) {
    return {
      ok: false,
      error:
        "Service area is configured but address verification is unavailable. Please try again later or contact us.",
    };
  }

  const customerLine = formatAddressLine(parts);
  if (!customerLine.trim()) {
    return { ok: false, error: "Address is required." };
  }

  const [facility, customer] = await Promise.all([
    getFacilityLatLng(facilityAddress),
    geocodeToLatLng(customerLine),
  ]);

  if (!facility) {
    return {
      ok: false,
      error:
        "We couldn’t verify our facility location for distance. Please contact us or try again later.",
    };
  }

  if (!customer) {
    return {
      ok: false,
      error:
        "We couldn’t verify that address. Please check the street, city, state, and ZIP and try again.",
    };
  }

  const miles = haversineMiles(facility, customer);
  if (miles > maxMiles) {
    const roundedMax =
      maxMiles >= 10 ? Math.round(maxMiles) : Math.round(maxMiles * 10) / 10;
    return {
      ok: false,
      error: `This address is outside our service area—we currently serve within about ${roundedMax} miles (straight-line) of our facility. Please use a closer address or contact us for help.`,
    };
  }

  return { ok: true };
}
