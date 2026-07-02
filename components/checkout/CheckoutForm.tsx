'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { setMetaAdvancedMatching } from '@/lib/analytics';
import { COUNTRIES } from '@/lib/countries';
import { COUPONS, ORIGINAL_PRICE_INR, PRICE_INR, fmtINR, type Coupon } from '@/lib/pricing';
import { captureUtm, restoreUtm } from '@/lib/utm';
import { validateFields, type FormErrors, type FormFields } from '@/lib/validation';
import type { RazorpayFailureResponse, RazorpayResponse } from '@/lib/types';

/* ============================================================
   Sub-component: country code dropdown + phone input
   ============================================================ */

interface CountryDropdownProps {
  value: string;
  countryCode: string;
  onValueChange: (v: string) => void;
  onCountryChange: (code: string) => void;
  error?: string;
  touched: boolean;
  onBlur: () => void;
}

function CountryDropdown({
  value,
  countryCode,
  onValueChange,
  onCountryChange,
  error,
  touched,
  onBlur,
}: CountryDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCountry = COUNTRIES.find(c => c.code === countryCode) ?? COUNTRIES[0];

  const filtered = search.trim()
    ? COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.dial.includes(search) ||
        c.code.toLowerCase().includes(search.toLowerCase())
      )
    : COUNTRIES;

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const hasError = touched && !!error;
  const isValid = touched && !error && value.trim().length > 0;

  return (
    <div
      ref={wrapRef}
      className={`checkout-phone-wrap${hasError ? ' input-error' : ''}${isValid ? ' input-valid' : ''}`}
    >
      <button
        type="button"
        className="country-btn"
        onClick={() => setOpen(o => !o)}
        aria-label="Select country code"
        aria-expanded={open}
      >
        <span className="country-btn-flag">{selectedCountry.flag}</span>
        <span className="country-btn-code">{selectedCountry.dial}</span>
        <span className={`country-btn-chevron${open ? ' open' : ''}`}>▾</span>
      </button>

      <input
        ref={inputRef}
        type="tel"
        className="phone-digit-input"
        placeholder={countryCode === 'IN' ? '98765 43210' : 'Phone number'}
        value={value}
        onChange={e => onValueChange(e.target.value.replace(/\D/g, ''))}
        onBlur={onBlur}
        inputMode="numeric"
        autoComplete="tel-national"
        aria-label="Phone number"
      />

      {open && (
        <div className="country-dropdown">
          <div className="country-search">
            <input
              type="text"
              placeholder="Search country..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
              aria-label="Search country"
            />
          </div>
          <div className="country-list" role="listbox">
            {filtered.map(country => (
              <div
                key={country.code}
                role="option"
                aria-selected={country.code === countryCode}
                className={`country-option${country.code === countryCode ? ' selected' : ''}`}
                onClick={() => {
                  onCountryChange(country.code);
                  setOpen(false);
                  setSearch('');
                  inputRef.current?.focus();
                }}
              >
                <span className="country-option-flag">{country.flag}</span>
                <span className="country-option-name">{country.name}</span>
                <span className="country-option-code">{country.dial}</span>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="country-empty">No results</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Sub-component: mobile summary (collapsible bar at top)
   ============================================================ */

const VALUE_BULLETS = [
  'Personalised diagnosis & fitness roadmap',
  'Honest fit check — we tell you if SDP isn’t right for you',
  'Walk-through of the 90-Day System + 10% body-weight guarantee',
];

function MobileSummary({ finalINR }: { finalINR: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="checkout-summary-mobile" onClick={() => setOpen(o => !o)}>
      <div className="checkout-summary-mobile-bar">
        <span className="checkout-summary-mobile-title">SDP Pre-Strategy Call</span>
        <div className="checkout-summary-mobile-trail">
          <span className="checkout-summary-mobile-price">{fmtINR(finalINR)}</span>
          <span className={`checkout-summary-mobile-chevron${open ? ' open' : ''}`}>▾</span>
        </div>
      </div>
      <div className={`checkout-summary-expand${open ? ' open' : ''}`}>
        <div className="checkout-summary-expand-inner">
          <div className="checkout-event-pill">
            1:1 Consultation · Refundable
          </div>
          <div className="checkout-divider" />
          <div className="checkout-value-stack">
            {VALUE_BULLETS.map(item => (
              <div key={item} className="checkout-value-item">
                <span className="checkout-check">✓</span>
                {item}
              </div>
            ))}
          </div>
          <div className="checkout-divider" />
          <div className="checkout-price-row">
            <span className="checkout-price-was">{fmtINR(ORIGINAL_PRICE_INR)}</span>
            <span className="checkout-price-now">{fmtINR(finalINR)}</span>
            <span className="checkout-save-badge">SAVE {fmtINR(ORIGINAL_PRICE_INR - finalINR)}</span>
          </div>
          <p className="checkout-guarantee">✦ 100% Refundable · Zero Risk</p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Sub-component: desktop order summary aside
   ============================================================ */

interface OrderSummaryProps {
  finalINR: number;
  couponInput: string;
  setCouponInput: (v: string) => void;
  appliedCoupon: { code: string; data: Coupon } | null;
  couponError: string | null;
  onApply: () => void;
  onRemove: () => void;
}

function OrderSummary({
  finalINR,
  couponInput,
  setCouponInput,
  appliedCoupon,
  couponError,
  onApply,
  onRemove,
}: OrderSummaryProps) {
  return (
    <aside className="checkout-summary" aria-label="Order summary">
      <p className="checkout-summary-label">ORDER SUMMARY</p>
      <h2 className="checkout-product-name">SDP Pre-Strategy Call</h2>
      <div className="checkout-event-pill">1:1 Consultation · Refundable</div>

      <div className="checkout-divider" />

      <div className="checkout-value-stack">
        {VALUE_BULLETS.map(item => (
          <div key={item} className="checkout-value-item">
            <span className="checkout-check">✓</span>
            {item}
          </div>
        ))}
      </div>

      <div className="checkout-divider" />

      <div className={`checkout-coupon${appliedCoupon ? ' is-applied' : ''}`}>
        <input
          type="text"
          className="checkout-coupon-input"
          placeholder="Have a coupon code?"
          value={couponInput}
          onChange={e => setCouponInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (!appliedCoupon) onApply();
            }
          }}
          readOnly={!!appliedCoupon}
          aria-label="Coupon code"
        />
        <button
          type="button"
          className="checkout-coupon-btn"
          onClick={appliedCoupon ? onRemove : onApply}
        >
          {appliedCoupon ? 'Remove' : 'Apply'}
        </button>
      </div>
      {couponError && <div className="checkout-coupon-msg err">{couponError}</div>}
      {appliedCoupon && (
        <div className="checkout-coupon-msg ok">✓ {appliedCoupon.data.label}</div>
      )}

      <div className="checkout-price-block">
        <div className="checkout-price-row">
          <span className="checkout-price-was">{fmtINR(ORIGINAL_PRICE_INR)}</span>
          <span className="checkout-price-now">{fmtINR(finalINR)}</span>
          <span className="checkout-save-badge">SAVE {fmtINR(ORIGINAL_PRICE_INR - finalINR)}</span>
        </div>
        <p className="checkout-guarantee">✦ 100% Refundable · Zero Risk</p>
      </div>

      <div className="checkout-coaches">
        <div className="checkout-coach-avatars">
          <div className="checkout-coach-avatar">SDP</div>
        </div>
        <div className="checkout-coach-names">
          <strong>The SDP Coaching Team</strong>
          8 yrs coaching · 550+ clients · 14 countries
        </div>
      </div>
    </aside>
  );
}

/* ============================================================
   Page entry: CheckoutForm
   ============================================================ */

export default function CheckoutForm() {
  const [fields, setFields] = useState<FormFields>({
    firstName: '', lastName: '', email: '', city: '', phone: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<keyof FormFields, boolean>>({
    firstName: false, lastName: false, email: false, city: false, phone: false,
  });
  const [countryCode, setCountryCode] = useState('IN');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; data: Coupon } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const discountPct = appliedCoupon?.data.discountPct ?? 0;
  const finalINR = Math.max(0, PRICE_INR - Math.round((PRICE_INR * discountPct) / 100));
  const isBypass = !!appliedCoupon?.data.bypassRazorpay && finalINR === 0;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }, []);

  const dismissToast = () => {
    setToast(null);
    if (toastTimer.current) clearTimeout(toastTimer.current);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    captureUtm(params);

    const paymentError = params.get('payment_error');
    if (paymentError) {
      showToast(paymentError);
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, [showToast]);

  // Fire Advanced Matching as soon as the form is fully filled + valid —
  // independent of whether the user pays. This identifies any subsequent pixel
  // events AND persists hashed identity to the sdp_mam cookie, so a later return
  // visit's PageView still ships with full identity (high EMQ). Debounced 500ms
  // so we don't re-init on every keystroke. PII is hashed client-side in
  // setMetaAdvancedMatching before anything leaves the browser.
  useEffect(() => {
    const allFilled =
      fields.firstName.trim() &&
      fields.lastName.trim() &&
      fields.email.trim() &&
      fields.city.trim() &&
      fields.phone.trim();
    if (!allFilled) return;
    if (Object.keys(validateFields(fields, countryCode)).length > 0) return;
    const selected = COUNTRIES.find((c) => c.code === countryCode) ?? COUNTRIES[0];
    const timer = setTimeout(() => {
      void setMetaAdvancedMatching({
        email:     fields.email,
        phone:     `${selected.dial}${fields.phone}`,
        firstName: fields.firstName,
        lastName:  fields.lastName,
        city:      fields.city,
        country:   countryCode,
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [fields, countryCode]);

  function handleApplyCoupon() {
    setCouponError(null);
    const code = couponInput.trim().toUpperCase();
    if (!code) { setCouponError('Enter a coupon code.'); return; }
    const data = COUPONS[code];
    if (!data) { setCouponError('Invalid coupon code.'); return; }
    setAppliedCoupon({ code, data });
    setCouponInput(code);
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError(null);
  }

  function handleChange(field: keyof FormFields, value: string) {
    setFields(f => ({ ...f, [field]: value }));
    if (touched[field]) {
      const updated = { ...fields, [field]: value };
      const newErrors = validateFields(updated, countryCode);
      setErrors(e => ({ ...e, [field]: newErrors[field] }));
    }
  }

  function handleBlur(field: keyof FormFields) {
    setTouched(t => ({ ...t, [field]: true }));
    const newErrors = validateFields(fields, countryCode);
    setErrors(e => ({ ...e, [field]: newErrors[field] }));
  }

  function handlePhoneBlur() {
    setTouched(t => ({ ...t, phone: true }));
    const newErrors = validateFields(fields, countryCode);
    setErrors(e => ({ ...e, phone: newErrors.phone }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setTouched({ firstName: true, lastName: true, email: true, city: true, phone: true });
    const allErrors = validateFields(fields, countryCode);
    setErrors(allErrors);

    if (Object.keys(allErrors).length > 0) {
      const firstErrorKey = Object.keys(allErrors)[0] as keyof FormFields;
      document.getElementById(`field-${firstErrorKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setLoading(true);
    const selectedCountry = COUNTRIES.find(c => c.code === countryCode) ?? COUNTRIES[0];
    const couponCode = appliedCoupon?.code;

    try {
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponCode }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.error ?? 'Could not initiate payment.');
      }

      const orderJson = await orderRes.json();

      if (orderJson.bypass) {
        await handlePaymentSuccess(
          {
            razorpay_order_id: orderJson.orderId,
            razorpay_payment_id: orderJson.paymentId,
            razorpay_signature: '',
          },
          selectedCountry.dial,
          couponCode
        );
        return;
      }

      const { orderId, keyId, amount } = orderJson;

      if (typeof window.Razorpay === 'undefined') {
        throw new Error('Payment system unavailable. Please refresh and try again.');
      }

      const rzp = new window.Razorpay({
        key:         keyId ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? '',
        amount:      amount ?? PRICE_INR * 100,
        currency:    'INR',
        order_id:    orderId,
        name:        'Science Driven Performance',
        description: 'SDP Pre-Strategy Call · 1:1 Consultation Call · Refundable',
        prefill: {
          name:    `${fields.firstName.trim()} ${fields.lastName.trim()}`,
          email:   fields.email.trim(),
          contact: `${selectedCountry.dial}${fields.phone.trim()}`,
        },
        theme: { color: '#3B82F6' },
        handler: async (response: RazorpayResponse) => {
          await handlePaymentSuccess(response, selectedCountry.dial, couponCode);
        },
        modal: {
          ondismiss: () => {
            console.log('[checkout] Razorpay modal dismissed');
            setLoading(false);
          },
        },
      });

      rzp.on('payment.failed', (failure: RazorpayFailureResponse) => {
        console.error('[checkout] payment.failed', failure.error);
        setLoading(false);
        showToast(failure.error?.description ?? 'Payment failed. Please try again.');
      });

      rzp.open();
    } catch (err) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      showToast(msg);
    }
  }

  async function handlePaymentSuccess(
    response: RazorpayResponse,
    dialCode: string,
    couponCode?: string
  ) {
    try {
      const utm = restoreUtm();

      const verifyRes = await fetch('/api/razorpay/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId:   response.razorpay_order_id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
          couponCode,
          customer: {
            firstName:   fields.firstName.trim(),
            lastName:    fields.lastName.trim(),
            email:       fields.email.trim(),
            city:        fields.city.trim(),
            phone:       fields.phone.trim(),
            countryCode,
            dialCode,
          },
          utm,
          eventSourceUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        }),
      });

      const result = await verifyRes.json();
      if (!result.success) {
        throw new Error(result.error ?? 'Payment verification failed.');
      }

      const tyParams = new URLSearchParams({
        funnel:     'sdp-pre-strategy',
        order_id:   response.razorpay_order_id,
        payment_id: response.razorpay_payment_id,
      });
      if (utm.source)   tyParams.set('utm_source',   utm.source);
      if (utm.medium)   tyParams.set('utm_medium',   utm.medium);
      if (utm.campaign) tyParams.set('utm_campaign', utm.campaign);
      if (utm.content)  tyParams.set('utm_content',  utm.content);
      if (utm.term)     tyParams.set('utm_term',     utm.term);

      // Refresh MAM with the final values and persist the cookie BEFORE
      // navigating, so the /new-book-a-call PageView inherits identity.
      await setMetaAdvancedMatching({
        email:     fields.email,
        phone:     `${dialCode}${fields.phone}`,
        firstName: fields.firstName,
        lastName:  fields.lastName,
        city:      fields.city,
        country:   countryCode,
      });

      window.location.href = `/new-book-a-call?${tyParams.toString()}`;
    } catch (err) {
      console.error('[checkout] handlePaymentSuccess error', err);
      setLoading(false);
      const msg = err instanceof Error
        ? err.message
        : 'Payment received but verification failed. Please contact us.';
      showToast(msg);
    }
  }

  function fieldState(key: keyof FormFields) {
    const hasError = touched[key] && !!errors[key];
    const isValid = touched[key] && !errors[key] && fields[key].trim().length > 0;
    return {
      hasError,
      isValid,
      inputClass: `checkout-input${hasError ? ' input-error' : ''}${isValid ? ' input-valid' : ''}`,
    };
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      <div className={`checkout-toast${toast ? ' visible' : ''}`} role="alert">
        {toast}
        <button className="checkout-toast-close" onClick={dismissToast} aria-label="Dismiss">✕</button>
      </div>

      <MobileSummary finalINR={finalINR} />

      <div className="checkout-main">
        <div className="checkout-form-panel">
          <div className="checkout-form-heading">
            <div className="checkout-section-label">Secure Checkout</div>
            <h1 className="checkout-form-title">Your Details</h1>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="checkout-fields">
              <div className="checkout-fields-row">
                <div className="checkout-field" id="field-firstName">
                  <label className="checkout-label" htmlFor="firstName">
                    First Name <span>*</span>
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    className={fieldState('firstName').inputClass}
                    placeholder="Arjun"
                    value={fields.firstName}
                    onChange={e => handleChange('firstName', e.target.value)}
                    onBlur={() => handleBlur('firstName')}
                    autoComplete="given-name"
                    aria-invalid={fieldState('firstName').hasError}
                  />
                  <span className={`checkout-error-msg${fieldState('firstName').hasError ? ' visible' : ''}`} role="alert">
                    {errors.firstName}
                  </span>
                </div>

                <div className="checkout-field" id="field-lastName">
                  <label className="checkout-label" htmlFor="lastName">
                    Last Name <span>*</span>
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    className={fieldState('lastName').inputClass}
                    placeholder="Mehta"
                    value={fields.lastName}
                    onChange={e => handleChange('lastName', e.target.value)}
                    onBlur={() => handleBlur('lastName')}
                    autoComplete="family-name"
                    aria-invalid={fieldState('lastName').hasError}
                  />
                  <span className={`checkout-error-msg${fieldState('lastName').hasError ? ' visible' : ''}`} role="alert">
                    {errors.lastName}
                  </span>
                </div>
              </div>

              <div className="checkout-field" id="field-email">
                <label className="checkout-label" htmlFor="email">
                  Email Address <span>*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  className={fieldState('email').inputClass}
                  placeholder="you@example.com"
                  value={fields.email}
                  onChange={e => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  autoComplete="email"
                  inputMode="email"
                  aria-invalid={fieldState('email').hasError}
                />
                <span className={`checkout-error-msg${fieldState('email').hasError ? ' visible' : ''}`} role="alert">
                  {errors.email}
                </span>
              </div>

              <div className="checkout-field" id="field-city">
                <label className="checkout-label" htmlFor="city">
                  City <span>*</span>
                </label>
                <input
                  id="city"
                  type="text"
                  className={fieldState('city').inputClass}
                  placeholder="Mumbai"
                  value={fields.city}
                  onChange={e => handleChange('city', e.target.value)}
                  onBlur={() => handleBlur('city')}
                  autoComplete="address-level2"
                  aria-invalid={fieldState('city').hasError}
                />
                <span className={`checkout-error-msg${fieldState('city').hasError ? ' visible' : ''}`} role="alert">
                  {errors.city}
                </span>
              </div>

              <div className="checkout-field" id="field-phone">
                <label className="checkout-label" htmlFor="phone">
                  Phone Number <span>*</span>
                </label>
                <CountryDropdown
                  value={fields.phone}
                  countryCode={countryCode}
                  onValueChange={v => handleChange('phone', v)}
                  onCountryChange={code => {
                    setCountryCode(code);
                    if (touched.phone) {
                      const newErrors = validateFields({ ...fields }, code);
                      setErrors(e => ({ ...e, phone: newErrors.phone }));
                    }
                  }}
                  error={errors.phone}
                  touched={touched.phone}
                  onBlur={handlePhoneBlur}
                />
                <span
                  className={`checkout-error-msg${touched.phone && !!errors.phone ? ' visible' : ''}`}
                  role="alert"
                >
                  {errors.phone}
                </span>
              </div>
            </div>

            <div className="checkout-submit-wrap">
              <button
                type="submit"
                className="cta"
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <span className="btn-spinner" />
                    Processing…
                  </>
                ) : isBypass ? (
                  <>
                    Continue (Test) &amp; Book My Call
                    <span className="cta-arrow">→</span>
                  </>
                ) : (
                  <>
                    Pay {fmtINR(finalINR)} &amp; Book My Call
                    <span className="cta-arrow">→</span>
                  </>
                )}
              </button>

              <div className="checkout-trust">
                <span>🔒 256-bit SSL</span>
                <span className="checkout-trust-sep">·</span>
                <span>PCI Compliant</span>
                <span className="checkout-trust-sep">·</span>
                <span>100% Refundable</span>
              </div>
            </div>
          </form>
        </div>

        <OrderSummary
          finalINR={finalINR}
          couponInput={couponInput}
          setCouponInput={setCouponInput}
          appliedCoupon={appliedCoupon}
          couponError={couponError}
          onApply={handleApplyCoupon}
          onRemove={handleRemoveCoupon}
        />
      </div>
    </>
  );
}
