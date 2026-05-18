import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import type { CustomerData, UtmData } from '@/lib/types';

async function sendMetaCapiEvent(params: {
  pixelId: string;
  accessToken: string;
  paymentId: string;
  email: string;
  phone: string;
  fbc: string | undefined;
  fbp: string | undefined;
  clientIp: string | undefined;
  clientUserAgent: string | undefined;
}) {
  const hashedEmail = crypto
    .createHash('sha256')
    .update(params.email.trim().toLowerCase())
    .digest('hex');

  const rawPhone = params.phone.replace(/\D/g, '');
  const hashedPhone = rawPhone
    ? crypto.createHash('sha256').update(rawPhone).digest('hex')
    : undefined;

  const event = {
    event_name: 'SDPPurchase',
    event_time: Math.floor(Date.now() / 1000),
    event_id: params.paymentId,
    action_source: 'website',
    user_data: {
      em: [hashedEmail],
      ...(hashedPhone && { ph: [hashedPhone] }),
      ...(params.fbc && { fbc: params.fbc }),
      ...(params.fbp && { fbp: params.fbp }),
      ...(params.clientUserAgent && { client_user_agent: params.clientUserAgent }),
      ...(params.clientIp && { client_ip_address: params.clientIp }),
    },
    custom_data: {
      currency: 'INR',
      value: Number(process.env.NEXT_PUBLIC_PRICE_INR ?? '97'),
      payment_id: params.paymentId,
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
    }: {
      orderId: string;
      paymentId: string;
      signature?: string;
      customer: CustomerData;
      utm: UtmData;
      couponCode?: string;
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

    const now = new Date();
    const pabblyPayload = {
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
      const fbc = req.cookies.get('_fbc')?.value;
      const fbp = req.cookies.get('_fbp')?.value;
      const clientIp =
        req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
        req.headers.get('x-real-ip') ??
        undefined;
      const clientUserAgent = req.headers.get('user-agent') ?? undefined;
      const fullPhone = `${customer.dialCode}${customer.phone}`;
      try {
        const capiResult = await sendMetaCapiEvent({
          pixelId: metaPixelId,
          accessToken: metaAccessToken,
          paymentId,
          email: customer.email,
          phone: fullPhone,
          fbc,
          fbp,
          clientIp,
          clientUserAgent,
        });
        console.log('[verify-payment] Meta CAPI event sent:', capiResult);
      } catch (err) {
        console.error('[verify-payment] Meta CAPI error:', err);
      }
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
