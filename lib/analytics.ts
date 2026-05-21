const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

interface MAMInput {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  country?: string;
}

/**
 * Manual Advanced Matching for the Meta Pixel.
 * Pass raw form values — the pixel SHA-256 hashes them client-side before
 * transmission. Call immediately before redirecting to a success page so
 * the next PageView inherits the matching signals.
 */
export function setMetaAdvancedMatching(data: MAMInput): void {
  if (typeof window === 'undefined' || !window.fbq || !META_PIXEL_ID) return;

  const out: Record<string, string> = {};

  if (data.email) {
    const em = data.email.trim().toLowerCase();
    if (em) {
      out.em = em;
      out.external_id = em;
    }
  }
  if (data.phone) {
    const ph = data.phone.replace(/\D/g, '');
    if (ph) out.ph = ph;
  }
  if (data.firstName) {
    const fn = data.firstName.trim().toLowerCase();
    if (fn) out.fn = fn;
  }
  if (data.lastName) {
    const ln = data.lastName.trim().toLowerCase();
    if (ln) out.ln = ln;
  }
  if (data.city) {
    const ct = data.city.trim().toLowerCase().replace(/[^a-z]/g, '');
    if (ct) out.ct = ct;
  }
  if (data.country) {
    const country = data.country.trim().toLowerCase();
    if (country) out.country = country;
  }

  if (Object.keys(out).length === 0) return;

  window.fbq('init', META_PIXEL_ID, out);
}
