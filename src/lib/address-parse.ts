/**
 * Parse address components (e.g. from Google Places or Geocoding) into street, city, state, zip.
 * Handles US-style addresses; uses locality or sublocality for city.
 */
export type AddressParts = {
  street: string;
  city: string;
  state: string;
  zip: string;
};

export type AddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

function getComponent(
  components: AddressComponent[],
  type: string
): string {
  const c = components.find((x) => x.types.includes(type));
  return c?.long_name ?? "";
}

function getShortComponent(
  components: AddressComponent[],
  type: string
): string {
  const c = components.find((x) => x.types.includes(type));
  return c?.short_name ?? "";
}

/**
 * Build AddressParts from Google-style address_components array.
 */
export function parseAddressComponents(components: AddressComponent[]): AddressParts {
  const streetNumber = getComponent(components, "street_number");
  const route = getComponent(components, "route");
  const street = [streetNumber, route].filter(Boolean).join(" ").trim() || getComponent(components, "premise");
  const city =
    getComponent(components, "locality") ||
    getComponent(components, "sublocality_level_1") ||
    getComponent(components, "sublocality") ||
    getComponent(components, "administrative_area_level_2");
  const state = getShortComponent(components, "administrative_area_level_1");
  const zip = getComponent(components, "postal_code");
  return { street, city, state, zip };
}
