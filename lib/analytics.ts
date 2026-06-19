'use client';

// Pixel ID mirrored from app/layout.tsx. Pixel IDs aren't secrets — they're
// already exposed in the client bundle — so reading the public env var is fine.
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

// First-party cookie that persists hashed Advanced Matching across pages and
// sessions, so every PageView (not just the one right after form-fill) ships
// with user identity and EMQ stays high. 30-day TTL aligns with Meta's
// attribution window. Read by the inline pixel script in app/layout.tsx BEFORE
// the first PageView fires, and re-applied on success pages via
// reapplyMamFromCookie(). Same-origin only, SameSite=Lax.
const MAM_COOKIE_NAME = 'sdp_mam';
const MAM_COOKIE_TTL_SECONDS = 30 * 24 * 60 * 60;

interface MAMInput {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  country?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTE — Meta Health & Wellness restriction (see META_HW_HARDENING.md)
// This dataset is categorized "Health and wellness condition" in Events Manager,
// which blocks mid/lower-funnel STANDARD events BY NAME (Purchase, AddToCart,
// InitiateCheckout, Subscribe, Lead). There is therefore INTENTIONALLY no
// browser-side `Purchase` (or any standard conversion) helper here — the only
// browser events are PageView + Advanced Matching identity. The single
// conversion signal is the server-side custom event `SDPPurchase` fired from the
// CAPI route (app/api/razorpay/verify-payment/route.ts). If a browser-side
// conversion pair is ever needed, it MUST be the *custom* event (SDPPurchase),
// never the reserved `Purchase` — re-adding `Purchase` re-triggers the block.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SHA-256 hex via the Web Crypto API. We pre-hash so the cookie never stores
 * plain PII — Meta detects a 64-char hex string as already-hashed and uses it
 * verbatim (no double-hashing). Available over HTTPS and on http://localhost.
 */
async function sha256Hex(value: string): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) return value;
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Normalise each field per Meta's spec, SHA-256 it, and derive external_id from
 * the email hash. Returns the matching object ready for fbq init. Mirrors the
 * server CAPI normalisation so browser + server resolve to the same person.
 */
async function buildHashedMatching(data: MAMInput): Promise<Record<string, string>> {
  const normalised: Record<string, string> = {};

  if (data.email) {
    const em = data.email.trim().toLowerCase();
    if (em) normalised.em = em;
  }
  if (data.phone) {
    const ph = data.phone.replace(/\D/g, '');
    if (ph) normalised.ph = ph;
  }
  if (data.firstName) {
    const fn = data.firstName.trim().toLowerCase();
    if (fn) normalised.fn = fn;
  }
  if (data.lastName) {
    const ln = data.lastName.trim().toLowerCase();
    if (ln) normalised.ln = ln;
  }
  if (data.city) {
    const ct = data.city.trim().toLowerCase().replace(/[^a-z]/g, '');
    if (ct) normalised.ct = ct;
  }
  if (data.country) {
    const country = data.country.trim().toLowerCase();
    if (country) normalised.country = country;
  }

  const keys = Object.keys(normalised);
  const hashes = await Promise.all(keys.map((k) => sha256Hex(normalised[k])));
  const matching: Record<string, string> = {};
  keys.forEach((k, i) => { matching[k] = hashes[i]; });

  // external_id = sha256(normalised email): stable per-user identifier that MUST
  // match the CAPI value so the browser pixel and server CAPI tie to one user.
  if (matching.em) matching.external_id = matching.em;

  return matching;
}

function writeMamCookie(matching: Record<string, string>): void {
  if (typeof document === 'undefined') return;
  if (Object.keys(matching).length === 0) return;
  const value = encodeURIComponent(JSON.stringify(matching));
  document.cookie = `${MAM_COOKIE_NAME}=${value}; Path=/; Max-Age=${MAM_COOKIE_TTL_SECONDS}; SameSite=Lax`;
}

export function readMamCookie(): Record<string, string> | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${MAM_COOKIE_NAME}=([^;]+)`));
  if (!match) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(match[1]));
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Manual Advanced Matching for the Meta Pixel. Pass raw form values — this
 * helper SHA-256 hashes them client-side, persists the hashes to the sdp_mam
 * cookie, then re-inits the pixel so every subsequent event inherits identity.
 * Call on form-fill (debounced), on payment success, and (via
 * reapplyMamFromCookie) on success-page mount.
 */
export async function setMetaAdvancedMatching(data: MAMInput): Promise<void> {
  if (typeof window === 'undefined' || !window.fbq || !META_PIXEL_ID) return;
  const matching = await buildHashedMatching(data);
  if (Object.keys(matching).length === 0) return;
  window.fbq('init', META_PIXEL_ID, matching);
  writeMamCookie(matching);
}

/**
 * Re-fire MAM from the persisted cookie. Used on success-page mount as a safety
 * net in case the inline pixel script raced the route change OR the form-fill
 * MAM call didn't finish before redirect. fbq init is idempotent.
 */
export function reapplyMamFromCookie(): void {
  if (typeof window === 'undefined' || !window.fbq || !META_PIXEL_ID) return;
  const matching = readMamCookie();
  if (!matching || Object.keys(matching).length === 0) return;
  window.fbq('init', META_PIXEL_ID, matching);
}
