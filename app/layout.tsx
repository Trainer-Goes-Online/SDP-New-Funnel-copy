import type { Metadata } from 'next';
import Script from 'next/script';
import { Bebas_Neue, Manrope } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
});

const manrope = Manrope({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://sdp.sciencedrivenperformance.in'),
  title: {
    default: 'Science Driven Performance',
    template: '%s',
  },
  description:
    'A clinical, data-driven 90-day fitness system for senior professionals. 550+ clients across 14 countries. Refundable pre-strategy call.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${manrope.variable}`}>
      <head>
        <link
          rel="preload"
          as="image"
          href="/vimeo-thumbs/1184772764.jpg"
          fetchPriority="high"
        />
        <link rel="preconnect" href="https://player.vimeo.com" />
        <link rel="dns-prefetch" href="https://player.vimeo.com" />
      </head>
      <body>
        {children}
        <SpeedInsights />
        {process.env.NODE_ENV === 'production' && (
          <>
            {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
              <>
                <Script id="meta-pixel" strategy="afterInteractive">
                  {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID}');
fbq('track', 'PageView');`}
                </Script>
                <noscript>
                  <img
                    height="1"
                    width="1"
                    style={{ display: 'none' }}
                    alt=""
                    src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_META_PIXEL_ID}&ev=PageView&noscript=1`}
                  />
                </noscript>
              </>
            )}
            <Script
              src="https://www.googletagmanager.com/gtag/js?id=G-7Y0J49L948"
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-7Y0J49L948');`}
            </Script>
            <Script id="clarity-init" strategy="lazyOnload">
              {`(function(c,l,a,r,i,t,y){
c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "wqyilnbaha");`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
