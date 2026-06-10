# Pre-Batch-3 Archived Sections

These sections were removed from the new landing page (`LandingPage.tsx`) as part of the Batch 3 cuts per the *SDP New Funnel LP Changes* brief. The content is preserved here so it can be relocated to the post-payment thank-you page, a warm-traffic learn-more page, or restored to the LP if Batch 3 is rolled back.

**Saved on:** 2026-06-10
**Removed from:** `components/landing/LandingPage.tsx`
**Restoration:** copy the relevant `tsx` code block back into `LandingPage.tsx` at the appropriate composer slot.

---

## 1. Amardeep Case Study (`AmardeepCase`)

Was rendered just after `Hero` on the landing page (`sdp-dark` section).

```tsx
/* ============================================================
   Section: Amardeep case study
   ============================================================ */

const AMARDEEP_RESULTS = [
  { marker: 'Body Weight', day0: '104.1 kg', now: '78 kg' },
  { marker: 'Waist', day0: '47 inches', now: '35 inches' },
  { marker: 'HbA1c', day0: '6.2 (pre-diabetic)', now: 'Below 5.7' },
  { marker: 'Triglycerides', day0: '223', now: 'Below 150' },
  { marker: 'Pain Medication', day0: 'Occasional', now: 'None' },
];

function AmardeepCase() {
  return (
    <section className="sdp-case sdp-dark">
      <div className="sdp-wrap">
        <div className="sdp-case-head">
          <div className="sdp-eyebrow center" data-sdp-reveal>A Senior Professional Like You</div>
          <h2 data-sdp-reveal style={{ ['--d' as string]: '.08s' }}>
            Meet Amardeep. He'd Tried Celebrity Coaches. He'd Restarted Half A Dozen Times.{' '}
            <em>He Hasn't Restarted Once In 3 Years.</em>
          </h2>
        </div>

        <div className="sdp-case-card" data-sdp-reveal style={{ ['--d' as string]: '.12s' }}>
          <div className="sdp-case-profile">
            <div className="sdp-case-avatar">
              <Image
                src="/transformation-images/amardeep%20profile.png"
                alt="Amardeep Singh"
                width={730}
                height={737}
                sizes="(max-width: 768px) 100vw, 640px"
                priority
              />
            </div>
            <div className="sdp-case-id">
              <div className="sdp-case-name">AMARDEEP SINGH</div>
              <div className="sdp-case-meta">
                <span>General Manager · Marriott Property</span>
                <span>1 to 2 Week Travel Cycles · Rishikesh ↔ Delhi</span>
                <span>Prior L5 L6 Spinal Decompression Surgery</span>
                <span className="pre">Pre-Diabetic When He Started</span>
              </div>
            </div>
          </div>

          <div className="sdp-case-quote">
            I trained regularly. I had worked with multiple trainers, including celebrity
            coaches. Either the results didn't show up, or the plan couldn't survive my
            schedule. After enough cycles, the frustration was quiet. I'd stopped expecting
            it to last.
          </div>

          <span className="sdp-case-results-label">→ The Results</span>
          <table className="sdp-case-table">
            <thead>
              <tr><th>Marker</th><th>Day 0</th><th>Today</th></tr>
            </thead>
            <tbody>
              {AMARDEEP_RESULTS.map(r => (
                <tr key={r.marker}>
                  <td className="m-name">{r.marker}</td>
                  <td className="d-zero">{r.day0}</td>
                  <td className="d-now">{r.now}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="sdp-case-closing">
            <strong>What changed:</strong> he stopped restarting. Three years later he's
            still with the same coach. He's referred 4 clients personally. His wife is now
            a client.
          </p>
        </div>
      </div>
    </section>
  );
}
```

---

## 2. Callout Band (`CalloutBand`) — "Most Coaches Guess. We Measure."

Was rendered between Mechanism and HealthMarkers.

```tsx
function CalloutBand() {
  return (
    <div className="sdp-callout-band">
      <div className="sdp-callout-text" data-sdp-reveal>
        Most coaches guess. <em>We measure.</em>
      </div>
    </div>
  );
}
```

---

## 3. Health Markers (`HealthMarkers`) — "Every Blood Marker Will Improve In 90 Days"

```tsx
/* ============================================================
   Section: Health markers
   ============================================================ */

const WALK_IN_CONDITIONS = [
  'Pre-diabetic or Type 2 diabetic HbA1c',
  'Elevated triglycerides and high LDL',
  'High blood pressure',
  'Low Vitamin D',
  'Anemia or low hemoglobin',
  'Cardiac risk markers',
  'Liver enzyme elevation (SGPT, SGOT)',
  'Hormonal imbalances',
];

const MARKER_ROWS = [
  { marker: 'HbA1c', client: 'Amardeep · Marriott GM', day0: '6.2', now: '< 5.7' },
  { marker: 'Triglycerides', client: 'Amardeep', day0: '223', now: '< 150' },
  { marker: 'LDL Cholesterol', client: 'Vikas', day0: '135', now: '98' },
  { marker: 'Vitamin D', client: 'Vikas', day0: '15.6 ng/ml', now: '34 ng/ml' },
  { marker: 'SGPT (liver)', client: 'Vikas', day0: '351', now: '21' },
];

function HealthMarkers() {
  return (
    <section className="sdp-markers sdp-dark">
      <div className="sdp-wrap">
        <div className="sdp-center-wrap">
          <div className="sdp-eyebrow center" data-sdp-reveal>Backed By Bloodwork</div>
        </div>
        <h2 className="sdp-h2" data-sdp-reveal style={{ ['--d' as string]: '.06s' }}>
          Every Blood Marker Will <em>Improve In 90 Days.</em>
        </h2>

        <p className="sdp-markers-body" data-sdp-reveal style={{ ['--d' as string]: '.10s' }}>
          We design your plan around what your bloodwork actually shows. HbA1c, lipid panel,
          liver enzymes, vitamin D, hemoglobin, thyroid.{' '}
          <strong>
            Every blood marker we measure on day 0 will have improved by day 90.
          </strong>{' '}
          Many normalise completely.
        </p>

        <div className="sdp-markers-list-wrap" data-sdp-reveal style={{ ['--d' as string]: '.14s' }}>
          <div className="sdp-markers-list-title">→ This Is The Program Built For Clients Who Walk In With:</div>
          <ul className="sdp-markers-list">
            {WALK_IN_CONDITIONS.map(c => <li key={c}>{c}</li>)}
          </ul>
        </div>

        <div className="sdp-markers-table-wrap" data-sdp-reveal style={{ ['--d' as string]: '.20s' }}>
          <div className="sdp-markers-table-title">→ Real Client Marker Improvements</div>
          <table className="sdp-markers-table">
            <thead>
              <tr><th>Marker</th><th>Day 0</th><th>After SDP</th></tr>
            </thead>
            <tbody>
              {MARKER_ROWS.map(r => (
                <tr key={`${r.marker}-${r.client}`}>
                  <td>
                    <span className="m-cell">{r.marker}</span>
                    <span className="m-client">{r.client}</span>
                  </td>
                  <td className="d-zero">{r.day0}</td>
                  <td className="d-now">{r.now}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
```

---

## 4. Comparison Matrix (`ComparisonMatrix`) — "Why SDP Is Not Like Other Fitness Coaching"

Includes its supporting types (`Verdict`, `CmpRow`) and icon helpers (`NoIcon`, `YesIcon`, `StarIcon`, `CmpPill`).

```tsx
/* ============================================================
   Section: Comparison matrix
   ============================================================ */

type Verdict = 'yes' | 'no' | 'partial';
interface CmpRow {
  feature: string;
  icon: ReactNode;
  online: { verdict: Verdict; label?: string };
  local: { verdict: Verdict; label?: string };
}

const NoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const YesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />
  </svg>
);

const CMP_ROWS: CmpRow[] = [
  {
    feature: 'Health Markers Tracked & Improved',
    icon: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
    online: { verdict: 'no' }, local: { verdict: 'no' },
  },
  {
    feature: 'Quarterly Bloodwork Analysis Included',
    icon: <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />,
    online: { verdict: 'no' }, local: { verdict: 'no' },
  },
  {
    feature: 'Plan Adapts To Travel & Stress Weeks',
    icon: <><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>,
    online: { verdict: 'no' }, local: { verdict: 'no' },
  },
  {
    feature: 'Engineered For Senior Professionals',
    icon: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>,
    online: { verdict: 'partial', label: 'Generic' }, local: { verdict: 'no' },
  },
  {
    feature: 'Head Coach Involved In Program Design',
    icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
    online: { verdict: 'no' }, local: { verdict: 'yes' },
  },
];

function CmpPill({ verdict, label }: { verdict: Verdict; label?: string }) {
  if (verdict === 'partial') {
    return <span className="sdp-cmp-pill is-partial">{label ?? 'Partial'}</span>;
  }
  if (verdict === 'yes') {
    return <span className="sdp-cmp-pill is-yes"><YesIcon /> Yes</span>;
  }
  return <span className="sdp-cmp-pill is-no"><NoIcon /> No</span>;
}

function ComparisonMatrix() {
  return (
    <section className="sdp-compare sdp-dark">
      <div className="sdp-wrap">
        <div className="sdp-center-wrap">
          <div className="sdp-eyebrow center" data-sdp-reveal>Comparison</div>
        </div>
        <h2 className="sdp-h2" data-sdp-reveal style={{ ['--d' as string]: '.06s' }}>
          Why SDP Is Not Like <em>Other Fitness Coaching.</em>
        </h2>
        <p className="sdp-sub" data-sdp-reveal style={{ ['--d' as string]: '.10s' }}>
          The structural differences that change outcomes for senior professionals.
        </p>

        <div className="sdp-cmp" data-sdp-reveal style={{ ['--d' as string]: '.16s' }}>
          <div className="sdp-cmp-matrix">
            <div className="sdp-cmp-strip" aria-hidden="true" />

            <div className="sdp-cmp-mhead">
              <div />
              <div className="sdp-cmp-mh-prov">
                <span className="sdp-cmp-mh-ic" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </span>
                <span className="sdp-cmp-mh-name">Online Coach</span>
              </div>
              <div className="sdp-cmp-mh-prov">
                <span className="sdp-cmp-mh-ic" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>
                <span className="sdp-cmp-mh-name">Gym Trainer</span>
              </div>
              <div className="sdp-cmp-mh-prov is-hero">
                <span className="sdp-cmp-mh-ic" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l8 3v7c0 4.97-3.35 9.26-8 10-4.65-.74-8-5.03-8-10V5l8-3z" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                </span>
                <span className="sdp-cmp-mh-name">SDP <span className="hero-star" aria-hidden="true"><StarIcon /></span></span>
              </div>
            </div>

            {CMP_ROWS.map((row, idx) => (
              <div key={idx} className="sdp-cmp-mrow">
                <div className="sdp-cmp-mf">
                  <span className="sdp-cmp-mf-ic" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {row.icon}
                    </svg>
                  </span>
                  <span>{row.feature}</span>
                </div>
                <div className="sdp-cmp-mc" data-prov="Online Coach"><CmpPill {...row.online} /></div>
                <div className="sdp-cmp-mc" data-prov="Local Trainer"><CmpPill {...row.local} /></div>
                <div className="sdp-cmp-mc is-hero">
                  <span className="sdp-cmp-mc-prov" aria-hidden="true"><StarIcon />SDP</span>
                  <span className="sdp-cmp-pill is-yes-hero"><YesIcon /> Yes</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
```

---

## 5. Mechanism — Problem-Agitation Lede (lines that were trimmed, not the whole function)

The `Mechanism` function itself was kept (4 pillars retained, h2 renamed to *"How Our Constraint-Based Fitness Model Works Differently."*). Only the problem-agitation lede was trimmed from the top of the section.

Original heading + lede (now removed):
```tsx
        <h2 className="sdp-h2" data-sdp-reveal style={{ ['--d' as string]: '.06s' }}>
          Why Most Fitness Plans <em>Fail When Life Gets Busy.</em>
        </h2>

        <p className="sdp-mech-body" data-sdp-reveal style={{ ['--d' as string]: '.10s' }}>
          You already know what to do. Calorie deficit, protein, training. The knowledge
          isn't the problem. The problem is that most plans demand perfect conditions and
          assume stable weeks. Real life doesn't have stable weeks.{' '}
          <strong>That's not a discipline problem. It's a design problem.</strong>
        </p>

        <div className="sdp-mech-sub-h" data-sdp-reveal style={{ ['--d' as string]: '.16s' }}>
          How Our Constraint-Based Fitness Model Works Differently
        </div>
```

Original eyebrow (now removed in favor of new framing):
```tsx
        <div className="sdp-eyebrow center" data-sdp-reveal>The Diagnosis</div>
```

---

## 6. Final Closer (`FinalCloser`) — "Ready To Stop Restarting Your Fitness?"

Was rendered between FAQ and Footer. Held the bottom-of-page restated CTA + risk-reversal copy. The secondary CTA role is now filled by the CTA inside `LandingFAQ` + the persistent `StickyBottomStrip`.

```tsx
/* ============================================================
   Section: Final closer
   ============================================================ */

const WHAT_LOOKS_LIKE = [
  'Your clothes fit differently',
  'You have consistent energy throughout the day',
  'You stopped negotiating with yourself every Monday morning',
  'You feel in control of your body the way you feel in control of your career',
  'Your blood markers moved in the right direction, with documentation',
  'You finally became someone who trains consistently, not someone who keeps trying',
];

function FinalCloser() {
  return (
    <section className="sdp-final" id="book">
      <div className="sdp-wrap sdp-final-inner">
        <div
          className="sdp-eyebrow center"
          data-sdp-reveal
          style={{ color: 'var(--brand-bright, #60A5FA)' }}
        >
          The Decision
        </div>
        <h2 data-sdp-reveal style={{ ['--d' as string]: '.06s' }}>
          Ready To Stop <em>Restarting Your Fitness?</em>
        </h2>

        <p className="sdp-final-body" data-sdp-reveal style={{ ['--d' as string]: '.10s' }}>
          Picture yourself 90 days from now.
          <br />
          <strong>Not perfect. Not a different person.</strong>
          <br />
          But someone who got through three months of real life and kept going anyway.
        </p>

        <div className="sdp-what-looks" data-sdp-reveal style={{ ['--d' as string]: '.16s' }}>
          <div className="sdp-what-looks-label">What That Looks Like</div>
          <ul className="sdp-what-looks-list">
            {WHAT_LOOKS_LIKE.map(item => (
              <li key={item}>
                <span className="ck">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="sdp-final-line" data-sdp-reveal style={{ ['--d' as string]: '.22s' }}>
          That's what a system built for your life actually produces. And it starts with
          one conversation.
        </p>

        <SdpCta delayStyleVar=".28s" />

        <p className="sdp-final-risk" data-sdp-reveal style={{ ['--d' as string]: '.34s' }}>
          <span className="sdp-final-risk-row">
            <strong>Worst case:</strong> you get clarity on what's been holding you back.
            Refundable if it's not useful.
          </span>
          <span className="sdp-final-risk-row">
            <strong>Best case:</strong> you finally find a fitness approach that fits your life.
          </span>
        </p>
      </div>
    </section>
  );
}
```

---

## Notes on dead CSS

The CSS classes used only by the removed sections (`.sdp-case-*`, `.sdp-callout-band`, `.sdp-callout-text`, `.sdp-markers-*`, `.sdp-mech-body`, `.sdp-mech-sub-h`, `.sdp-cmp*`, `.sdp-compare`, `.sdp-final*`, `.sdp-what-looks*`) are still present in [app/landing.css](../../../app/landing.css). They have no current consumers but were left in place for trivial rollback. They can be swept in a later cleanup pass without risk.
