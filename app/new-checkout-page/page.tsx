import type { Metadata } from 'next';
import CheckoutForm from '@/components/checkout/CheckoutForm';
import './checkout.css';

export const metadata: Metadata = {
  title: 'Secure Checkout · Science Driven Performance',
  description: 'Refundable pre-strategy call with the SDP coaching team.',
};

export default function NewCheckoutPage() {
  return (
    <>
      <div className="checkout-announce" role="region" aria-label="Checkout trust">
        <span className="checkout-announce-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Secure Checkout
        </span>
        <span className="checkout-announce-dot" aria-hidden="true" />
        <span className="checkout-announce-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 2l8 3v7c0 4.97-3.35 9.26-8 10-4.65-.74-8-5.03-8-10V5l8-3z" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
          100% Refundable
        </span>
        <span className="checkout-announce-dot" aria-hidden="true" />
        <span className="checkout-announce-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          Razorpay Verified · 256-bit SSL
        </span>
      </div>
      <main className="checkout-page">
        <CheckoutForm />
      </main>
    </>
  );
}
