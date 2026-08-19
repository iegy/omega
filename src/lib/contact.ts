/** Helpers for turning stored (editable) contact data into usable links. */

/** Egypt country code, used to build international WhatsApp links. */
const EGYPT_DIAL_CODE = "20";

export function telHref(phone: string | null | undefined): string | null {
  if (!phone) return null;
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/**
 * WhatsApp deep link. Local numbers such as `01050607688` become `201050607688`.
 */
export function whatsappHref(
  phone: string | null | undefined,
  message?: string,
): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  const international = digits.startsWith("0")
    ? `${EGYPT_DIAL_CODE}${digits.slice(1)}`
    : digits;
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${international}${query}`;
}

export function mapsEmbedSrc(
  latitude: number | null,
  longitude: number | null,
): string | null {
  if (latitude === null || longitude === null) return null;
  // Keyless embed — no paid Google Maps API needed (spec M).
  const delta = 0.004;
  const bbox = [
    longitude - delta,
    latitude - delta / 2,
    longitude + delta,
    latitude + delta / 2,
  ].join("%2C");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude}%2C${longitude}`;
}

export function mapsViewHref(
  latitude: number | null,
  longitude: number | null,
  fallback?: string | null,
): string | null {
  if (fallback) return fallback;
  if (latitude === null || longitude === null) return null;
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

export function directionsHref(
  latitude: number | null,
  longitude: number | null,
  fallback?: string | null,
): string | null {
  if (fallback) return fallback;
  if (latitude === null || longitude === null) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}
