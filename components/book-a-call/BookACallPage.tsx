'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useScrollReveal } from '@/components/shared/useScrollReveal';
import { reapplyMamFromCookie } from '@/lib/analytics';

/* ============================================================
   Helpers
   ============================================================ */

function getQueryParam(name: string): string {
  if (typeof window === 'undefined') return '';
  const match = window.location.search.match(new RegExp('[?&]' + name + '=([^&]*)'));
  return match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : '';
}

function useStickyOnHeroExit(heroSelector = '.hero'): boolean {
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const hero = document.querySelector<HTMLElement>(heroSelector);
    if (!hero) return;

    const update = () => setStuck(hero.getBoundingClientRect().bottom < 0);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [heroSelector]);

  return stuck;
}

/* ============================================================
   Section: announce marquee
   ============================================================ */

function AnnounceMarquee() {
  return (
    <div className="announce">
      <div className="announce-track">
        {[0, 1].map(loop => (
          <span key={loop} className="announce-loop">
            <span>Payment Confirmed</span>
            <span className="dot" />
            <span><b>15-Min</b> 1:1 Phone Call</span>
            <span className="dot" />
            <span>Refundable • No Pressure</span>
            <span className="dot" />
            <span>Built For Travel Weeks &amp; Real Life</span>
            <span className="dot" />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   Section: hero
   ============================================================ */

function Hero() {
  const [greet, setGreet] = useState('');

  useEffect(() => {
    const name = getQueryParam('name') || getQueryParam('wcc_name');
    if (name) setGreet(`, ${name.toUpperCase()}`);
  }, []);

  return (
    <section className="hero">
      <div className="wrap">
        <div className="hero-row" data-reveal>
          <div className="hero-tick" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="paid-badge">Payment Confirmed</div>
        </div>

        <h1 data-reveal style={{ ['--d' as string]: '.06s' }}>
          ONE LAST STEP{greet}. <em>PICK YOUR SLOT.</em>
        </h1>

        <p className="hero-sub" data-reveal style={{ ['--d' as string]: '.10s' }}>
          Your <strong>₹97 session</strong> is paid.{' '}
          <mark>Pick a 15-minute phone call window</mark> below.
        </p>

        <div className="steps" data-reveal style={{ ['--d' as string]: '.14s' }}>
          <div className="step done">
            <div className="circ">
              <span className="num">1</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="lbl">Paid</div>
          </div>
          <div className="step-line" />
          <div className="step active">
            <div className="circ"><span className="num">2</span></div>
            <div className="lbl">Pick Slot</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Section: calendar (Calendly embed)
   ============================================================ */

const CALENDLY_BASE_URL =
  'https://calendly.com/consult-sciencedrivenperformance/sdp-pre-strategy-session-discovery-v2';
const CALENDLY_WIDGET_SRC = 'https://assets.calendly.com/assets/external/widget.js';
const CALENDLY_WIDGET_CSS = 'https://assets.calendly.com/assets/external/widget.css';
const CALENDLY_QUERY =
  'hide_landing_page_details=1&hide_gdpr_banner=1&primary_color=3B82F6&text_color=0F172A&background_color=FFFFFF';

const CAL_ITEMS = [
  'Call link & calendar invite sent to your email instantly',
  'Reschedule once, free, up to 4 hours before your slot',
  'Refunded if we decide we’re not the right fit',
];

function CalendlyEmbed() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [fallback, setFallback] = useState<string | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const firstName = getQueryParam('name') || getQueryParam('wcc_name');
    const email = getQueryParam('email') || getQueryParam('wcc_email');

    let url = `${CALENDLY_BASE_URL}?${CALENDLY_QUERY}`;
    const prefillParts: string[] = [];
    if (firstName) prefillParts.push(`name=${encodeURIComponent(firstName)}`);
    if (email) prefillParts.push(`email=${encodeURIComponent(email)}`);
    if (prefillParts.length) url += '&' + prefillParts.join('&');

    host.setAttribute('data-url', url);

    if (!document.querySelector(`link[href="${CALENDLY_WIDGET_CSS}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = CALENDLY_WIDGET_CSS;
      document.head.appendChild(link);
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${CALENDLY_WIDGET_SRC}"]`
    );
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = CALENDLY_WIDGET_SRC;
      script.async = true;
      document.body.appendChild(script);
    }

    let tries = 0;
    const poll = window.setInterval(() => {
      if (host.querySelector('iframe')) {
        setLoaded(true);
        window.clearInterval(poll);
      } else if (++tries > 60) {
        setFallback(url);
        window.clearInterval(poll);
      }
    }, 200);

    return () => window.clearInterval(poll);
  }, []);

  return (
    <div className="cal-frame" data-reveal style={{ ['--d' as string]: '.10s' }}>
      <div className="cal-embed">
        <div
          ref={hostRef}
          className="calendly-inline-widget"
          id="calendly"
          style={{ minWidth: 320, height: '100%', width: '100%' }}
        />
      </div>
      <div className={`cal-loading${loaded ? ' hide' : ''}`}>
        {fallback ? (
          <p className="cal-loading-fallback">
            Couldn’t load the calendar.{' '}
            <a href={fallback} target="_blank" rel="noopener noreferrer">
              Open booking page →
            </a>
          </p>
        ) : (
          <>
            <div className="spin" />
            <p>Loading available slots…</p>
          </>
        )}
      </div>
    </div>
  );
}

function CalendarSection() {
  return (
    <section className="cal" id="calendar">
      <div className="wrap">
        <div className="cal-head">
          <h2 data-reveal>Choose A Slot That <em>Works For You.</em></h2>
        </div>

        <CalendlyEmbed />

        <div className="cal-reassure" data-reveal style={{ ['--d' as string]: '.16s' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Nothing else to pay — on the call, after, or ever for this session.
        </div>

        <div className="cal-items" data-reveal style={{ ['--d' as string]: '.20s' }}>
          {CAL_ITEMS.map(item => (
            <div key={item} className="cal-itm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Section: what's included
   ============================================================ */

const VALUE_CARDS: { title: string; description: string; icon: ReactNode }[] = [
  {
    title: 'Real 1:1 Conversation',
    description: 'A real person on the line. No bots, no scripts, no funnel pressure.',
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <circle cx="9" cy="9" r="1" />
        <circle cx="15" cy="9" r="1" />
      </>
    ),
  },
  {
    title: 'Restart-Pattern Audit',
    description: 'Where your previous attempts collapsed. Why they collapsed. Whether the pattern is solvable.',
    icon: (
      <>
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </>
    ),
  },
  {
    title: 'Bloodwork-Aware Triage',
    description: 'If you’ve got recent bloodwork, bring it. We’ll flag what’s most worth fixing first.',
    icon: <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />,
  },
  {
    title: 'Constraint Mapping',
    description: 'Your real calendar — travel cycles, peak-stress weeks, social obligations — and how a system would adapt to it.',
    icon: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </>
    ),
  },
  {
    title: 'Direct Fit Assessment',
    description: 'If we’re a fit, we’ll say so and walk you through what working together looks like. If not, we’ll say that too.',
    icon: <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />,
  },
  {
    title: 'Refund If It’s Not A Fit',
    description: 'The ₹97 is fully refundable if either of us decides we’re not the right match. No friction.',
    icon: (
      <>
        <path d="M12 2l8 3v7c0 4.97-3.35 9.26-8 10-4.65-.74-8-5.03-8-10V5l8-3z" />
        <polyline points="9 12 11 14 15 10" />
      </>
    ),
  },
];

function IncludedSection() {
  return (
    <section className="section section-light">
      <div className="wrap">
        <div className="center-wrap">
          <div className="eyebrow center" data-reveal>What’s Included In The Call</div>
        </div>
        <h2 className="h2" data-reveal style={{ ['--d' as string]: '.06s' }}>
          A Real Diagnostic. <em>Not A Pitch.</em>
        </h2>
        <p className="sub" data-reveal style={{ ['--d' as string]: '.10s' }}>
          A 15-minute phone call. We assess your situation honestly. You decide what happens next.
        </p>

        <div className="value-grid">
          {VALUE_CARDS.map((card, idx) => (
            <div
              key={card.title}
              className="value-card"
              data-reveal
              style={{ ['--d' as string]: `${0.04 + idx * 0.06}s` }}
            >
              <span className="included">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>{' '}
                Included
              </span>
              <div className="ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                  {card.icon}
                </svg>
              </div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Section: why book now (calendar ceiling)
   ============================================================ */

function WhyCard() {
  return (
    <section className="section section-dark">
      <div className="wrap">
        <div className="why-card" data-reveal>
          <div className="kicker">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            Why The Booking Window Matters
          </div>
          <h2>The Calendar Has A <span className="hl">Real Ceiling.</span></h2>
          <p>
            We coach <strong>fewer than 30 new clients a quarter</strong> by design. Every
            program is built individually around bloodwork and constraints. That puts a real
            ceiling on how many calls we can take in any week.
          </p>
          <p>
            The earlier you book, the better the slot you get and the sooner we can have a
            useful conversation. <span className="hl">If the next 7 days don’t work, that’s fine</span> — pick the best week ahead of time.
          </p>

          <div className="why-stat-row">
            <div className="why-stat">
              <div className="n">550+</div>
              <div className="l">Coached To Date</div>
            </div>
            <div className="why-stat">
              <div className="n">8 Yrs</div>
              <div className="l">Building This System</div>
            </div>
            <div className="why-stat">
              <div className="n">100%</div>
              <div className="l">1:1 Phone Calls</div>
            </div>
          </div>

          <p>
            The hard part is already done — you’ve paid. The only thing left is to{' '}
            <strong>actually pick a time</strong> on the calendar so we can prep for the call.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Section: transformations — same image grid + lightbox as landing
   ============================================================ */

interface BACard { src: string; alt: string; }

const BA_CARDS: BACard[] = [
  { src: '/transformation-images/amardeep.png', alt: 'Amardeep transformation: 104 kg to 78 kg' },
  { src: '/transformation-images/nitesh-k.png', alt: 'Nitesh K transformation: 68 kg to 59 kg, HbA1c 5.6' },
  { src: '/transformation-images/karthik-s.jpeg', alt: 'Karthik S transformation' },
  { src: '/transformation-images/gaurav-j.jpg', alt: 'Gaurav J transformation: 86 kg to 68 kg' },
  { src: '/transformation-images/c6.png', alt: 'SDP client transformation' },
  { src: '/transformation-images/c10.png', alt: 'SDP client transformation' },
  { src: '/transformation-images/c11.png', alt: 'SDP client transformation' },
  { src: '/transformation-images/c12.png', alt: 'SDP client transformation' },
  { src: '/transformation-images/c13.png', alt: 'SDP client transformation' },
  { src: '/transformation-images/c14.png', alt: 'SDP client transformation' },
  { src: '/transformation-images/prem-g.png', alt: 'Prem G transformation' },
  { src: '/transformation-images/sreejith.png', alt: 'Sreejith transformation' },
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
      <div ref={carRef} className="sdp-bacar" data-reveal>
        <div ref={trackRef} className="sdp-bacar-track">
          <div ref={setRef} className="sdp-bacar-set">
            {BA_CARDS.map((card, idx) => (
              <div key={idx} className="sdp-ba-card" data-ba-idx={idx}>
                <div className="sdp-ba-img"><img src={card.src} alt={card.alt} /></div>
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
            <img className="sdp-lbox-img" src={BA_CARDS[lightboxIdx].src} alt={BA_CARDS[lightboxIdx].alt} />
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

function TransformationsSection() {
  return (
    <section className="section section-light-alt">
      <div className="wrap">
        <div className="center-wrap">
          <div className="eyebrow center" data-reveal>Real Transformations</div>
        </div>
        <h2 className="h2" data-reveal style={{ ['--d' as string]: '.06s' }}>
          Senior Pros Who <em>Stopped Restarting.</em>
        </h2>
        <p className="sub" data-reveal style={{ ['--d' as string]: '.10s' }}>
          Engineers, GMs, founders, corporate leaders. Same calendar pressures as yours.
        </p>
      </div>

      {/* sdp-root scope so the landing.css rules for sdp-bacar/sdp-ba-card/sdp-lbox apply */}
      <div className="sdp-root">
        <BeforeAfterGrid />
      </div>
    </section>
  );
}

/* ============================================================
   Section: FAQ
   ============================================================ */

const FAQ_ITEMS: { question: string; answer: ReactNode }[] = [
  {
    question: 'Is this a sales call in disguise?',
    answer: (
      <>
        No. The 15 minutes are diagnostic. We look at your situation, your previous
        restarts, your week, and your bloodwork if you have it.{' '}
        <strong>
          If we’re a fit, we’ll walk you through what working together looks like at the
          end. If not, we’ll say so directly.
        </strong>{' '}
        No pressure either way.
      </>
    ),
  },
  {
    question: 'What if I want to reschedule?',
    answer: (
      <>
        One free reschedule, up to 4 hours before your slot. The reschedule link comes in
        your booking email. After that, write to us — we’re flexible if your week genuinely
        fell apart.
      </>
    ),
  },
  {
    question: 'Will there be more to pay on the call?',
    answer: (
      <>
        No. The ₹97 covers the full strategy session. If we end up working together
        afterwards, the program investment is a separate conversation, with time to think
        it through.{' '}
        <strong>
          You will not be asked to commit to anything financially during the 15 minutes.
        </strong>
      </>
    ),
  },
  {
    question: 'I don’t have recent bloodwork. Is the call still useful?',
    answer: (
      <>
        Yes. Bloodwork sharpens the conversation, but it isn’t required. Most of the call
        is about your restart pattern, your week, and what’s structurally been getting in
        the way. If you go ahead with the program, bloodwork happens within the first 10
        days as part of onboarding.
      </>
    ),
  },
  {
    question: 'What if I decide on the call that we’re not the right fit?',
    answer: (
      <>
        Mention it on the call or reply to the booking email afterwards.{' '}
        <strong>This works in both directions</strong> — if we decide we’re not the right
        fit for you, we refund proactively.
      </>
    ),
  },
];

function FAQAccordion({ items, initialOpenIndex = 0 }: { items: { question: string; answer: ReactNode }[]; initialOpenIndex?: number }) {
  const [openIndex, setOpenIndex] = useState<number | null>(initialOpenIndex);

  return (
    <div className="faq-list">
      {items.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div key={idx} className={`faq-item${isOpen ? ' on' : ''}`}>
            <div
              className="faq-q"
              role="button"
              tabIndex={0}
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setOpenIndex(isOpen ? null : idx);
                }
              }}
            >
              <span>{item.question}</span>
              <span className="i">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </span>
            </div>
            <div className="faq-a">
              <div className="faq-a-inner">{item.answer}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FAQSection() {
  return (
    <section className="section section-light">
      <div className="wrap">
        <div className="center-wrap">
          <div className="eyebrow center" data-reveal>Common Questions Before The Call</div>
        </div>
        <h2 className="h2" data-reveal style={{ ['--d' as string]: '.06s' }}>
          Quick Answers. <em>Then Book Your Slot.</em>
        </h2>
        <FAQAccordion items={FAQ_ITEMS} initialOpenIndex={0} />
      </div>
    </section>
  );
}

/* ============================================================
   Section: final CTA
   ============================================================ */

function FinalCTA() {
  return (
    <section className="final">
      <div className="wrap">
        <h2 data-reveal>
          The Hard Part Is Done.
          <span className="hl">Now Pick A Time.</span>
        </h2>
        <p data-reveal style={{ ['--d' as string]: '.08s' }}>
          You’ve paid. The slot is the only thing standing between today and a real
          conversation about your situation. <strong>Nothing else to pay.</strong>
        </p>
        <a href="#calendar" className="btn lg" data-reveal style={{ ['--d' as string]: '.14s' }}>
          Pick My Slot
          <span className="arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </span>
        </a>
      </div>
    </section>
  );
}

/* ============================================================
   Section: footer
   ============================================================ */

function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="copy">SCIENCE DRIVEN PERFORMANCE</div>
        <p>© 2026 Science Driven Performance · A TrainerGoesOnline initiative</p>
        <p>
          All content, systems, and coaching services are intended for educational and
          informational purposes only and do not guarantee specific results. This is not
          medical advice. Always consult a qualified healthcare professional before making
          changes to your diet, exercise, or lifestyle. Client results vary based on
          individual factors.
        </p>
        <div className="links">
          <a href="/new-privacy-policy/">Privacy Policy</a> ·{' '}
          <a href="/new-terms-and-conditions">Terms of Use</a> ·{' '}
          <a href="/new-refund-policy/">Refund Policy</a> ·{' '}
          <a href="/">Homepage</a>
        </div>
      </div>
    </footer>
  );
}

/* ============================================================
   Section: sticky bottom strip
   ============================================================ */

function StickyStrip() {
  const stuck = useStickyOnHeroExit('.hero');

  return (
    <div className={`stuck${stuck ? ' on' : ''}`}>
      <div className="stuck-inner">
        <div className="stuck-meta">
          <span className="stuck-pulse" aria-hidden="true" />
          <div className="stuck-text">
            <div className="stuck-h"><em>One last step</em> — pick your slot</div>
            <div className="stuck-s">15-Min Phone Call · Refundable · No Pressure</div>
          </div>
        </div>
        <a href="#calendar" className="btn">
          Pick My Slot
          <span className="arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </span>
        </a>
      </div>
    </div>
  );
}

/* ============================================================
   Page entry
   ============================================================ */

export default function BookACallPage() {
  useScrollReveal();

  // Post-payment landing: re-apply persisted Advanced Matching so this
  // PageView ties to the buyer (belt-and-braces with the inline pixel script).
  useEffect(() => {
    reapplyMamFromCookie();
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const anchor = target.closest<HTMLAnchorElement>('a[href="#calendar"]');
      if (!anchor) return;
      const dest = document.getElementById('calendar');
      if (!dest) return;
      e.preventDefault();
      window.scrollTo({
        top: dest.getBoundingClientRect().top + window.pageYOffset - 12,
        behavior: 'smooth',
      });
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <>
      <AnnounceMarquee />
      <Hero />
      <CalendarSection />
      <IncludedSection />
      <WhyCard />
      <TransformationsSection />
      <FAQSection />
      <FinalCTA />
      <Footer />
      <StickyStrip />
    </>
  );
}
