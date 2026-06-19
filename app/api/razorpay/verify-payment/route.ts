import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import type { CustomerData, UtmData } from '@/lib/types';

async function sendMetaCapiEvent(params: {
  eventName: string;
  pixelId: string;
  accessToken: string;
  paymentId: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  city: string;
  country: string;
  eventSourceUrl: string;
  fbc: string | undefined;
  fbp: string | undefined;
  clientIp: string | undefined;
  clientUserAgent: string | undefined;
}) {
  const sha256 = (v: string) => crypto.createHash('sha256').update(v).digest('hex');

  const normEmail   = params.email.trim().toLowerCase();
  const normPhone   = params.phone.replace(/\D/g, '');
  const normFn      = params.firstName.trim().toLowerCase();
  const normLn      = params.lastName.trim().toLowerCase();
  const normCt      = params.city.trim().toLowerCase().replace(/[^a-z]/g, '');
  const normCountry = params.country.trim().toLowerCase();

  const emailHash = normEmail ? sha256(normEmail) : undefined;

  const event = {
    event_name: params.eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: params.paymentId,
    action_source: 'website',
    event_source_url: params.eventSourceUrl,
    user_data: {
      ...(emailHash   && { em:          [emailHash] }),
      ...(emailHash   && { external_id: [emailHash] }),
      ...(normPhone   && { ph:          [sha256(normPhone)] }),
      ...(normFn      && { fn:          [sha256(normFn)] }),
      ...(normLn      && { ln:          [sha256(normLn)] }),
      ...(normCt      && { ct:          [sha256(normCt)] }),
      ...(normCountry && { country:     [sha256(normCountry)] }),
      ...(params.fbc             && { fbc: params.fbc }),
      ...(params.fbp             && { fbp: params.fbp }),
      ...(params.clientUserAgent && { client_user_agent: params.clientUserAgent }),
      ...(params.clientIp        && { client_ip_address: params.clientIp }),
    },
    // Health & Wellness restriction: keep custom_data scrubbed to value +
    // currency only. payment_id is already carried as event_id above (dedup
    // key), so it's redundant here — and a leaner payload gives Meta nothing
    // extra to scan as "sensitive". No content_name / product / condition
    // strings ever go to Meta.
    custom_data: {
      currency: 'INR',
      value: Number(process.env.NEXT_PUBLIC_PRICE_INR ?? '97'),
    },
  };

  const res = await fetch(
    `https://graph.facebook.com/v25.0/${params.pixelId}/events?access_token=${params.accessToken}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [event] }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(JSON.stringify(err));
  }

  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderId,
      paymentId,
      signature,
      customer,
      utm,
      couponCode,
      eventSourceUrl,
    }: {
      orderId: string;
      paymentId: string;
      signature?: string;
      customer: CustomerData;
      utm: UtmData;
      couponCode?: string;
      eventSourceUrl?: string;
    } = body;

    if (!orderId || !paymentId) {
      return NextResponse.json(
        { success: false, error: 'Missing required payment fields.' },
        { status: 400 }
      );
    }

    const isTestBypass =
      orderId.startsWith('test_order_') &&
      paymentId.startsWith('test_pay_') &&
      !!process.env.TEST_BYPASS_COUPON?.trim();

    if (!isTestBypass) {
      if (!signature) {
        return NextResponse.json(
          { success: false, error: 'Missing required payment fields.' },
          { status: 400 }
        );
      }
      if (!process.env.RAZORPAY_KEY_SECRET) {
        console.error('[verify-payment] Razorpay secret not configured');
        return NextResponse.json(
          { success: false, error: 'Payment verification not configured.' },
          { status: 500 }
        );
      }

      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      if (expectedSignature !== signature) {
        return NextResponse.json(
          { success: false, error: 'Payment verification failed.' },
          { status: 400 }
        );
      }
    } else {
      console.log('[verify-payment] Test bypass — signature check skipped:', paymentId);
    }

    // Tracking signals hoisted so the same values feed both the Pabbly webhook
    // (Sheet row → Apps Script reads later) and the Meta CAPI fire below.
    const fbc = req.cookies.get('_fbc')?.value;
    const fbp = req.cookies.get('_fbp')?.value;
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      req.headers.get('x-real-ip') ??
      undefined;
    const clientUserAgent = req.headers.get('user-agent') ?? undefined;
    // Strip query string from event_source_url before it reaches the Sheet
    // or Meta. UTMs are already captured as their own fields; keeping the
    // bare URL keeps the row readable and lets `event_source_url` double as
    // a clean funnel identifier (domain = funnel) for multi-funnel A/B tests.
    const stripQuery = (url: string) => {
      try { const u = new URL(url); return `${u.origin}${u.pathname}`; }
      catch { return url; }
    };
    const resolvedEventSourceUrl = stripQuery(
      eventSourceUrl ?? 'https://sdp2.sciencedrivenperformance.in/new-checkout-page'
    );
    // Meta gets the ORIGIN only (no path/query). Under the Health & Wellness
    // "core setup" tier Meta strips the path anyway; sending host-only avoids
    // leaking any path/UTM signal and matches the corrective SOP. The Pabbly /
    // Sheet payload keeps `resolvedEventSourceUrl` (origin + path) because the
    // path doubles as a funnel identifier there — only the Meta fire is reduced.
    const metaEventSourceUrl = (() => {
      try { return new URL(resolvedEventSourceUrl).origin; }
      catch { return 'https://sdp2.sciencedrivenperformance.in'; }
    })();
    const externalIdHash = customer.email
      ? crypto
          .createHash('sha256')
          .update(customer.email.trim().toLowerCase())
          .digest('hex')
      : '';

    const now = new Date();
    const pabblyPayload = {
      lead_id:           paymentId,
      first_name:        customer.firstName,
      last_name:         customer.lastName,
      full_name:         `${customer.firstName} ${customer.lastName}`,
      email:             customer.email,
      phone:             `${customer.dialCode}${customer.phone}`,
      city:              customer.city,
      country_code:      customer.countryCode,
      payment_id:        paymentId,
      order_id:          orderId,
      amount:            isTestBypass ? '0' : (process.env.NEXT_PUBLIC_PRICE_INR ?? '97'),
      currency:          'INR',
      coupon_code:       couponCode ?? '',
      is_test:           isTestBypass ? 'true' : 'false',
      payment_date:      now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }),
      payment_time:      now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
      payment_timestamp: now.toISOString(),
      utm_source:        utm?.source   ?? '',
      utm_medium:        utm?.medium   ?? '',
      utm_campaign:      utm?.campaign ?? '',
      utm_content:       utm?.content  ?? '',
      utm_term:          utm?.term     ?? '',
      utm_id:            utm?.utm_id   ?? '',
      gclid:             utm?.gclid     ?? '',
      fbclid:            utm?.fbclid    ?? '',
      msclkid:           utm?.msclkid   ?? '',
      ttclid:            utm?.ttclid    ?? '',
      li_fat_id:         utm?.li_fat_id ?? '',
      ref:               utm?.ref       ?? '',
      referrer:          utm?.referrer     ?? '',
      landing_path:      utm?.landing_path ?? '',
      first_seen:        utm?.first_seen   ?? '',
      event_source_url:  resolvedEventSourceUrl,
      fbc:               fbc ?? '',
      fbp:               fbp ?? '',
      external_id:       externalIdHash,
      client_ip_address: clientIp ?? '',
      client_user_agent: clientUserAgent ?? '',
    };

    console.log('[verify-payment] Verified purchase:', pabblyPayload.payment_id);

    const webhookUrl = process.env.PABBLY_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pabblyPayload),
        });
        if (webhookResponse.ok) {
          console.log('[verify-payment] Pabbly webhook successful:', webhookResponse.status);
        } else {
          console.error('[verify-payment] Pabbly webhook failed:', webhookResponse.status, webhookResponse.statusText);
        }
      } catch (err) {
        console.error('[verify-payment] Pabbly webhook error:', err);
      }
    } else {
      console.error('[verify-payment] CRITICAL: PABBLY_WEBHOOK_URL not set — webhook skipped');
    }

    const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? process.env.META_PIXEL_ID;
    const metaAccessToken = process.env.META_CAPI_ACCESS_TOKEN;
    if (metaPixelId && metaAccessToken && !isTestBypass) {
      const fullPhone = `${customer.dialCode}${customer.phone}`;
      const sharedPayload = {
        pixelId: metaPixelId,
        accessToken: metaAccessToken,
        paymentId,
        email: customer.email,
        phone: fullPhone,
        firstName: customer.firstName,
        lastName: customer.lastName,
        city: customer.city,
        country: customer.countryCode,
        eventSourceUrl: metaEventSourceUrl,
        fbc,
        fbp,
        clientIp,
        clientUserAgent,
      };
      // Health & Wellness restriction: fire the CUSTOM event ONLY. The standard
      // `Purchase` is blocked by name for this dataset, so it's dropped — ad
      // sets optimize directly on `SDPPurchase`. Do NOT re-add `Purchase` here
      // (it re-triggers the restriction). If Meta ever scans/degrades the custom
      // event (roadmap Scenario C), recode the name (e.g. `evt_a`) — don't fall
      // back to a standard event.
      const eventNames = ['SDPPurchase'];
      const results = await Promise.allSettled(
        eventNames.map((eventName) =>
          sendMetaCapiEvent({ eventName, ...sharedPayload })
        )
      );
      results.forEach((result, idx) => {
        const eventName = eventNames[idx];
        if (result.status === 'fulfilled') {
          console.log(`[verify-payment] Meta CAPI "${eventName}" sent:`, result.value);
        } else {
          console.error(`[verify-payment] Meta CAPI "${eventName}" error:`, result.reason);
        }
      });
    } else {
      console.log('[verify-payment] Meta CAPI skipped — env vars not set or test bypass');
    }

    return NextResponse.json({ success: true, paymentId });
  } catch (error) {
    console.error('[verify-payment]', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
