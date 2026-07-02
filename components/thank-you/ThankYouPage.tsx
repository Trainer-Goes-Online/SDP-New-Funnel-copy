'use client';

import { useEffect, useRef, useState } from 'react';
import { useScrollReveal } from '@/components/shared/useScrollReveal';
import { useConversionPush } from '@/components/shared/useConversionPush';
import { reapplyMamFromCookie } from '@/lib/analytics';

const TY_VIDEO_URL =
  'https://tgox-production-bucket.nyc3.cdn.digitaloceanspaces.com/client_funnel_videos/SDP/sdp_thank_you_final_video_02.mp4_v1%20(1080p).mp4';

function VSLVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  function handlePlay() {
    if (playing) return;
    const v = videoRef.current;
    if (!v) return;
    // Synchronous play() inside the click gesture → starts with sound.
    v.muted = false;
    v.volume = 1;
    v.play().then(() => setPlaying(true)).catch(() => setPlaying(true));
  }

  return (
    <div className="sdp-root" style={{ ['--bg' as string]: 'transparent', background: 'transparent' }}>
      <div className="sdp-video-frame" data-reveal style={{ ['--d' as string]: '.30s' }}>
        <div
          className={`sdp-video has-video${playing ? ' playing' : ''}`}
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
          <div className="sdp-video-host">
            <video
              ref={videoRef}
              src={TY_VIDEO_URL}
              preload="metadata"
              playsInline
              controls={playing}
              controlsList="nodownload"
              onPlay={() => setPlaying(true)}
            />
          </div>
          {!playing && (
            <div className="sdp-play">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const TY_IMPORTANT_BANNER_STYLE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  margin: '28px auto 16px',
  padding: '12px 22px',
  borderRadius: '22px',
  background: 'linear-gradient(90deg, rgba(59,130,246,.08), rgba(96,165,250,.16))',
  border: '1.5px solid #3B82F6',
  color: '#0F172A',
  fontWeight: 700,
  fontSize: '14.5px',
  lineHeight: 1.45,
  width: 'fit-content',
  maxWidth: '100%',
  textAlign: 'center',
  boxShadow: '0 8px 22px rgba(59,130,246,.20)',
  boxSizing: 'border-box',
};

/* ============================================================
   Section: top announce marquee
   ============================================================ */

function AnnounceMarquee() {
  return (
    <div className="announce">
      <div className="announce-track">
        {[0, 1].map(loop => (
          <span key={loop} className="announce-loop">
            <span>Booking Confirmed</span>
            <span className="dot" />
            <span>Calendar Invite In <b>5 Minutes</b></span>
            <span className="dot" />
            <span>1:1 Consultation Call</span>
            <span className="dot" />
            <span>Refundable • No Pressure</span>
            <span className="dot" />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   Section: hero (confirmation tick + booking card)
   ============================================================ */

function Hero() {
  return (
    <section className="hero">
      <div className="wrap">
        <div className="hero-tick" aria-hidden="true" data-reveal>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        {/* <div className="eyebrow center" data-reveal style={{ ['--d' as string]: '.06s' }}>
          Booking Confirmed
        </div> */}
        <h1 data-reveal style={{ ['--d' as string]: '.10s' }}>
          Pre-Strategy Call <em>Confirmed.</em>
        </h1>
        <p className="hero-sub" data-reveal style={{ ['--d' as string]: '.16s' }}>
          Your <strong>₹97 pre-strategy session</strong> is locked in.{' '}
          <mark>Calendar invite + prep email</mark> are on their way to your inbox right now.
        </p>

        <div className="booking-card" data-reveal style={{ ['--d' as string]: '.22s' }}>
          <span className="ic" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M3 10h18" />
              <path d="M8 4v3" />
              <path d="M16 4v3" />
            </svg>
          </span>
          <div className="booking-card-meta">
            <div className="booking-card-label">Your Session</div>
            <div className="booking-card-value">1:1 Consultation Call</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '0 4px', boxSizing: 'border-box' }} data-reveal>
          <div style={TY_IMPORTANT_BANNER_STYLE} role="alert">
            <span aria-hidden="true" style={{ flex: '0 0 20px', display: 'inline-flex' }}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#1E40AF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </span>
            <span style={{ minWidth: 0 }}>
              <strong style={{ textTransform: 'uppercase', letterSpacing: '.04em', color: '#1E40AF' }}>Important:</strong>{' '}
              Do not close this page without watching the video below.
            </span>
          </div>
        </div>

        <VSLVideo />
      </div>
    </section>
  );
}

/* ============================================================
   Section: timeline (what happens next)
   ============================================================ */

const TIMELINE = [
  {
    num: '01',
    title: 'Calendar Invite Within 5 Minutes',
    body: (
      <>
        Check your inbox (and spam, just in case). The invite has the{' '}
        <strong>call details</strong>, time in your local timezone, and a one-click
        reschedule option.
      </>
    ),
  },
  {
    num: '02',
    title: 'Prep Email Within 24 Hours',
    body: 'Three questions to think about before the call. They take 5 minutes. They make the call useful.',
  },
  {
    num: '03',
    title: 'Reminder One Hour Before',
    body: 'Quick text or email so the call doesn’t slip past you on a busy day.',
  },
  {
    num: '04',
    title: '1:1 Consultation Call',
    body: (
      <>
        <strong>No script. No pressure.</strong> A real conversation about whether SDP
        fits your situation.
      </>
    ),
  },
];

function WhatHappensNext() {
  return (
    <section className="section section-dark">
      <div className="wrap">
        <div className="ty-center-wrap">
          <div className="eyebrow center dark" data-reveal>The Next 24 Hours</div>
        </div>
        <h2 className="h2 dark" data-reveal style={{ ['--d' as string]: '.06s' }}>
          What Happens <em>Next.</em>
        </h2>
        <p className="sub dark" data-reveal style={{ ['--d' as string]: '.10s' }}>
          Four things, in order.
        </p>

        <ul className="timeline">
          {TIMELINE.map((item, idx) => (
            <li
              key={item.num}
              className="tl-item"
              data-reveal
              style={{ ['--d' as string]: `${0.06 + idx * 0.04}s` }}
            >
              <span className="tl-num">{item.num}</span>
              <div>
                <div className="tl-title">{item.title}</div>
                <p className="tl-desc">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ============================================================
   Section: callout band
   ============================================================ */

function CalloutBand() {
  return (
    <div className="callout-band">
      <div className="callout-text" data-reveal>
        Most coaches guess. <em>We measure.</em>
      </div>
    </div>
  );
}

/* ============================================================
   Section: prep questions
   ============================================================ */

const PREP = [
  {
    num: 'Question 01',
    title: 'What Collapses Your Fitness Attempts?',
    body: 'Travel? Deadlines? Stress? Family? Be specific. The shape of the failure is the design constraint we’d build around.',
  },
  {
    num: 'Question 02',
    title: 'What Does A Normal Week Actually Look Like?',
    body: 'Not your ideal week. Your real one. Hours worked, travel days, peak-stress periods. We need the truth, not the plan.',
  },
  {
    num: 'Question 03',
    title: 'What Does “This Worked” Mean For You?',
    body: 'A weight number? A blood marker? Energy by 4pm? Fitting clothes you stopped wearing? The clearer the answer, the cleaner the design.',
  },
];

function PrepQuestions() {
  return (
    <section className="section section-light-alt">
      <div className="wrap">
        <div className="ty-center-wrap">
          <div className="eyebrow center" data-reveal>Five Minutes Of Prep</div>
        </div>
        <h2 className="h2" data-reveal style={{ ['--d' as string]: '.06s' }}>
          Three Things To Think About <em>Before We Talk.</em>
        </h2>
        <p className="sub" data-reveal style={{ ['--d' as string]: '.10s' }}>
          You’ll get these in the prep email too. Starting now is fine.
        </p>

        <div className="prep-grid">
          {PREP.map((q, idx) => (
            <div
              key={q.num}
              className="prep-card"
              data-reveal
              style={{ ['--d' as string]: `${0.06 + idx * 0.06}s` }}
            >
              <div className="prep-num">{q.num}</div>
              <h4>{q.title}</h4>
              <p>{q.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Section: about the ₹97 / refund card
   ============================================================ */

function FeeRefund() {
  return (
    <section className="section section-dark">
      <div className="wrap">
        <div className="ty-center-wrap">
          <div className="eyebrow center dark" data-reveal>About The ₹97</div>
        </div>
        <h2 className="h2 dark" data-reveal style={{ ['--d' as string]: '.06s' }}>
          Why We Charge The <em>Pre-Strategy Fee.</em>
        </h2>
        <p className="sub dark" data-reveal style={{ ['--d' as string]: '.10s' }}>
          No hidden agenda. Here’s the full story.
        </p>

        <div className="fee-card" data-reveal style={{ ['--d' as string]: '.16s' }}>
          <div className="fee-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l8 3v7c0 4.97-3.35 9.26-8 10-4.65-.74-8-5.03-8-10V5l8-3z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          </div>
          <h3>Filter For <em>Serious Intent.</em></h3>
          <p className="body">
            The fee exists so the calendar fills with people who are actually ready to
            talk, not curious browsers.{' '}
            <strong>It doesn’t gate the conversation, and it isn’t a deposit toward the program.</strong>
          </p>

          <div className="refund-row">
            <span className="ck" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <div>
              <strong>If we decide we’re not the right fit on the call, you get the ₹97 back.</strong>
              <span className="ck-note">
                No friction, no follow-up email asking you to reconsider. Mention it on
                the call or reply to the booking confirmation, refund processes within 48
                hours.
              </span>
            </div>
          </div>

          <p className="fee-extra">It’s yours back if either side says no. That’s the whole policy.</p>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Section: contact + footer
   ============================================================ */

function Contact() {
  return (
    <section className="contact">
      <div className="wrap">
        <div className="contact-icon" aria-hidden="true" data-reveal>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </div>
        <h3 data-reveal style={{ ['--d' as string]: '.06s' }}>Need To Reschedule Or Ask Something?</h3>
        <p data-reveal style={{ ['--d' as string]: '.10s' }}>
          Reply to the calendar invite, or write to {' '} <a href="mailto:coaching@sciencedrivenperformance.com">coaching@sciencedrivenperformance.com</a>
          . We answer within a few hours during business days.
        </p>
        <a href="/" className="home-link" data-reveal style={{ ['--d' as string]: '.16s' }}>
          ← Back to homepage
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="copy">SCIENCE DRIVEN PERFORMANCE</div>
        <p>© 2026 Science Driven Performance. All rights reserved. A TrainerGoesOnline initiative.</p>
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
   Page composer
   ============================================================ */

export default function ThankYouPage() {
  useScrollReveal();
  useConversionPush();

  // Safety net: re-apply persisted Advanced Matching on mount.
  useEffect(() => {
    reapplyMamFromCookie();
  }, []);

  return (
    <>
      <AnnounceMarquee />
      <Hero />
      <WhatHappensNext />
      <CalloutBand />
      <PrepQuestions />
      <FeeRefund />
      <Contact />
      <Footer />
    </>
  );
}
