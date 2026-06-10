'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import Image from 'next/image';
import Player from '@vimeo/player';
import { captureUtm, decorateHref } from '@/lib/utm';
import { useScrollReveal } from '@/components/shared/useScrollReveal';
import AnimatedCounter from '@/components/shared/AnimatedCounter';

/* ============================================================
   Shared building blocks
   ============================================================ */

function SdpCta({
  delayStyleVar,
  reveal = true,
  className,
}: {
  delayStyleVar?: string;
  reveal?: boolean;
  className?: string;
}) {
  const [href, setHref] = useState('/new-checkout-page');

  useEffect(() => {
    captureUtm(new URLSearchParams(window.location.search));
    setHref(decorateHref('/new-checkout-page'));
  }, []);

  const wrapStyle = delayStyleVar
    ? ({ ['--d' as string]: delayStyleVar } as React.CSSProperties)
    : undefined;

  return (
    <div
      className={`sdp-cta-block${className ? ` ${className}` : ''}`}
      {...(reveal ? { 'data-sdp-reveal': '' } : {})}
      style={wrapStyle}
    >
      <a href={href} className="sdp-cta">
        <span className="cta-top">
          <span className="cta-d">Click Here To Get Your Personalised Diagnosis + Fitness Roadmap</span>
          <span className="cta-m">Click Here To Get Your Personalised Diagnosis + Fitness Roadmap</span>
          <span className="arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </span>
        </span>
      </a>
      <RiskReversalStrip />
      <UrgencyLine />
    </div>
  );
}

function VideoModal({ videoUrl, onClose }: { videoUrl: string | null; onClose: () => void }) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!videoUrl || !contentRef.current) return;

    const sep = videoUrl.indexOf('?') > -1 ? '&' : '?';
    const src = `${videoUrl}${sep}autoplay=1&muted=0&playsinline=1&autopause=0&dnt=1`;

    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'autoplay; encrypted-media; fullscreen; picture-in-picture');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('playsinline', '');

    iframe.addEventListener('load', () => {
      const poke = () => {
        try {
          iframe.contentWindow?.postMessage(JSON.stringify({ method: 'setMuted', value: false }), '*');
          iframe.contentWindow?.postMessage(JSON.stringify({ method: 'setVolume', value: 1 }), '*');
          iframe.contentWindow?.postMessage(JSON.stringify({ method: 'play' }), '*');
        } catch {
          /* cross-origin */
        }
      };
      poke();
      setTimeout(poke, 250);
      setTimeout(poke, 800);
    });

    contentRef.current.innerHTML = '';
    contentRef.current.appendChild(iframe);
    document.body.style.overflow = 'hidden';

    return () => {
      if (contentRef.current) contentRef.current.innerHTML = '';
      document.body.style.overflow = '';
    };
  }, [videoUrl]);

  useEffect(() => {
    if (!videoUrl) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [videoUrl, onClose]);

  return (
    <div
      className={`sdp-vmodal${videoUrl ? ' on' : ''}`}
      role="dialog"
      aria-hidden={!videoUrl}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sdp-vmodal-shell">
        <button className="sdp-vmodal-close" type="button" aria-label="Close video" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div ref={contentRef} className="sdp-vmodal-content" />
      </div>
    </div>
  );
}

/* ============================================================
   Section: Trust banner + Trust strip (replace old announce bar)
   ============================================================ */

function TrustBanner() {
  return (
    <div className="sdp-trust-banner" role="note">
      <span className="sdp-trust-banner-dot" aria-hidden="true" />
      <span>
        <b>10+ Years</b> of Experience and <b>550+ Success Stories</b>
      </span>
    </div>
  );
}

/* Trust-strip portraits — served locally from public/trust strip/. */
const TRUST_AVATARS: { src: string; alt: string }[] = [
  { src: '/trust%20strip/1.png', alt: 'Reviewer 1' },
  { src: '/trust%20strip/2.png', alt: 'Reviewer 2' },
  { src: '/trust%20strip/3.png', alt: 'Reviewer 3' },
  { src: '/trust%20strip/4.png', alt: 'Reviewer 4' },
];

function TrustStrip() {
  return (
    <div className="sdp-trust-strip">
      <div className="sdp-trust-strip-avatars" aria-hidden="true">
        {TRUST_AVATARS.map(a => (
          <span
            key={a.src}
            className="sdp-trust-strip-avatar"
            role="img"
            aria-label={a.alt}
            style={{ backgroundImage: `url("${a.src}")` }}
          />
        ))}
      </div>
      <div className="sdp-trust-strip-item">
        <span className="sdp-trust-strip-stars" aria-hidden="true">★★★★★</span>
        <span><b>5.0</b> Review</span>
      </div>
      <div className="sdp-trust-strip-item">
        <span className="sdp-trust-strip-check" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l8 3v7c0 4.97-3.35 9.26-8 10-4.65-.74-8-5.03-8-10V5l8-3z" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
        </span>
        <span><b>100%</b> Guaranteed Results</span>
      </div>
    </div>
  );
}

/* ============================================================
   Urgency line (rendered below every primary CTA)
   ============================================================ */

/* Countdown deadline:
   - Persisted in localStorage so the same browser/profile keeps the same
     deadline across page loads (matches "logged session" behaviour).
   - A fresh browser session, a new device, or incognito (which has its own
     ephemeral localStorage) starts a fresh 7-day window.
   - When the deadline elapses it auto-rolls forward another 7 days so the
     timer never sits at 00:00:00. */
const URGENCY_KEY = 'sdp_urgency_deadline_ms';
function computeUrgencyDeadline(): number {
  const target = new Date();
  target.setDate(target.getDate() + 7);
  target.setHours(23, 59, 59, 999);
  return target.getTime();
}
function readOrCreateDeadline(): number {
  try {
    const raw = window.localStorage.getItem(URGENCY_KEY);
    if (raw) {
      const ts = parseInt(raw, 10);
      if (Number.isFinite(ts) && ts > Date.now()) return ts;
    }
    const fresh = computeUrgencyDeadline();
    window.localStorage.setItem(URGENCY_KEY, String(fresh));
    return fresh;
  } catch {
    return computeUrgencyDeadline();
  }
}

function UrgencyLine() {
  const [t, setT] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  useEffect(() => {
    let deadline = readOrCreateDeadline();
    const tick = () => {
      let diff = deadline - Date.now();
      if (diff <= 0) {
        deadline = computeUrgencyDeadline();
        try { window.localStorage.setItem(URGENCY_KEY, String(deadline)); } catch {}
        diff = deadline - Date.now();
      }
      setT({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <p className="sdp-urgency" suppressHydrationWarning>
      <span className="sdp-urgency-label">Offer Ends In</span>
      <span className="sdp-urgency-timer">
        <span className="sdp-urgency-unit"><b>{t ? String(t.d).padStart(2, '0') : '00'}</b><span>Days</span></span>
        <span className="sdp-urgency-sep">:</span>
        <span className="sdp-urgency-unit"><b>{t ? String(t.h).padStart(2, '0') : '00'}</b><span>Hrs</span></span>
        <span className="sdp-urgency-sep">:</span>
        <span className="sdp-urgency-unit"><b>{t ? String(t.m).padStart(2, '0') : '00'}</b><span>Min</span></span>
        <span className="sdp-urgency-sep">:</span>
        <span className="sdp-urgency-unit"><b>{t ? String(t.s).padStart(2, '0') : '00'}</b><span>Sec</span></span>
      </span>
    </p>
  );
}

/* ============================================================
   Risk reversal strip — rendered below every primary CTA
   ============================================================ */

function RiskReversalStrip() {
  return (
    <div className="sdp-risk-strip" aria-hidden="true">
      <span className="sdp-risk-badge">
        <span className="sdp-risk-icon sdp-risk-icon-green">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l8 3v7c0 4.97-3.35 9.26-8 10-4.65-.74-8-5.03-8-10V5l8-3z" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
        </span>
        100% Money-Back Guarantee
      </span>
      <span className="sdp-risk-badge">
        <span className="sdp-risk-icon sdp-risk-icon-gold">
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round">
            <polygon points="12 2 15 8.5 22 9.3 17 14 18.3 21 12 17.5 5.7 21 7 14 2 9.3 9 8.5 12 2" />
          </svg>
        </span>
        550+ Success Stories
      </span>
      <span className="sdp-risk-badge">
        <span className="sdp-risk-icon sdp-risk-icon-blue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </span>
        Trusted by Senior Professionals
      </span>
    </div>
  );
}

/* ============================================================
   Section: Site header
   ============================================================ */

function SiteHeader() {
  return (
    <header className="sdp-header">
      <div className="sdp-wrap">
        <a
          href="https://sciencedrivenperformance.com"
          className="sdp-logo"
          aria-label="Science Driven Performance, home"
        >
          <span className="sdp-logo-mark">SDP</span>
        </a>
      </div>
    </header>
  );
}

/* ============================================================
   Section: Hero (with inline VSL video)
   ============================================================ */

const HERO_MARKERS = ['HbA1c', 'Triglycerides', 'Blood Pressure', 'LDL Cholesterol'];
const VSL_THUMB = '/vimeo-thumbs/1184772764.jpg';
const VSL_ID = 1184772764;

function VSLVideo() {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const [playing, setPlaying] = useState(false);

  // Boot the Vimeo player into `hostRef` once, on demand. Pre-booting (before
  // the click) is what makes playback start instantly; calling play() later
  // synchronously inside the click handler is what preserves the user gesture
  // the browser requires to play WITH sound (no muting).
  function ensurePlayer(): Player | null {
    if (playerRef.current || !hostRef.current) return playerRef.current;
    const player = new Player(hostRef.current, {
      id: VSL_ID,
      autoplay: false,
      muted: false,
      playsinline: true,
      responsive: false,
    });
    player.on('play', () => setPlaying(true));
    playerRef.current = player;
    return player;
  }

  // Pre-warm: boot the player as soon as the video scrolls near the viewport,
  // so the heavy player cold-boot is done before the user ever clicks.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const io = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          ensurePlayer();
          io.disconnect();
        }
      },
      { rootMargin: '300px' }
    );
    io.observe(host);
    return () => {
      io.disconnect();
      playerRef.current?.destroy().catch(() => {});
      playerRef.current = null;
    };
  }, []);

  function handlePlay() {
    if (playing) return;
    const player = ensurePlayer();
    if (!player) return;
    // Synchronous play() inside the gesture → Vimeo starts with sound.
    player.setVolume(1).catch(() => {});
    player
      .play()
      .then(() => setPlaying(true))
      .catch(() => {
        // Strict browser blocked programmatic unmuted play: reveal the booted
        // player so the user can tap Vimeo's own button (in-iframe gesture →
        // guaranteed sound). Never falls back to muted, never hangs.
        setPlaying(true);
      });
  }

  return (
    <div className="sdp-video-frame" data-sdp-reveal style={{ ['--d' as string]: '.22s' }}>
      <div
        className={`sdp-video has-video${playing ? ' playing' : ''}`}
        id="sdp-vsl"
        role="button"
        tabIndex={0}
        aria-label="Play video"
        onClick={handlePlay}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handlePlay();
          }
        }}
      >
        <div ref={hostRef} className="sdp-video-host" />
        {!playing && (
          <>
            <div className="sdp-video-thumb on">
              <img
                src={VSL_THUMB}
                alt=""
                width={640}
                height={360}
                fetchPriority="high"
                decoding="async"
              />
            </div>
            <div className="sdp-play">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="sdp-hero">
      <div className="sdp-wrap sdp-hero-inner">
        <div className="sdp-callout">
          For High-Performing Professionals 30+ Who Keep Restarting Their Fitness Journey
        </div>

        <h1 className="sdp-h1" data-sdp-reveal style={{ ['--d' as string]: '.06s' }}>
          <span className="sdp-h1-l1">Lose Up To 8-10% Body Fat In The Next 90 Days</span>
          <span className="sdp-h1-l2">With Our Constraint-Based Fitness Model Designed To Work Even During Travel, Deadlines, And Demanding Work Schedules.</span>
        </h1>

        <p className="sdp-hero-sub" data-sdp-reveal style={{ ['--d' as string]: '.14s' }}>
          <strong>550+ Indian and NRI professionals</strong> have used our science-driven
          approach to <mark>lose 10% body fat</mark> and improve key blood markers like:
        </p>

        <div
          className="sdp-hero-markers"
          data-sdp-reveal
          style={{ ['--d' as string]: '.16s' }}
          aria-label="Blood markers we track and improve"
        >
          {HERO_MARKERS.map(m => (
            <span key={m} className="sdp-marker-chip">
              <span className="sdp-marker-dot" aria-hidden="true" />
              {m}
            </span>
          ))}
        </div>

        <p className="sdp-above-vsl" data-sdp-reveal style={{ ['--d' as string]: '.20s' }}>
          Watch The Short Video Below <span aria-hidden="true">↓</span>
        </p>

        <VSLVideo />

        <SdpCta delayStyleVar=".26s" />

        <p className="sdp-below-vsl" data-sdp-reveal style={{ ['--d' as string]: '.3s' }}>
          A short walkthrough of why most plans collapse the moment work intensifies, and
          what we do differently.
        </p>

        <div className="sdp-cred-row" data-sdp-reveal style={{ ['--d' as string]: '.36s' }}>
          <div className="sdp-cred-card">
            <div className="sdp-cred-num">
              <AnimatedCounter target={550} format="plain" className="sdp-count" />+
            </div>
            <div className="sdp-cred-lbl">Clients</div>
          </div>
          <div className="sdp-cred-card">
            <div className="sdp-cred-num">14</div>
            <div className="sdp-cred-lbl">Countries</div>
          </div>
          <div className="sdp-cred-card">
            <div className="sdp-cred-num">8 Yrs</div>
            <div className="sdp-cred-lbl">Coaching</div>
          </div>
          <div className="sdp-cred-card">
            <div className="sdp-cred-num">₹97</div>
            <div className="sdp-cred-lbl">To Start</div>
          </div>
        </div>

        <div className="sdp-trust" data-sdp-reveal style={{ ['--d' as string]: '.42s' }}>
          <div className="sdp-trust-item">
            <div className="sdp-trust-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>
            </div>
            <span>Blood Marker Analysis</span>
          </div>
          <div className="sdp-trust-item">
            <div className="sdp-trust-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <span>Built For Travel Weeks</span>
          </div>
          <div className="sdp-trust-item">
            <div className="sdp-trust-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </div>
            <span>Refundable Strategy Call</span>
          </div>
          <div className="sdp-trust-item">
            <div className="sdp-trust-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <span>15-Min 1:1 Phone Call</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Section: Who this is for
   ============================================================ */

const WHO_ITEMS: { delay: string; body: ReactNode }[] = [
  {
    delay: '.04s',
    body: (
      <>
        <strong>
          You’ve started fitness 3+ times in the last few years and watched each attempt
          collapse around the same point.
        </strong>{' '}
        Progress for 4 to 6 weeks, then a deadline, a travel week, or a project spike,
        and you’re back at the beginning.
      </>
    ),
  },
  {
    delay: '.10s',
    body: (
      <>
        <strong>
          You handle senior responsibility. Big decisions, a team to lead, multiple
          priorities.
        </strong>{' '}
        Your calendar does not have stable weeks. It has peaks, troughs, and travel.
      </>
    ),
  },
  {
    delay: '.16s',
    body: (
      <>
        <strong>You’re noticing things you didn’t notice five years ago.</strong>{' '}
        Belly fat that won’t move. Energy that drops after lunch.{' '}
        <strong>HbA1c, triglycerides, LDL, or blood pressure trending the wrong way.</strong>
      </>
    ),
  },
  {
    delay: '.22s',
    body: (
      <>
        You already know what to do. Calorie deficit, protein, training.{' '}
        <strong>The knowledge isn’t the problem.</strong>
      </>
    ),
  },
  {
    delay: '.28s',
    body: (
      <>
        You’re done with plans that assume you’ll have a perfect week.{' '}
        <strong>You want a system that holds when life intensifies.</strong>
      </>
    ),
  },
];

function WhoThisIsFor() {
  return (
    <section className="sdp-who sdp-light">
      <div className="sdp-wrap">
        <div className="sdp-center-wrap">
          <div className="sdp-eyebrow center" data-sdp-reveal>
            For Senior Indian And NRI Professionals
          </div>
        </div>
        <h2 className="sdp-h2" data-sdp-reveal style={{ ['--d' as string]: '.06s' }}>
          This Is For You <em>If:</em>
        </h2>

        <ul className="sdp-who-list">
          {WHO_ITEMS.map((item, idx) => (
            <li key={idx} data-sdp-reveal style={{ ['--d' as string]: item.delay }}>
              <span className="ck">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span>{item.body}</span>
            </li>
          ))}
        </ul>

        <div className="sdp-who-cta" data-sdp-reveal style={{ ['--d' as string]: '.34s' }}>
          <SdpCta reveal={false} />
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Section: Proof — testimonial carousel + before/after grid
   ============================================================ */

interface Testimonial {
  name: string;
  role?: string;
  quote: string;
  videoUrl: string;
  thumbUrl: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'NITESH K.',
    role: 'IT Engineer · UK Government',
    quote: '“I started in my early 40s thinking strength training was for younger men. I was wrong. I’m fitter at 42 than at any point in my life.”',
    videoUrl: 'https://player.vimeo.com/video/1190697770',
    thumbUrl: 'https://vumbnail.com/1190697770.jpg',
  },
  {
    name: 'KARTHIK S.',
    role: 'Sales · Travel-Heavy',
    quote: '“I always believed travel made consistency impossible. Turns out the system was the problem, not my schedule.”',
    videoUrl: 'https://player.vimeo.com/video/1192160541',
    thumbUrl: 'https://vumbnail.com/1192160541.jpg',
  },
  {
    name: 'GAURAV J.',
    role: 'Corporate · 9-5 With Family',
    quote: '“I’d tried for years. Plans never held against work stress. With SDP, I haven’t missed sessions on vacations or wedding weeks.”',
    videoUrl: 'https://player.vimeo.com/video/1190697899',
    thumbUrl: 'https://vumbnail.com/1190697899.jpg',
  },
  {
    name: 'PREM G.',
    role: 'Software Industry',
    quote: '“My doctor told me to stop training because of my cervical issues. SDP built a structure around the injuries. I’m stronger now than before they happened.”',
    videoUrl: 'https://player.vimeo.com/video/1192143684',
    thumbUrl: 'https://vumbnail.com/1192143684.jpg',
  },
  {
    name: 'SUVRAT',
    quote: 'I lost 9 kgs in 3-5 months, gained strength and transformation, transformed my mindset with SDP’s expert guidance, boosting my confidence.',
    videoUrl: 'https://player.vimeo.com/video/871326008',
    thumbUrl: 'https://vumbnail.com/871326008.jpg',
  },
  {
    name: 'ROHIT SHINDE',
    quote: 'Transformed his approach to training and nutrition, completing a half Ironman with SDP’s expert guidance.',
    videoUrl: 'https://player.vimeo.com/video/738940211',
    thumbUrl: 'https://vumbnail.com/738940211.jpg',
  },
  {
    name: 'SAMIR PRABHUNE',
    quote: 'Progressed workout and diet queries easily while balancing fitness with stress-reducing practices like meditation.',
    videoUrl: 'https://player.vimeo.com/video/738932652',
    thumbUrl: 'https://vumbnail.com/738932652.jpg',
  },
  {
    name: 'MURTAZA KACHWALA',
    quote: 'Benefited from personalized guidance backed by detailed research, staying motivated and accountable with constant support.',
    videoUrl: 'https://player.vimeo.com/video/738927195',
    thumbUrl: 'https://vumbnail.com/738927195.jpg',
  },
  {
    name: 'SAKET GOKHALE',
    role: 'Fitness Influencer',
    quote: 'After years of failed bulk and body dysmorphia, their expert coaching, precision tracking, and real accountability finally helped me level up not just my physique, but also my mindset.',
    videoUrl: 'https://player.vimeo.com/video/738925886',
    thumbUrl: 'https://vumbnail.com/738925886.jpg',
  },
];

function TestimonialCarousel() {
  const carRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLDivElement>(null);
  const cloneRef = useRef<HTMLDivElement | null>(null);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  useEffect(() => {
    const car = carRef.current;
    const track = trackRef.current;
    const set = setRef.current;
    if (!car || !track || !set) return;

    const clone = set.cloneNode(true) as HTMLDivElement;
    clone.removeAttribute('id');
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
    cloneRef.current = clone;

    const state = {
      x: 0,
      setWidth: 0,
      speed: 0.45,
      paused: false,
      dragging: false,
      dragStartX: 0,
      dragStartPos: 0,
      lastMoveX: 0,
      lastMoveT: 0,
      velocity: 0,
      resumeAt: 0,
    };

    const measure = () => {
      state.setWidth = set.getBoundingClientRect().width + 18;
    };
    measure();

    const wrap = (x: number) => {
      const w = state.setWidth;
      if (!w) return x;
      while (x <= -w) x += w;
      while (x > 0) x -= w;
      return x;
    };

    const render = () => {
      track.style.transform = `translate3d(${state.x}px,0,0)`;
    };

    let rafId = 0;
    const tick = () => {
      if (!state.dragging) {
        if (Math.abs(state.velocity) > 0.05) {
          state.x += state.velocity;
          state.velocity *= 0.94;
        } else if (!state.paused && Date.now() > state.resumeAt) {
          state.x -= state.speed;
        }
        state.x = wrap(state.x);
        render();
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    const onEnter = () => { state.paused = true; };
    const onLeave = () => { if (!state.dragging) state.paused = false; };
    const getX = (e: MouseEvent | TouchEvent) =>
      'touches' in e && e.touches[0] ? e.touches[0].clientX : (e as MouseEvent).clientX;

    let dragMoved = 0;
    const dragStart = (e: MouseEvent | TouchEvent) => {
      state.dragging = true;
      state.paused = true;
      state.velocity = 0;
      state.dragStartX = getX(e);
      state.dragStartPos = state.x;
      state.lastMoveX = state.dragStartX;
      state.lastMoveT = Date.now();
      dragMoved = 0;
      car.classList.add('dragging');
    };
    const dragMove = (e: MouseEvent | TouchEvent) => {
      if (!state.dragging) return;
      const cx = getX(e);
      const dx = cx - state.dragStartX;
      dragMoved = Math.abs(dx);
      state.x = wrap(state.dragStartPos + dx);
      render();
      const now = Date.now();
      const dt = now - state.lastMoveT;
      if (dt > 0) state.velocity = ((cx - state.lastMoveX) / dt) * 16;
      state.lastMoveX = cx;
      state.lastMoveT = now;
      if (e.cancelable) e.preventDefault();
    };
    const dragEnd = () => {
      if (!state.dragging) return;
      state.dragging = false;
      car.classList.remove('dragging');
      state.resumeAt = Date.now() + 900;
      setTimeout(() => { if (!car.matches(':hover')) state.paused = false; }, 50);
    };
    const guardClick = (e: MouseEvent) => {
      if (dragMoved > 6) { e.stopPropagation(); e.preventDefault(); dragMoved = 0; }
    };

    car.addEventListener('mouseenter', onEnter);
    car.addEventListener('mouseleave', onLeave);
    car.addEventListener('mousedown', dragStart);
    window.addEventListener('mousemove', dragMove);
    window.addEventListener('mouseup', dragEnd);
    car.addEventListener('touchstart', dragStart, { passive: true });
    car.addEventListener('touchmove', dragMove, { passive: false });
    car.addEventListener('touchend', dragEnd, { passive: true });
    car.addEventListener('touchcancel', dragEnd, { passive: true });
    car.addEventListener('click', guardClick, true);
    window.addEventListener('resize', measure);

    return () => {
      cancelAnimationFrame(rafId);
      car.removeEventListener('mouseenter', onEnter);
      car.removeEventListener('mouseleave', onLeave);
      car.removeEventListener('mousedown', dragStart);
      window.removeEventListener('mousemove', dragMove);
      window.removeEventListener('mouseup', dragEnd);
      car.removeEventListener('touchstart', dragStart);
      car.removeEventListener('touchmove', dragMove);
      car.removeEventListener('touchend', dragEnd);
      car.removeEventListener('touchcancel', dragEnd);
      car.removeEventListener('click', guardClick, true);
      window.removeEventListener('resize', measure);
      if (cloneRef.current?.parentNode) cloneRef.current.parentNode.removeChild(cloneRef.current);
    };
  }, []);

  return (
    <>
      <div ref={carRef} className="sdp-tcar" id="sdp-tcar">
        <div ref={trackRef} className="sdp-tcar-track" id="sdp-tcar-track">
          <div ref={setRef} className="sdp-tcar-set" id="sdp-tcar-set">
            {TESTIMONIALS.map((t, idx) => (
              <article key={idx} className="sdp-tslide">
                <div
                  className="sdp-tslide-video has-video"
                  onClick={() => setActiveVideo(t.videoUrl)}
                >
                  <div className="sdp-tslide-vthumb" style={{ backgroundImage: `url("${t.thumbUrl}")` }} />
                  <div className="sdp-tslide-play">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                </div>
                <div className="sdp-tslide-body">
                  <div className="sdp-tslide-name">{t.name}</div>
                  {t.role && <div className="sdp-tslide-role">{t.role}</div>}
                  <p className="sdp-tslide-quote">{t.quote}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <VideoModal videoUrl={activeVideo} onClose={() => setActiveVideo(null)} />
    </>
  );
}

interface BACard { src: string; alt: string; width: number; height: number; }

const BA_CARDS: BACard[] = [
  { src: '/transformation-images/amardeep.png', alt: 'Amardeep transformation: 104 kg to 78 kg', width: 1080, height: 1080 },
  { src: '/transformation-images/nitesh-k.png', alt: 'Nitesh K transformation: 68 kg to 59 kg, HbA1c 5.6', width: 1080, height: 1080 },
  { src: '/transformation-images/karthik-s.jpeg', alt: 'Karthik S transformation', width: 1080, height: 1080 },
  { src: '/transformation-images/gaurav-j.jpg', alt: 'Gaurav J transformation: 86 kg to 68 kg', width: 1024, height: 1280 },
  { src: '/transformation-images/c6.png', alt: 'SDP client transformation', width: 966, height: 1009 },
  { src: '/transformation-images/c10.png', alt: 'SDP client transformation', width: 966, height: 1009 },
  { src: '/transformation-images/c11.png', alt: 'SDP client transformation', width: 966, height: 1009 },
  { src: '/transformation-images/c12.png', alt: 'SDP client transformation', width: 966, height: 1009 },
  { src: '/transformation-images/c13.png', alt: 'SDP client transformation', width: 966, height: 1009 },
  { src: '/transformation-images/c14.png', alt: 'SDP client transformation', width: 966, height: 1009 },
  { src: '/transformation-images/prem-g.png', alt: 'Prem G transformation', width: 1536, height: 1024 },
  { src: '/transformation-images/sreejith.png', alt: 'Sreejith transformation', width: 1254, height: 1254 },
];

function BeforeAfterGrid() {
  const carRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLDivElement>(null);
  const cloneRef = useRef<HTMLDivElement | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const touchXRef = useRef(0);

  useEffect(() => {
    const car = carRef.current;
    const track = trackRef.current;
    const set = setRef.current;
    if (!car || !track || !set) return;

    const clone = set.cloneNode(true) as HTMLDivElement;
    clone.removeAttribute('id');
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
    cloneRef.current = clone;

    const state = {
      x: 0,
      setWidth: 0,
      speed: 0.45,
      paused: false,
      dragging: false,
      dragStartX: 0,
      dragStartPos: 0,
      lastMoveX: 0,
      lastMoveT: 0,
      velocity: 0,
      resumeAt: 0,
    };

    const measure = () => {
      state.setWidth = set.getBoundingClientRect().width + 18;
      if (state.x === 0) state.x = -state.setWidth;
    };
    measure();

    const wrap = (x: number) => {
      const w = state.setWidth;
      if (!w) return x;
      while (x <= -w) x += w;
      while (x > 0) x -= w;
      return x;
    };

    const render = () => { track.style.transform = `translate3d(${state.x}px,0,0)`; };

    let rafId = 0;
    const tick = () => {
      if (!state.dragging) {
        if (Math.abs(state.velocity) > 0.05) {
          state.x += state.velocity;
          state.velocity *= 0.94;
        } else if (!state.paused && Date.now() > state.resumeAt) {
          state.x += state.speed;
        }
        state.x = wrap(state.x);
        render();
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    const onEnter = () => { state.paused = true; };
    const onLeave = () => { if (!state.dragging) state.paused = false; };
    const getX = (e: MouseEvent | TouchEvent) =>
      'touches' in e && e.touches[0] ? e.touches[0].clientX : (e as MouseEvent).clientX;

    let dragMoved = 0;
    const dragStart = (e: MouseEvent | TouchEvent) => {
      state.dragging = true;
      state.paused = true;
      state.velocity = 0;
      state.dragStartX = getX(e);
      state.dragStartPos = state.x;
      state.lastMoveX = state.dragStartX;
      state.lastMoveT = Date.now();
      dragMoved = 0;
      car.classList.add('dragging');
    };
    const dragMove = (e: MouseEvent | TouchEvent) => {
      if (!state.dragging) return;
      const cx = getX(e);
      const dx = cx - state.dragStartX;
      dragMoved = Math.abs(dx);
      state.x = wrap(state.dragStartPos + dx);
      render();
      const now = Date.now();
      const dt = now - state.lastMoveT;
      if (dt > 0) state.velocity = ((cx - state.lastMoveX) / dt) * 16;
      state.lastMoveX = cx;
      state.lastMoveT = now;
      if (e.cancelable) e.preventDefault();
    };
    const dragEnd = () => {
      if (!state.dragging) return;
      state.dragging = false;
      car.classList.remove('dragging');
      state.resumeAt = Date.now() + 900;
      setTimeout(() => { if (!car.matches(':hover')) state.paused = false; }, 50);
    };
    // Click delegation. The cloned set has no React handlers (cloneNode skips
    // them), so we resolve the target card by its data-ba-idx attribute instead.
    const onClickDelegated = (e: MouseEvent) => {
      if (dragMoved > 6) {
        e.stopPropagation();
        e.preventDefault();
        dragMoved = 0;
        return;
      }
      const card = (e.target as HTMLElement).closest<HTMLElement>('.sdp-ba-card');
      if (!card) return;
      const raw = card.getAttribute('data-ba-idx');
      if (raw === null) return;
      const idx = parseInt(raw, 10);
      if (Number.isFinite(idx) && idx >= 0) setLightboxIdx(idx);
    };

    car.addEventListener('mouseenter', onEnter);
    car.addEventListener('mouseleave', onLeave);
    car.addEventListener('mousedown', dragStart);
    window.addEventListener('mousemove', dragMove);
    window.addEventListener('mouseup', dragEnd);
    car.addEventListener('touchstart', dragStart, { passive: true });
    car.addEventListener('touchmove', dragMove, { passive: false });
    car.addEventListener('touchend', dragEnd, { passive: true });
    car.addEventListener('touchcancel', dragEnd, { passive: true });
    car.addEventListener('click', onClickDelegated, true);
    window.addEventListener('resize', measure);

    return () => {
      cancelAnimationFrame(rafId);
      car.removeEventListener('mouseenter', onEnter);
      car.removeEventListener('mouseleave', onLeave);
      car.removeEventListener('mousedown', dragStart);
      window.removeEventListener('mousemove', dragMove);
      window.removeEventListener('mouseup', dragEnd);
      car.removeEventListener('touchstart', dragStart);
      car.removeEventListener('touchmove', dragMove);
      car.removeEventListener('touchend', dragEnd);
      car.removeEventListener('touchcancel', dragEnd);
      car.removeEventListener('click', onClickDelegated, true);
      window.removeEventListener('resize', measure);
      if (cloneRef.current?.parentNode) cloneRef.current.parentNode.removeChild(cloneRef.current);
    };
  }, []);

  useEffect(() => {
    if (lightboxIdx === null) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightboxIdx(null);
      else if (e.key === 'ArrowLeft') setLightboxIdx(i => i === null ? null : (i - 1 + BA_CARDS.length) % BA_CARDS.length);
      else if (e.key === 'ArrowRight') setLightboxIdx(i => i === null ? null : (i + 1) % BA_CARDS.length);
    }
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKey);
    };
  }, [lightboxIdx]);

  function nav(dir: 1 | -1) {
    setLightboxIdx(i => (i === null ? 0 : (i + dir + BA_CARDS.length) % BA_CARDS.length));
  }

  return (
    <>
      <div ref={carRef} className="sdp-bacar" id="sdp-bacar" data-sdp-reveal>
        <div ref={trackRef} className="sdp-bacar-track" id="sdp-bacar-track">
          <div ref={setRef} className="sdp-bacar-set" id="sdp-bacar-set">
            {BA_CARDS.map((card, idx) => (
              <div key={idx} className="sdp-ba-card" data-ba-idx={idx}>
                <div className="sdp-ba-img"><Image src={card.src} alt={card.alt} width={card.width} height={card.height} sizes="(max-width: 768px) 80vw, 360px" /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {lightboxIdx !== null && (
        <div
          className="sdp-lbox on"
          role="dialog"
          aria-hidden={false}
          onClick={e => { if (e.target === e.currentTarget) setLightboxIdx(null); }}
          onTouchStart={e => { touchXRef.current = e.touches[0].clientX; }}
          onTouchEnd={e => {
            const dx = e.changedTouches[0].clientX - touchXRef.current;
            if (Math.abs(dx) > 60) nav(dx > 0 ? -1 : 1);
          }}
        >
          <div className="sdp-lbox-content">
            <button className="sdp-lbox-close" type="button" aria-label="Close" onClick={() => setLightboxIdx(null)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <button className="sdp-lbox-nav sdp-lbox-prev" type="button" aria-label="Previous" onClick={() => nav(-1)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <Image className="sdp-lbox-img" src={BA_CARDS[lightboxIdx].src} alt={BA_CARDS[lightboxIdx].alt} width={BA_CARDS[lightboxIdx].width} height={BA_CARDS[lightboxIdx].height} sizes="(max-width: 768px) 100vw, 1100px" />
            <button className="sdp-lbox-nav sdp-lbox-next" type="button" aria-label="Next" onClick={() => nav(1)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
            <div className="sdp-lbox-counter">{lightboxIdx + 1} / {BA_CARDS.length}</div>
          </div>
        </div>
      )}
    </>
  );
}

function ProofSection() {
  return (
    <section className="sdp-proof sdp-light">
      <div className="sdp-wrap">
        <div className="sdp-center-wrap">
          <div className="sdp-eyebrow center" data-sdp-reveal>Real Senior Professionals · Real Results</div>
        </div>
        <h2 className="sdp-h2" data-sdp-reveal style={{ ['--d' as string]: '.06s' }}>
          Senior Professionals Who <em>Stopped Restarting.</em>
        </h2>
        <p className="sdp-sub" data-sdp-reveal style={{ ['--d' as string]: '.10s' }}>
          These are clients like you. Engineers, GMs, corporate leaders, founders.
        </p>
      </div>

      <TestimonialCarousel />

      <div className="sdp-wrap">
        <h3 className="sdp-ba-head" data-sdp-reveal>Before &amp; After Transformations</h3>
      </div>

      <BeforeAfterGrid />
    </section>
  );
}

/* ============================================================
   Section: Founder authority
   ============================================================ */

function FounderAuthority() {
  return (
    <section className="sdp-founder sdp-dark">
      <div className="sdp-wrap">
        <div className="sdp-center-wrap">
          <div className="sdp-eyebrow center" data-sdp-reveal>Behind The System</div>
        </div>
        <h2 className="sdp-h2" data-sdp-reveal style={{ ['--d' as string]: '.06s' }}>
          Meet The Coaches <em>Behind SDP.</em>
        </h2>

        <p className="sdp-founder-intro" data-sdp-reveal style={{ ['--d' as string]: '.12s' }}>
          Anish and Shubham co-founded SDP after years inside corporate engineering and IT.
          They build the system they wished existed when they were trying to stay fit
          through their own demanding careers.
        </p>

        <div className="sdp-founder-grid">
          <div className="sdp-founder-card" data-sdp-reveal style={{ ['--d' as string]: '.16s' }}>
            <div className="sdp-founder-photo" aria-hidden="true">
              <Image
                className="sdp-founder-img"
                src="/transformation-images/sdp%20coaches.png"
                alt="Anish and Shubham, SDP co-founders"
                width={402}
                height={386}
                sizes="(max-width: 768px) 80vw, 402px"
              />
            </div>
            <div>
              <div className="sdp-founder-name">ANISH &amp; SHUBHAM</div>
              <div className="sdp-founder-role">Co-Founders · Head Coach &amp; Program Design</div>
              <p className="sdp-founder-bio">
                Both came up through years of corporate engineering and IT, training through
                deadlines, pressure, and travel. Anish leads the coaching floor, having won
                district, state, and national level medals while holding a full-time job.
                Shubham leads bloodwork analysis and program design. Together they built SDP
                as the operating system they wished existed when their own careers made
                staying fit feel impossible.
              </p>
            </div>
          </div>
        </div>

        <div className="sdp-founder-closing" data-sdp-reveal style={{ ['--d' as string]: '.28s' }}>
          <strong>8 years. 550+ senior professionals.</strong> The system Anish and Shubham
          built powers every program SDP runs.
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Section: Mechanism
   ============================================================ */

const MECH_PILLARS = [
  { num: '01', title: 'We Reduce Decision Load', desc: 'Every meal and workout is a decision. We simplify the plan so it runs on tired-brain mode. Less mental load, more consistency.' },
  { num: '02', title: 'Structures For Fluctuating Capacity', desc: 'Your plan adapts to your week. More output during stable weeks. Reduced but effective structure during travel or peak stress.' },
  { num: '03', title: 'Optimised For Consistency Under Stress', desc: 'We design for your worst weeks, not your best. So when life gets hard, you don’t collapse. You scale back and stay in motion.' },
  { num: '04', title: 'We Build What Others Overlook', desc: 'Through structured progression, we build self-efficacy. The proof that you can stay consistent. Over time, that proof changes how you see yourself.' },
];

function Mechanism() {
  return (
    <section className="sdp-mech sdp-light-alt">
      <div className="sdp-wrap">
        <div className="sdp-center-wrap">
          <div className="sdp-eyebrow center" data-sdp-reveal>The Mechanism</div>
        </div>
        <h2 className="sdp-h2" data-sdp-reveal style={{ ['--d' as string]: '.06s' }}>
          How Our Constraint-Based Fitness Model <em>Works Differently.</em>
        </h2>

        <p className="sdp-mech-sub-body" data-sdp-reveal style={{ ['--d' as string]: '.10s' }}>
          Engineered around three physiological inputs most fitness plans ignore: cortisol
          response under work stress, decision fatigue, and metabolic variability across
          travel and stable weeks.
        </p>

        <div className="sdp-pillars">
          {MECH_PILLARS.map((p, idx) => (
            <div
              key={p.num}
              className="sdp-pillar"
              data-sdp-reveal
              style={{ ['--d' as string]: `${0.06 + idx * 0.06}s` }}
            >
              <div className="sdp-pillar-num">{p.num}</div>
              <div className="sdp-pillar-title">{p.title}</div>
              <p className="sdp-pillar-desc">{p.desc}</p>
            </div>
          ))}
        </div>

        <p className="sdp-mech-closing" data-sdp-reveal style={{ ['--d' as string]: '.30s' }}>
          This isn’t about motivation. It’s about structure that fits your life.
        </p>
      </div>
    </section>
  );
}

/* ============================================================
   Section: Saket featured
   ============================================================ */

const SAKET_VIDEO = 'https://player.vimeo.com/video/738925886';
const SAKET_THUMB = 'https://vumbnail.com/738925886.jpg';

function SaketFeatured() {
  const [open, setOpen] = useState(false);

  return (
    <section className="sdp-proof sdp-light">
      <div className="sdp-wrap">
        <div className="sdp-center-wrap">
          <div className="sdp-eyebrow center" data-sdp-reveal>Featured Client Spotlight</div>
        </div>
        <h2 className="sdp-h2" data-sdp-reveal style={{ ['--d' as string]: '.06s' }}>
          SDP Is The <em>#1 Choice</em> Of Saket Gokhale — One Of India&rsquo;s Most Ambitious &amp; Followed Men.
        </h2>
        <div className="sdp-saket" data-sdp-reveal>
          <div
            className="sdp-saket-vid"
            id="sdp-saket-vid"
            role="button"
            tabIndex={0}
            aria-label="Play Saket video"
            onClick={() => setOpen(true)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(true); } }}
          >
            <div
              className="sdp-saket-vid-bg"
              id="sdp-saket-vid-bg"
              style={{ backgroundImage: `url("${SAKET_THUMB}")` }}
            />
            <div className="sdp-saket-vid-ph" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="sdp-saket-vid-play" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            </div>
            <div className="sdp-saket-vid-pill">Saket Gokhale</div>
            <p className="sdp-saket-vid-cap">
              Achieved accountability and consistency through a structured nutrition and
              training plan, finding excellent value in the process.
            </p>
          </div>

          <div className="sdp-saket-card">
            <div className="sdp-saket-head">
              <div className="sdp-saket-photo">
                <Image
                  src="/transformation-images/saket%20profile.png"
                  alt="Saket Gokhale"
                  width={1254}
                  height={1254}
                  sizes="(max-width: 768px) 30vw, 200px"
                />
              </div>
              <div className="sdp-saket-meta">
                <div className="sdp-saket-name">
                  Saket Gokhale
                  <span className="sdp-saket-verified" aria-label="Verified">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                </div>
                <div className="sdp-saket-role">Fitness Influencer, Pune</div>
                <div className="sdp-saket-followers">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span><b>2.4M</b> followers</span>
                </div>
                <div className="sdp-saket-stars" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <svg key={idx} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>
            <p className="sdp-saket-quote">
              <strong>“36 weeks with Anish at SDP changed everything.”</strong>
              After years of failed bulk and body dysmorphia, their expert coaching,
              precision tracking, and real accountability finally helped me level up not
              just my physique, but also my mindset.
            </p>
            <span className="sdp-saket-quote-mark" aria-hidden="true">”</span>
          </div>
        </div>
      </div>

      <VideoModal videoUrl={open ? SAKET_VIDEO : null} onClose={() => setOpen(false)} />
    </section>
  );
}

/* ============================================================
   Section: Programme
   ============================================================ */

const PROGRAM_ITEMS: { title: string; desc: string; icon: ReactNode }[] = [
  {
    title: 'The Constraint-Based Training Protocol',
    desc: 'Engineered around your work calendar, not a generic split. Travel weeks: 30-minute hotel-room protocols. Stable weeks: full strength and conditioning.',
    icon: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 10h18" />
        <path d="M8 4v3" />
        <path d="M16 4v3" />
      </>
    ),
  },
  {
    title: 'Quarterly Clinical Bloodwork Review',
    desc: 'Full panel every 90 days. HbA1c, fasting insulin, lipid profile, liver enzymes, vitamin D, testosterone, hemoglobin, thyroid. Plan adjusts based on what your bloodwork shows.',
    icon: (
      <>
        <path d="M12 2v4" /><path d="M12 18v4" />
        <path d="M4.93 4.93l2.83 2.83" /><path d="M16.24 16.24l2.83 2.83" />
        <path d="M2 12h4" /><path d="M18 12h4" />
        <path d="M4.93 19.07l2.83-2.83" /><path d="M16.24 7.76l2.83-2.83" />
        <circle cx="12" cy="12" r="4" />
      </>
    ),
  },
  {
    title: 'The Adaptive Nutrition System',
    desc: 'Not a meal plan. A protocol that adjusts to your travel, work hours, and social calendar. Eat out. Travel. Stay in deficit without thinking about it.',
    icon: <><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></>,
  },
  {
    title: 'Weekly Check-Ins With Your Coach',
    desc: 'Weekly review of your data, plan adjustment, and structured planning for the week ahead. Operational, not generic.',
    icon: <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />,
  },
  {
    title: 'The SDP App',
    desc: 'Workout logging, nutrition tracking, progress photos, bloodwork uploads, direct coach communication. One place. Runs on your worst day.',
    icon: <><rect x="6" y="3" width="12" height="18" rx="2" /><path d="M11 18h2" /></>,
  },
  {
    title: 'Plans That Adapt',
    desc: 'Stable, travel, or peak-stress week. Three protocols, automatic switching. You don’t have to decide.',
    icon: (
      <>
        <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
        <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
        <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
        <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" />
        <line x1="17" y1="16" x2="23" y2="16" />
      </>
    ),
  },
];

function Programme() {
  return (
    <section className="sdp-program sdp-light-alt">
      <div className="sdp-wrap">
        <div className="sdp-center-wrap">
          <div className="sdp-eyebrow center" data-sdp-reveal>The Programme</div>
        </div>
        <h2 className="sdp-h2" data-sdp-reveal style={{ ['--d' as string]: '.06s' }}>
          What’s Included In Your <em>90-Day Programme.</em>
        </h2>
        <p className="sdp-sub" data-sdp-reveal style={{ ['--d' as string]: '.10s' }}>
          Six structural components that work together as one operating system for your fitness.
        </p>

        <div className="sdp-program-grid">
          {PROGRAM_ITEMS.map((it, idx) => (
            <div
              key={it.title}
              className="sdp-program-item"
              data-sdp-reveal
              style={{ ['--d' as string]: `${0.06 + idx * 0.06}s` }}
            >
              <div className="sdp-program-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                  {it.icon}
                </svg>
              </div>
              <div className="sdp-program-title">{it.title}</div>
              <p className="sdp-program-desc">{it.desc}</p>
            </div>
          ))}
        </div>

        <div className="sdp-program-cta" data-sdp-reveal style={{ ['--d' as string]: '.42s' }}>
          <SdpCta reveal={false} />
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Section: Guarantee
   ============================================================ */

const GUARANTEE_TERMS: { body: ReactNode }[] = [
  {
    body: (
      <>
        <strong>You complete the program.</strong> Workouts logged. Nutrition tracked.
        Weekly check-ins attended. Blood work submitted on schedule.
      </>
    ),
  },
  {
    body: (
      <>
        <strong>Your starting BMI is above 25.</strong> If you already had a healthy BMI
        for your height, a 10% body weight target isn’t physiologically realistic and
        we’ll set a different goal with you on the strategy call before you sign up.
      </>
    ),
  },
  { body: <><strong>The 90 days run from your program start date.</strong></> },
];

function Guarantee() {
  return (
    <section className="sdp-guarantee sdp-dark">
      <div className="sdp-wrap">
        <div className="sdp-guarantee-card" data-sdp-reveal>
          <div className="sdp-guarantee-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l8 3v7c0 4.97-3.35 9.26-8 10-4.65-.74-8-5.03-8-10V5l8-3z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          </div>

          <div className="sdp-guarantee-badge">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l8 3v7c0 4.97-3.35 9.26-8 10-4.65-.74-8-5.03-8-10V5l8-3z" />
            </svg>
            100% Money-Back Guarantee
          </div>

          <h2>100% <em>Money-Back Guarantee.</em></h2>

          <p className="sdp-guarantee-primary">
            If you don’t lose <strong>10% of your body weight in 90 days</strong>, we
            refund every rupee you paid us.
          </p>

          <div className="sdp-guarantee-terms">
            <div className="sdp-guarantee-terms-label">What We Ask In Return</div>
            <ul className="sdp-guarantee-terms-list">
              {GUARANTEE_TERMS.map((t, idx) => (
                <li key={idx}>
                  <span className="ck" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span>{t.body}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="sdp-guarantee-extra">
            The ₹97 pre-strategy fee is also fully refundable if you decide on the call
            that we are not the right fit.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Section: FAQ
   ============================================================ */

const FAQ_ITEMS = [
  {
    question: 'I’ve tried before and it didn’t work. Why would this be different?',
    answer:
      'Most fitness plans assume a stable week. They work in your best month and collapse in your worst one. Our system is engineered around the opposite assumption: it has to work on a 14-hour day, on a travel week, on a peak-stress quarter. That structural difference is why our 550+ clients haven’t followed the same restart pattern.',
  },
  {
    question: 'I genuinely don’t have time. How does this work?',
    answer:
      'The program is built for senior professionals with 50+ hour weeks and frequent travel. Travel weeks need 30-minute sessions you can do in a hotel room. Stable weeks scale up. Most clients spend 3 to 4 hours per week on the program.',
  },
  {
    question: 'My schedule is too unpredictable. Can a coaching program really keep up?',
    answer:
      'That unpredictability is the design constraint we built around. Your week classifies into one of three states (stable, travel, or peak stress) and the plan automatically adjusts. You log your week as it unfolds.',
  },
  {
    question: 'I’m not sure I’m ready right now. Should I wait?',
    answer:
      'Wait until life is “less busy” and you’ll wait forever, because life doesn’t get less busy. The pre-strategy call is a 15-minute phone conversation, no pressure to sign up. Either you find clarity that we’re not the right fit yet, or you find clarity that this is the right system to start now.',
  },
  {
    question: 'I have an injury. Can I still do this?',
    answer:
      'Yes. We work with clients who have spinal surgery histories, knee replacements, shoulder issues, and lower back pain. Amardeep, our hero case study, came to us after L5 L6 decompression surgery. The training plan is designed around what your body can safely handle.',
  },
  {
    question: 'What’s the actual investment for the program?',
    answer:
      'The program investment is discussed on the strategy call, calibrated to the level of personalisation and duration that matches your situation. Most clients invest ₹25,000 to ₹45,000 for 3 to 6 month programs.',
  },
];

function LandingFAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="sdp-faq sdp-light">
      <div className="sdp-wrap">
        <div className="sdp-center-wrap">
          <div className="sdp-eyebrow center" data-sdp-reveal>Common Questions</div>
        </div>
        <h2 className="sdp-h2" data-sdp-reveal style={{ ['--d' as string]: '.06s' }}>
          Common Questions From <em>Senior Professionals.</em>
        </h2>

        <div className="sdp-faq-list">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div key={idx} data-sdp-reveal>
                <div className={`sdp-q${isOpen ? ' open' : ''}`}>
                  <div
                    className="sdp-q-head"
                    role="button"
                    tabIndex={0}
                    aria-expanded={isOpen}
                    onClick={() => setOpenIdx(isOpen ? null : idx)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setOpenIdx(isOpen ? null : idx);
                      }
                    }}
                  >
                    <span>{item.question}</span>
                    <span className="ic">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </span>
                  </div>
                  <div className="sdp-q-body">
                    <div className="sdp-q-body-inner">{item.answer}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="sdp-faq-cta" data-sdp-reveal>
          <SdpCta reveal={false} />
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Section: Footer
   ============================================================ */

function LandingFooter() {
  return (
    <footer className="sdp-foot">
      <div className="sdp-wrap">
        <div className="copy">SCIENCE DRIVEN PERFORMANCE</div>
        <p>
          All content, systems and coaching services provided by Science Driven Performance
          are intended for educational and informational purposes only and do not guarantee
          specific results. This is not medical advice. Always consult a qualified
          healthcare professional before making changes to your diet, exercise or
          lifestyle. Client results and testimonials vary based on individual factors such
          as consistency, medical history, lifestyle and adherence to the process. Outcomes
          are not typical or guaranteed. This website is not affiliated with or endorsed by
          Meta. FACEBOOK and INSTAGRAM are trademarks of Meta Platforms, Inc.
        </p>
        <p className="sdp-foot-copyright">© 2026 Science Driven Performance. All rights reserved.</p>
        <div className="links">
          <a href="/new-privacy-policy/">Privacy Policy</a> ·{' '}
          <a href="/new-terms-and-conditions">Terms of Use</a> ·{' '}
          <a href="/new-refund-policy/">Refund Policy</a>
        </div>
      </div>
    </footer>
  );
}

/* ============================================================
   Section: Sticky bottom strip
   ============================================================ */

function StickyBottomStrip() {
  const [href, setHref] = useState('/new-checkout-page');

  useEffect(() => {
    captureUtm(new URLSearchParams(window.location.search));
    setHref(decorateHref('/new-checkout-page'));
  }, []);

  return (
    <div className="sdp-stuck on" id="sdp-stuck">
      <div className="sdp-stuck-inner">
        <div className="sdp-stuck-meta">
          <span className="sdp-stuck-pulse" aria-hidden="true" />
          <div className="sdp-stuck-text">
            <div className="sdp-stuck-h">Ready to <em>stop restarting?</em></div>
            <div className="sdp-stuck-s">
              <span className="sdp-stuck-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 2l8 3v7c0 4.97-3.35 9.26-8 10-4.65-.74-8-5.03-8-10V5l8-3z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
                <span><b>100%</b> Money-Back Guarantee</span>
              </span>
              <span className="sdp-stuck-badge-sep" aria-hidden="true">·</span>
              <span className="sdp-stuck-badge">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <polygon points="12 2 15 8.5 22 9.3 17 14 18.3 21 12 17.5 5.7 21 7 14 2 9.3 9 8.5 12 2" />
                </svg>
                <span><b>550+</b> Success Stories</span>
              </span>
            </div>
          </div>
        </div>
        <a href={href} className="sdp-cta">
          <span className="cta-top">
            <span className="sdp-stuck-cta-text">
              <span>Click Here To Get Your Personalised Diagnosis</span>
              <span className="sdp-stuck-cta-tail"> + Fitness Roadmap</span>
            </span>
            <span className="arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </span>
          </span>
        </a>
      </div>
    </div>
  );
}

/* ============================================================
   Page entry
   ============================================================ */

export default function LandingPage() {
  useScrollReveal('[data-sdp-reveal]');

  return (
    <div className="sdp-root">
      <TrustBanner />
      <TrustStrip />
      <SiteHeader />
      <Hero />
      <WhoThisIsFor />
      <SaketFeatured />
      <ProofSection />
      <FounderAuthority />
      <Mechanism />
      <Programme />
      <Guarantee />
      <LandingFAQ />
      <LandingFooter />
      <StickyBottomStrip />
    </div>
  );
}
