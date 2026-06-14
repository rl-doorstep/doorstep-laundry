/**
 * Smarty US Street Address API wrapper.
 * Docs: https://www.smarty.com/docs/cloud/us-street-api
 * Env vars: SMARTY_AUTH_ID, SMARTY_AUTH_TOKEN
 */

export type SmartyResult = {
  valid: true;
  street: string;
  city: string;
  state: string;
  zip: string;
  lat: number | null;
  lng: number | null;
  needsSecondary: boolean;
} | {
  valid: false;
  message: string;
};

type SmartyCandidate = {
  delivery_line_1?: string;
  components?: {
    primary_number?: string;
    street_predirection?: string;
    street_name?: string;
    street_suffix?: string;
    street_postdirection?: string;
    secondary_designator?: string;
    secondary_number?: string;
    city_name?: string;
    state_abbreviation?: string;
    zipcode?: string;
    plus4_code?: string;
  };
  metadata?: {
    latitude?: number;
    longitude?: number;
  };
  analysis?: {
    dpv_match_code?: string; // Y=confirmed, S=confirmed+secondary, D=needs secondary, N=unconfirmed
  };
};

function buildStreet(c: SmartyCandidate["components"]): string {
  if (!c) return "";
  return [
    c.primary_number,
    c.street_predirection,
    c.street_name,
    c.street_suffix,
    c.street_postdirection,
    c.secondary_designator,
    c.secondary_number,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export async function smartyVerifyAddress(parts: {
  street: string;
  city: string;
  state: string;
  zip: string;
}): Promise<SmartyResult> {
  const authId = process.env.SMARTY_AUTH_ID;
  const authToken = process.env.SMARTY_AUTH_TOKEN;

  if (!authId || !authToken) {
    return { valid: false, message: "Address verification is not configured." };
  }

  const params = new URLSearchParams({
    "auth-id": authId,
    "auth-token": authToken,
    street: parts.street.trim(),
    city: parts.city.trim(),
    state: parts.state.trim(),
    zipcode: parts.zip.trim(),
    candidates: "1",
  });

  let candidates: SmartyCandidate[];
  try {
    const res = await fetch(
      `https://us-street.api.smarty.com/street-address?${params.toString()}`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) {
      console.error("[smarty] API error:", res.status, await res.text().catch(() => ""));
      return { valid: false, message: "Address verification is not configured." };
    }
    candidates = (await res.json()) as SmartyCandidate[];
  } catch (e) {
    console.error("[smarty] request failed:", e);
    return { valid: false, message: "Address verification request failed." };
  }

  if (!Array.isArray(candidates) || candidates.length === 0) {
    return { valid: false, message: "Address not found." };
  }

  const hit = candidates[0];
  const dpv = hit.analysis?.dpv_match_code ?? "";

  // N = not a deliverable address
  if (dpv === "N" || dpv === "") {
    return { valid: false, message: "Address not found or not deliverable." };
  }

  const c = hit.components ?? {};
  const street = buildStreet(c);
  const city = c.city_name ?? parts.city;
  const state = c.state_abbreviation ?? parts.state;
  const zip = c.zipcode ?? parts.zip;
  const lat = hit.metadata?.latitude ?? null;
  const lng = hit.metadata?.longitude ?? null;

  return {
    valid: true,
    street,
    city,
    state,
    zip,
    lat,
    lng,
    // D = deliverable but needs a secondary (apt/unit) to be confirmed
    needsSecondary: dpv === "D",
  };
}
