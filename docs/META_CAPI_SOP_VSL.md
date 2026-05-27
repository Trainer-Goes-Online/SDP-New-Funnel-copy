# SOP — Meta CAPI Downstream Feedback System for **VSL Funnels**

> **Funnel type this SOP covers:** Video Sales Letter (VSL) → low-ticket tripwire purchase → 1:1 sales call → high-ticket close.
> **For webinar / live-challenge funnels, use `META_CAPI_SOP_WEBINAR.md` instead.**

This document is a complete implementation playbook. It is designed to be pasted into a Claude Code session inside a sibling client project (which already has a frontend + backend + Razorpay). The agent reads it, audits the existing code, produces a plan, gets human approval, then executes.

You will also be given two **reference files** from the working SDP implementation:
- `apps-script/Code.gs` — the proven Apps Script source (your template)
- `apps-script/README.md` — its deployment + ops guide

Use those as the canonical reference. Adapt them to this project's actual code, form fields, and client name — do not copy blindly.

---

## ▶️ Kickoff prompt (paste this alongside the SOP)

```
You're implementing a Meta Conversions API downstream feedback system in this
project. Read META_CAPI_SOP_VSL.md end-to-end before touching code. Also read
the two reference files apps-script/Code.gs and apps-script/README.md from the
SDP implementation — they are your template.

This is a VSL funnel. Do NOT start coding. Work the SOP's workflow in order:

1. AUDIT the existing codebase (payment verification route, current Pabbly
   webhook payload, current Meta CAPI event firing, checkout form fields,
   UTM/cookie capture, fbp/fbc handling).
2. COMPARE the existing Pabbly payload against the 23-field target in Step 1
   of the SOP. Produce a diff table (have / missing / needs-transform).
3. PLAN all changes: the Step 1 backend enrichment, the Sheet schema, the
   Apps Script. Propose client-specific custom event names. Surface every
   deviation from the SOP explicitly.
4. WAIT for my approval of the plan.
5. EXECUTE only after I approve, one step at a time.

Hard rule: this project's backend already fires TWO Meta CAPI server events
("Purchase" + "sales") after payment verification. DO NOT change, remove, or
duplicate that event firing. The ONLY backend change in Step 1 is adding fields
to the Pabbly webhook JSON body. Confirm you understand this before planning.
```

---

## 1. What you're building — the 4-layer architecture

```
Layer 1  Meta Ad → Landing/VSL → tripwire purchase (₹X) → Razorpay
Layer 2  Payment-verify server route:
           • fires existing Purchase + sales CAPI events  (DO NOT TOUCH)
           • POSTs an ENRICHED payload to the Pabbly webhook  ← Step 1 change
Layer 3  Pabbly → writes ONE row per lead into a Google Sheet CRM
Layer 4  Sales team marks lifecycle status in the Sheet →
           Apps Script fires downstream Meta CAPI events:
             • CallBooked-equivalent   (lead booked the sales call)
             • CallDone-equivalent     (lead attended the call)
             • HighTicketPurchase      (lead bought the high-ticket offer)
```

The point: feed Meta not just the tripwire purchase, but the **downstream revenue-quality signals** — so Meta's algorithm optimises toward buyers who book, show up, and buy high-ticket, not just anyone who pays the tripwire.

**Key architecture decisions (do not deviate without flagging):**
- Downstream events fire from **Apps Script directly to Meta Graph API** — no backend proxy. Secrets live in Apps Script `PropertiesService`. This keeps each client a self-contained, copy-paste deployment.
- The tripwire `Purchase` + `sales` events keep firing from the backend exactly as they do today.
- The Google Sheet is the single source of truth linking a lead's payment-time identifiers to their later lifecycle status.

---

## 2. Hard constraints — what you must NOT change

1. **Do NOT touch the existing Meta CAPI event firing.** This project fires two server-side events (`Purchase` + `sales`) after payment verification. They stay exactly as-is — same event names, same event_id, same payload, same dedup. Your Step 1 change adds fields to the **Pabbly webhook body only**.
2. **Do NOT add or change client-side Pixel events.** Browser fires `PageView` only. If the project fires `fbq('track', 'Purchase')` or similar client-side, leave it; if it does not, do not add it.
3. **Do NOT introduce a backend endpoint for downstream events.** Apps Script talks to Meta directly.
4. **Do NOT change the payment flow, redirect behavior, or any user-facing copy/UI.**
5. **Do NOT invent form fields.** Hash and forward only what the checkout form actually collects. If the form lacks `city` or `last_name`, omit those user_data fields — never fabricate.

---

## 3. Your workflow (follow in order — do not skip ahead)

### Phase A — Audit (report, don't change)
Find and report on:
1. The server route that handles **successful payment verification** (where Razorpay signature is verified). This is where the Pabbly webhook is POSTed and where the existing CAPI events fire.
2. The **current Pabbly webhook payload** — list every field it currently sends.
3. The **current Meta CAPI event firing** — confirm it fires `Purchase` + `sales`, note the event_id used and the user_data fields included.
4. The **checkout form fields** collected (email, phone, first/last name, city, country, etc.).
5. **UTM + click-ID capture** — how UTMs, `fbclid`, `gclid` are captured and persisted (cookie? localStorage?).
6. **fbp / fbc handling** — where `_fbc` / `_fbp` cookies are read server-side.
7. The **transaction ID** format the payment provider issues (used as `lead_id` + event_id base).

Output a 5-10 bullet audit summary before proceeding.

### Phase B — Compare (the diff that drives Step 1)
Produce a table: for each of the **23 target fields** (Section 4), mark `HAVE` (already in Pabbly payload), `MISSING` (need to add), or `TRANSFORM` (present but wrong format/name). This table IS the Step 1 work list.

### Phase C — Plan
Propose, in writing, awaiting approval:
- The exact Step 1 backend change (which file, which fields added, how each is derived)
- The Google Sheet schema (Section 5)
- The Apps Script event config + **client-specific event names** (Section 6)
- A risk list + a verification plan
Flag every deviation from this SOP explicitly under a "Deviations" heading.

### Phase D — Approval gate
Stop. Wait for the human to approve the plan.

### Phase E — Execute
Implement one step at a time. Commit each step. Do not push unless told.

---

## 4. STEP 1 — Enrich the Pabbly webhook payload (UNIVERSAL — identical for every funnel)

After payment verification, the server must POST these **23 fields** to the Pabbly webhook. They become columns A→W in the CRM Sheet, and they carry every identifier the downstream Apps Script needs to fire high-EMQ events later.

| # | Field name (JSON key) | Type | How to derive it server-side |
|---|---|---|---|
| 1 | `lead_id` | string | The payment/transaction ID (Razorpay `payment_id`). Canonical unique key per lead. |
| 2 | `created_at` | ISO 8601 | Payment timestamp, e.g. `new Date().toISOString()` (store with timezone). |
| 3 | `first_name` | string | From checkout form. |
| 4 | `last_name` | string | From checkout form. |
| 5 | `email` | string | From checkout form (raw — Pabbly stores raw; hashing happens later for CAPI). |
| 6 | `phone` | string | Dial code + number, digits where possible, e.g. `+919876543210`. |
| 7 | `city` | string | From checkout form. |
| 8 | `country_code` | string | 2-letter ISO (e.g. `IN`). |
| 9 | `fbc` | string | The `_fbc` cookie value from the request (raw). Empty string if absent. |
| 10 | `fbp` | string | The `_fbp` cookie value from the request (raw). Empty string if absent. |
| 11 | `client_ip_address` | string | First IP in `x-forwarded-for`, else `x-real-ip`. |
| 12 | `client_user_agent` | string | The `user-agent` request header. |
| 13 | `external_id` | string | **`sha256(lowercase(trim(email)))`** computed server-side, lowercase hex. Same hash used in your existing CAPI user_data if present. |
| 14 | `event_source_url` | string | The page the conversion happened on. Pass `window.location.href` from the client in the verify-payment request body; fall back to a hardcoded production checkout URL. |
| 15 | `amount` | number/string | The tripwire amount actually charged (e.g. `97`, or `0` for a test/bypass coupon). |
| 16 | `is_test` | string | `"true"` / `"false"` — whether this was a test/bypass-coupon order. |
| 17 | `purchase_event_id` | string | The `event_id` used by your existing `Purchase` + `sales` CAPI events (typically = `lead_id`). Stored so downstream events can reference the purchase + so dedup is auditable. |
| 18 | `utm_source` | string | From your UTM capture. |
| 19 | `utm_medium` | string | From your UTM capture. |
| 20 | `utm_campaign` | string | From your UTM capture. |
| 21 | `utm_content` | string | From your UTM capture. |
| 22 | `utm_term` | string | From your UTM capture. |
| 23 | `fbclid` | string | Facebook click ID from your UTM/click capture (backup for `fbc` reconstruction). |

**Implementation rules:**
- Add these fields to the **existing** Pabbly webhook payload object. Keep any fields the project already sends — Pabbly will just map what the Sheet needs and ignore the rest.
- Every field must be present in the POST body even when empty (send `""` not `undefined`) so Pabbly's mapping is stable.
- `external_id` MUST be computed identically to how the existing CAPI computes its `external_id` (if it does). Consistency = Meta links browser + server + downstream into one user.
- **Do not touch the CAPI event firing in the same route.** Only the Pabbly POST body changes.

**Deliverable for Step 1:** the diff table from Phase B + the enriched payload code, committed as one focused commit (e.g. `"Step 1: enrich Pabbly webhook payload with Meta matching identifiers"`).

---

## 5. STEP 2 — Google Sheet CRM schema (VSL funnel)

One Sheet, **one row per lead**, 36 columns A→AJ. Columns A→W are auto-filled by Pabbly (identical to every funnel). Columns X→AJ are the VSL lifecycle (sales team + Apps Script).

### Auto-fill columns A→W (Pabbly writes — UNIVERSAL)

```
lead_id | created_at | first_name | last_name | email | phone | city | country_code | fbc | fbp | client_ip_address | client_user_agent | external_id | event_source_url | amount | is_test | purchase_event_id | utm_source | utm_medium | utm_campaign | utm_content | utm_term | fbclid
```

### Manual + Apps-Script columns X→AJ (VSL lifecycle)

| Col | Field | Written by | Notes |
|---|---|---|---|
| X | `call_booked` | Sales team | Dropdown `TRUE`/`FALSE` (see note below). Fires the CallBooked event. |
| Y | `booking_time` | Sales team | Date+time (IST), `yyyy-mm-dd hh:mm`. **Fill BEFORE setting status TRUE.** |
| Z | `schedule_capi_event_id` | Apps Script | `<lead_id>_schedule` |
| AA | `schedule_capi_sent` | Apps Script | `TRUE` after fire — dedup flag |
| AB | `call_showed` | Sales team | Dropdown `TRUE`/`FALSE`. Fires the CallDone event. |
| AC | `showup_time` | Sales team | Date+time (IST). Fill before status. |
| AD | `showup_capi_event_id` | Apps Script | `<lead_id>_showup` |
| AE | `showup_capi_sent` | Apps Script | `TRUE` after fire |
| AF | `sale_closed` | Sales team | Dropdown `TRUE`/`FALSE`. Fires the HighTicketPurchase event. |
| AG | `contracted_value` | Sales team | Plain integer, INR, no symbols/commas (e.g. `60000`). **Fill BEFORE status.** Use CONTRACTED value (the full committed amount), not collected. |
| AH | `sales_time` | Sales team | Date+time (IST). |
| AI | `htsale_capi_event_id` | Apps Script | `<lead_id>_htsale` |
| AJ | `htsale_capi_sent` | Apps Script | `TRUE` after fire |

**Dropdown, NOT checkbox** for `call_booked` / `call_showed` / `sale_closed`: use a Data Validation dropdown with values `TRUE` and `FALSE` and leave the cell **blank by default**. (A checkbox defaults to FALSE, but Pabbly's "Add Row" writes a brand-new row where these manual cells must be genuinely empty so the Apps Script onEdit logic and the dedup checks behave correctly. A blank dropdown stays blank on row creation; a checkbox would render as unchecked=FALSE which muddies "never touched" vs "explicitly FALSE".)

**Column formats:**
- X, AB, AF → Data Validation dropdown: `TRUE`, `FALSE` (blank default)
- Y, AC, AH → Date+time cell (`yyyy-mm-dd hh:mm`, IST)
- AG → Plain number (no thousands separator)
- Z, AA, AD, AE, AI, AJ → leave for Apps Script (text + dropdown/TRUE)

**Plus a hidden `_Errors` tab** with header: `timestamp | row_number | event_type | http_status | response_body | retry_count`.

**Spreadsheet timezone** must be set to the client's operating timezone (File → Settings → Timezone) so datetime columns parse correctly.

---

## 6. STEP 3 — Apps Script (downstream event engine)

Use the provided `apps-script/Code.gs` as your template. It is funnel-agnostic in structure; you customize **two things**:

### 6.1 The `EVENTS` config — event names + column mapping

For a VSL funnel there are **3 downstream events**. Customize the `eventName` for this client (see naming guide §7). The column indices stay the same as the schema above. Template shape:

```js
const EVENTS = {
  CALL_BOOKED: {
    eventName: '<ClientTag>CallBooked',      // ← client-specific
    triggerCol: COL.CALL_BOOKED,             // X
    timeCol: COL.BOOKING_TIME,               // Y
    eventIdCol: COL.SCHEDULE_CAPI_EVENT_ID,  // Z
    sentCol: COL.SCHEDULE_CAPI_SENT,         // AA
    eventIdSuffix: 'schedule',
    includeValue: false,
  },
  CALL_SHOWED: {
    eventName: '<ClientTag>CallDone',        // ← client-specific
    triggerCol: COL.CALL_SHOWED,             // AB
    timeCol: COL.SHOWUP_TIME,                // AC
    eventIdCol: COL.SHOWUP_CAPI_EVENT_ID,    // AD
    sentCol: COL.SHOWUP_CAPI_SENT,           // AE
    eventIdSuffix: 'showup',
    includeValue: false,
  },
  SALE_CLOSED: {
    eventName: '<ClientTag>HighTicketPurchase', // ← client-specific
    triggerCol: COL.SALE_CLOSED,             // AF
    timeCol: COL.SALES_TIME,                 // AH
    eventIdCol: COL.HTSALE_CAPI_EVENT_ID,    // AI
    sentCol: COL.HTSALE_CAPI_SENT,           // AJ
    eventIdSuffix: 'htsale',
    includeValue: true,
    valueCol: COL.CONTRACTED_VALUE,          // AG
  },
};
```

### 6.2 The Script Properties (per-client secrets)

| Property | Value |
|---|---|
| `META_PIXEL_ID` | this client's pixel ID |
| `META_CAPI_ACCESS_TOKEN` | this client's CAPI access token |
| `EVENT_SOURCE_URL_DEFAULT` | this client's post-purchase/booking page URL |

Everything else in `Code.gs` — SHA-256 hashing, `user_data` construction (em, ph, fn, ln, ct, country, external_id + raw fbc/fbp/IP/UA), retry/backoff, `_Errors` logging, `setupTriggers`, `replayPendingEvents`, the `onSheetEdit` dispatcher — **stays identical**. Do not rewrite it; reuse it.

**What the Apps Script does per event** (already implemented in the template):
- Sales team sets the trigger dropdown to `TRUE` → `onSheetEdit` fires
- Reads the row, builds high-EMQ `user_data` (hashes em/ph/fn/ln/ct/country + external_id, forwards raw fbc/fbp/IP/UA)
- For HighTicketPurchase, includes `value` = contracted_value + `currency: INR`
- POSTs to `graph.facebook.com/v25.0/<pixel_id>/events`
- On success: stamps `*_capi_event_id` + `*_capi_sent = TRUE`
- On failure: logs to `_Errors`, leaves the row retry-able

---

## 7. Naming guide — client-specific event names

Reference (SDP's VSL): `CallBookedWithSDP`, `CallDoneWithSDP`, `SDPHighTicketPurchase`.

For a new client, derive a short ClientTag from the brand/product name and apply the same pattern:

| Logical event | Pattern | Example (client "AcmeFit") |
|---|---|---|
| Call booked | `<Tag>CallBooked` or `CallBookedWith<Tag>` | `AcmeFitCallBooked` |
| Call attended | `<Tag>CallDone` or `CallDoneWith<Tag>` | `AcmeFitCallDone` |
| High-ticket sale | `<Tag>HighTicketPurchase` | `AcmeFitHighTicketPurchase` |

Rules:
- Alphanumeric only, no spaces, ≤ 40 chars, consistent casing.
- Pick once, never change (Meta's ML needs naming stability).
- Propose the names in your Phase C plan and let the human confirm before coding.
- These are **custom events**. The tripwire `Purchase` + `sales` events keep their standard names — do not rename those.

---

## 8. STEP 4 — Deploy + smoke test

Follow the deployment section of the reference `apps-script/README.md`. Summary:
1. Open the client's CRM Sheet → Extensions → Apps Script. Paste `Code.gs` + `appsscript.json`.
2. Set the 3 Script Properties (§6.2).
3. Run `setupTriggers`, authorize permissions.
4. In Meta Events Manager → Test Events, generate a test code.
5. Drive a dummy row through the lifecycle (fill time → set status TRUE) for each of the 3 events; confirm each arrives in Test Events with EMQ 9+ and the `*_capi_sent` + `*_capi_event_id` columns auto-populate.
6. Confirm one real tripwire payment produces a complete Sheet row (all 23 auto-fill columns populated, especially fbc/fbp/external_id/IP/UA).

---

## 9. Verification, dedup, error handling, rollout

- **Dedup**: per-row `*_capi_sent` flag + deterministic `event_id` (`<lead_id>_<suffix>`). Meta dedupes same event_name+event_id within 48h.
- **Errors**: non-200 from Meta → logged to `_Errors` tab, flag left unset, row retry-able. Bulk recover via `replayPendingEvents`.
- **Rollout order**: Step 1 (backend Pabbly enrichment) → verify a real payment fills the Sheet → deploy Apps Script → smoke test → go live. Do not deploy Apps Script before the Sheet reliably receives complete rows.
- **Token rotation**: update `META_CAPI_ACCESS_TOKEN` in Script Properties; no redeploy needed.

---

## 10. Required deliverables from the agent

1. Phase A audit summary (5-10 bullets)
2. Phase B compare table (23 fields: have / missing / transform)
3. Phase C plan: backend change spec + Sheet schema + Apps Script event config + proposed client event names + risk list + verification plan + explicit Deviations section
4. **Stop for approval**
5. Post-approval: execute step-by-step, one commit per step, push only when told
6. Final side-by-side: this project's implementation vs. the SDP reference (route path, payment provider, transaction ID source, event names, hashed fields, etc.)

Do not silently deviate from this SOP. Any change from the reference pattern must be called out and justified.
