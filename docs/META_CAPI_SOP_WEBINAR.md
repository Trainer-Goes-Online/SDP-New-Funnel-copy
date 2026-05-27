# SOP — Meta CAPI Downstream Feedback System for **Webinar / Live-Challenge Funnels**

> **Funnel type this SOP covers:** paid webinar or multi-day live challenge → attendees → high-intent leads → 1:1 sales call → high-ticket close. Ads run **5-12 days before** the event date; everyone who buys attends the **same** scheduled webinar/challenge.
> **For 1:1 VSL → sales-call funnels, use `META_CAPI_SOP_VSL.md` instead.**

This document is a complete implementation playbook. Paste it into a Claude Code session inside a sibling client project (which already has a frontend + backend + Razorpay). The agent reads it, audits the existing code, produces a plan, gets human approval, then executes.

You will also be given two **reference files** from the working SDP implementation:
- `apps-script/Code.gs` — the proven Apps Script source (your template)
- `apps-script/README.md` — its deployment + ops guide

Use those as the canonical reference. Adapt them to this project's actual code, form fields, and client name — do not copy blindly.

---

## ▶️ Kickoff prompt (paste this alongside the SOP)

```
You're implementing a Meta Conversions API downstream feedback system in this
project. Read META_CAPI_SOP_WEBINAR.md end-to-end before touching code. Also
read the two reference files apps-script/Code.gs and apps-script/README.md from
the SDP implementation — they are your template.

This is a webinar / live-challenge funnel (ads run for several days before a
single scheduled event date; all buyers attend the same event). Do NOT start
coding. Work the SOP's workflow in order:

1. AUDIT the existing codebase (payment verification route, current Pabbly
   webhook payload, current Meta CAPI event firing, checkout form fields,
   UTM/cookie capture, fbp/fbc handling).
2. COMPARE the existing Pabbly payload against the 23-field target in Step 1
   of the SOP. Produce a diff table (have / missing / needs-transform).
3. PLAN all changes: the Step 1 backend enrichment, the Sheet schema, the
   Apps Script. Propose client-specific custom event names. Surface every
   deviation explicitly.
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
Layer 1  Meta Ad (runs 5-12 days) → Landing → webinar/challenge ticket purchase (₹X) → Razorpay
Layer 2  Payment-verify server route:
           • fires existing Purchase + sales CAPI events  (DO NOT TOUCH)
           • POSTs an ENRICHED payload to the Pabbly webhook  ← Step 1 change
Layer 3  Pabbly → writes ONE row per lead into a Google Sheet CRM
Layer 4  Sales/ops team marks lifecycle status in the Sheet →
           Apps Script fires downstream Meta CAPI events:
             • LeadShowUp        (paid lead actually attended the webinar/challenge)
             • QualifiedLead     (attendee showed intent for a post-event sales call)
             • HighTicketPurchase(qualified lead bought the high-ticket offer)
```

The point: feed Meta the **downstream attendance + intent + revenue signals** — so Meta optimises toward buyers who show up, qualify, and buy high-ticket, not just anyone who buys a cheap webinar ticket.

**How this differs from the VSL funnel:**
- **VSL**: each lead books their OWN 1:1 call at their own time → events are `CallBooked → CallDone → HighTicketPurchase`.
- **Webinar/Challenge**: everyone attends the SAME scheduled event → the second event is `LeadShowUp` (did this paid lead attend?), and the **show-up date+time is identical for every attendee** (the webinar's scheduled datetime). Then `QualifiedLead` captures post-event intent, then `HighTicketPurchase`.

**Key architecture decisions (do not deviate without flagging):**
- Downstream events fire from **Apps Script directly to Meta Graph API** — no backend proxy. Secrets live in Apps Script `PropertiesService`. Each client is a self-contained, copy-paste deployment.
- The tripwire `Purchase` + `sales` events keep firing from the backend exactly as today.
- The Google Sheet is the single source of truth linking a lead's payment-time identifiers to their later lifecycle status.

---

## 2. Hard constraints — what you must NOT change

1. **Do NOT touch the existing Meta CAPI event firing.** This project fires two server-side events (`Purchase` + `sales`) after payment verification. They stay exactly as-is. Your Step 1 change adds fields to the **Pabbly webhook body only**.
2. **Do NOT add or change client-side Pixel events.** Browser fires `PageView` only.
3. **Do NOT introduce a backend endpoint for downstream events.** Apps Script talks to Meta directly.
4. **Do NOT change the payment flow, redirect behavior, or any user-facing copy/UI.**
5. **Do NOT invent form fields.** Hash and forward only what the checkout form actually collects.

---

## 3. Your workflow (follow in order)

### Phase A — Audit (report, don't change)
1. The server route handling **successful payment verification** (Pabbly POST + existing CAPI events live here).
2. The **current Pabbly webhook payload** — list every field.
3. The **current Meta CAPI event firing** — confirm `Purchase` + `sales`, note event_id + user_data fields.
4. The **checkout form fields** collected.
5. **UTM + click-ID capture** (UTMs, `fbclid`, `gclid`).
6. **fbp / fbc handling** server-side.
7. The **transaction ID** format (used as `lead_id` + event_id base).

Output a 5-10 bullet audit summary first.

### Phase B — Compare (drives Step 1)
Table for the **23 target fields** (Section 4): `HAVE` / `MISSING` / `TRANSFORM`.

### Phase C — Plan
Propose: Step 1 backend change + Sheet schema (Section 5) + Apps Script event config + **client-specific event names** (Section 7) + risk list + verification plan. Flag deviations explicitly.

### Phase D — Approval gate
Stop. Wait for human approval.

### Phase E — Execute
One step at a time, one commit per step, push only when told.

---

## 4. STEP 1 — Enrich the Pabbly webhook payload (UNIVERSAL — identical for every funnel)

> **This step is IDENTICAL to the VSL SOP.** The 23 fields below are the same for every funnel type. The funnel-specific differences begin at Step 2.

After payment verification, the server must POST these **23 fields** to the Pabbly webhook → columns A→W in the CRM Sheet.

| # | Field name (JSON key) | Type | How to derive it server-side |
|---|---|---|---|
| 1 | `lead_id` | string | Payment/transaction ID (Razorpay `payment_id`). Canonical unique key. |
| 2 | `created_at` | ISO 8601 | Payment timestamp with timezone. |
| 3 | `first_name` | string | From checkout form. |
| 4 | `last_name` | string | From checkout form. |
| 5 | `email` | string | From checkout form (raw). |
| 6 | `phone` | string | Dial code + number, e.g. `+919876543210`. |
| 7 | `city` | string | From checkout form. |
| 8 | `country_code` | string | 2-letter ISO (e.g. `IN`). |
| 9 | `fbc` | string | `_fbc` cookie value (raw). `""` if absent. |
| 10 | `fbp` | string | `_fbp` cookie value (raw). `""` if absent. |
| 11 | `client_ip_address` | string | First IP in `x-forwarded-for`, else `x-real-ip`. |
| 12 | `client_user_agent` | string | `user-agent` request header. |
| 13 | `external_id` | string | **`sha256(lowercase(trim(email)))`**, lowercase hex, computed server-side. Match the existing CAPI's external_id if present. |
| 14 | `event_source_url` | string | Page where conversion happened — pass `window.location.href` from client, fallback to hardcoded production checkout URL. |
| 15 | `amount` | number/string | Ticket amount charged (e.g. `499`, or `0` for test/bypass). |
| 16 | `is_test` | string | `"true"` / `"false"`. |
| 17 | `purchase_event_id` | string | The `event_id` used by the existing `Purchase` + `sales` events (typically = `lead_id`). |
| 18 | `utm_source` | string | From UTM capture. |
| 19 | `utm_medium` | string | From UTM capture. |
| 20 | `utm_campaign` | string | From UTM capture. |
| 21 | `utm_content` | string | From UTM capture. |
| 22 | `utm_term` | string | From UTM capture. |
| 23 | `fbclid` | string | Facebook click ID (backup for fbc reconstruction). |

**Implementation rules:**
- Add to the **existing** Pabbly payload object; keep what's already there.
- Send `""` for empty values, never `undefined`.
- `external_id` must match the existing CAPI's hashing exactly.
- **Do not touch CAPI event firing.** Only the Pabbly POST body changes.

**Deliverable:** Phase B diff table + enriched payload code, one focused commit.

---

## 5. STEP 2 — Google Sheet CRM schema (Webinar / Live-Challenge funnel)

One Sheet, **one row per lead**, 36 columns A→AJ. Columns A→W auto-filled by Pabbly (identical to every funnel). Columns X→AJ are the **webinar lifecycle** (sales/ops team + Apps Script).

### Auto-fill columns A→W (Pabbly writes — UNIVERSAL)

```
lead_id | created_at | first_name | last_name | email | phone | city | country_code | fbc | fbp | client_ip_address | client_user_agent | external_id | event_source_url | amount | is_test | purchase_event_id | utm_source | utm_medium | utm_campaign | utm_content | utm_term | fbclid
```

### Manual + Apps-Script columns X→AJ (webinar lifecycle)

| Col | Field | Written by | Notes |
|---|---|---|---|
| X | `attended` | Ops team | Dropdown `TRUE`/`FALSE`. Did this paid lead attend the webinar/challenge? Fires the **LeadShowUp** event. |
| Y | `showup_time` | Ops team | Date+time (IST) = the webinar/challenge scheduled datetime. **Same value for all attendees.** Fill before status. |
| Z | `leadshowup_capi_event_id` | Apps Script | `<lead_id>_showup` |
| AA | `leadshowup_capi_sent` | Apps Script | `TRUE` after fire — dedup flag |
| AB | `qualified` | Sales team | Dropdown `TRUE`/`FALSE`. Did the attendee show intent for a post-event sales call? Fires the **QualifiedLead** event. |
| AC | `qualified_time` | Sales team | Date+time (IST) when qualified/intent captured. Fill before status. |
| AD | `qualified_capi_event_id` | Apps Script | `<lead_id>_qualified` |
| AE | `qualified_capi_sent` | Apps Script | `TRUE` after fire |
| AF | `sale_closed` | Sales team | Dropdown `TRUE`/`FALSE`. Fires the **HighTicketPurchase** event. |
| AG | `contracted_value` | Sales team | Plain integer, INR, no symbols/commas (e.g. `60000`). **Fill BEFORE status.** Use CONTRACTED value (full committed amount), not collected. |
| AH | `sales_time` | Sales team | Date+time (IST). |
| AI | `htsale_capi_event_id` | Apps Script | `<lead_id>_htsale` |
| AJ | `htsale_capi_sent` | Apps Script | `TRUE` after fire |

**Dropdown, NOT checkbox** for `attended` / `qualified` / `sale_closed`: Data Validation dropdown with values `TRUE` / `FALSE`, **blank by default**. (Pabbly's "Add Row" writes a new row where these manual cells must be genuinely empty; a checkbox would default to unchecked=FALSE and muddy "never touched" vs. "explicitly FALSE". A blank dropdown stays blank on row creation.)

**Webinar-specific tip:** because `showup_time` (col Y) is the same datetime for every attendee, ops can fill it once and copy down the column for all rows, then toggle `attended` per row. The Apps Script still fires once per row when `attended` flips to TRUE.

**Column formats:**
- X, AB, AF → Data Validation dropdown: `TRUE`, `FALSE` (blank default)
- Y, AC, AH → Date+time cell (`yyyy-mm-dd hh:mm`, IST)
- AG → Plain number (no thousands separator)
- Z, AA, AD, AE, AI, AJ → Apps Script writes

**Plus a hidden `_Errors` tab**: `timestamp | row_number | event_type | http_status | response_body | retry_count`.

**Spreadsheet timezone** = client's operating timezone (File → Settings → Timezone).

---

## 6. STEP 3 — Apps Script (downstream event engine)

Use the provided `apps-script/Code.gs` as your template. Structure is funnel-agnostic; you customize the `EVENTS` config + Script Properties. **Critically: the column indices in `COL` are the same A→AJ, but you must relabel the constant names + the `EVENTS` config to the webinar lifecycle.**

### 6.1 The `EVENTS` config — webinar event names + column mapping

Three downstream events. Customize `eventName` per client (§7). Template shape:

```js
const EVENTS = {
  LEAD_SHOWUP: {
    eventName: '<ClientTag>LeadShowUp',         // ← client-specific
    triggerCol: COL.ATTENDED,                   // X
    timeCol: COL.SHOWUP_TIME,                   // Y
    eventIdCol: COL.LEADSHOWUP_CAPI_EVENT_ID,   // Z
    sentCol: COL.LEADSHOWUP_CAPI_SENT,          // AA
    eventIdSuffix: 'showup',
    includeValue: false,
  },
  QUALIFIED: {
    eventName: '<ClientTag>QualifiedLead',      // ← client-specific (or HighIntentLead)
    triggerCol: COL.QUALIFIED,                  // AB
    timeCol: COL.QUALIFIED_TIME,                // AC
    eventIdCol: COL.QUALIFIED_CAPI_EVENT_ID,    // AD
    sentCol: COL.QUALIFIED_CAPI_SENT,           // AE
    eventIdSuffix: 'qualified',
    includeValue: false,
  },
  SALE_CLOSED: {
    eventName: '<ClientTag>HighTicketPurchase', // ← client-specific
    triggerCol: COL.SALE_CLOSED,                // AF
    timeCol: COL.SALES_TIME,                    // AH
    eventIdCol: COL.HTSALE_CAPI_EVENT_ID,       // AI
    sentCol: COL.HTSALE_CAPI_SENT,              // AJ
    eventIdSuffix: 'htsale',
    includeValue: true,
    valueCol: COL.CONTRACTED_VALUE,             // AG
  },
};
```

Update the `COL` constant map to the webinar column names (ATTENDED=24, SHOWUP_TIME=25, LEADSHOWUP_CAPI_EVENT_ID=26, LEADSHOWUP_CAPI_SENT=27, QUALIFIED=28, QUALIFIED_TIME=29, QUALIFIED_CAPI_EVENT_ID=30, QUALIFIED_CAPI_SENT=31, SALE_CLOSED=32, CONTRACTED_VALUE=33, SALES_TIME=34, HTSALE_CAPI_EVENT_ID=35, HTSALE_CAPI_SENT=36). Columns 1-23 (A→W) are unchanged from the reference.

### 6.2 The Script Properties (per-client secrets)

| Property | Value |
|---|---|
| `META_PIXEL_ID` | this client's pixel ID |
| `META_CAPI_ACCESS_TOKEN` | this client's CAPI access token |
| `EVENT_SOURCE_URL_DEFAULT` | this client's webinar/registration page URL |

Everything else in `Code.gs` — SHA-256 hashing, `user_data` construction, retry/backoff, `_Errors` logging, `setupTriggers`, `replayPendingEvents`, the `onSheetEdit` dispatcher — **stays identical**. Reuse it; do not rewrite.

---

## 7. Naming guide — client-specific event names

Reference pattern (apply a short ClientTag derived from the brand):

| Logical event | Pattern | Example (client "AcmeFit") |
|---|---|---|
| Attended the webinar/challenge | `<Tag>LeadShowUp` | `AcmeFitLeadShowUp` |
| Showed intent for sales call | `<Tag>QualifiedLead` or `<Tag>HighIntentLead` | `AcmeFitQualifiedLead` |
| High-ticket sale | `<Tag>HighTicketPurchase` | `AcmeFitHighTicketPurchase` |

Rules:
- Alphanumeric only, no spaces, ≤ 40 chars, consistent casing.
- Pick once, never change.
- Propose names in Phase C and let the human confirm.
- The tripwire `Purchase` + `sales` keep their standard names — do not rename.

---

## 8. STEP 4 — Deploy + smoke test

Per the reference `apps-script/README.md`:
1. Client CRM Sheet → Extensions → Apps Script → paste `Code.gs` + `appsscript.json`.
2. Set 3 Script Properties (§6.2).
3. Run `setupTriggers`, authorize.
4. Meta Events Manager → Test Events → generate code.
5. Drive a dummy row: set `showup_time` → flip `attended` TRUE (expect LeadShowUp); fill `qualified_time` → flip `qualified` TRUE (expect QualifiedLead); fill `contracted_value` + `sales_time` → flip `sale_closed` TRUE (expect HighTicketPurchase with value). Confirm each arrives with EMQ 9+ and columns auto-populate.
6. Confirm a real ticket purchase produces a complete Sheet row (all 23 auto-fill cols, especially fbc/fbp/external_id/IP/UA).

---

## 9. Verification, dedup, error handling, rollout

- **Dedup**: per-row `*_capi_sent` flag + deterministic `event_id` (`<lead_id>_<suffix>`). Meta dedupes same event_name+event_id within 48h.
- **Errors**: non-200 → `_Errors` tab, flag unset, row retry-able. Bulk recover via `replayPendingEvents`.
- **Webinar timing note**: the LeadShowUp events are typically fired in a batch right after the webinar (ops marks all attendees at once). The Apps Script fires one event per row as each `attended` flips TRUE. If marking hundreds of rows at once, pace the edits or use `replayPendingEvents` which self-throttles at 500ms/event.
- **Rollout order**: Step 1 (Pabbly enrichment) → verify a real ticket purchase fills the Sheet → deploy Apps Script → smoke test → go live before the webinar date so the lifecycle columns are ready when the event happens.
- **Token rotation**: update `META_CAPI_ACCESS_TOKEN` in Script Properties; no redeploy.

---

## 10. Required deliverables from the agent

1. Phase A audit summary (5-10 bullets)
2. Phase B compare table (23 fields)
3. Phase C plan: backend change + Sheet schema + Apps Script event config + proposed client event names + risks + verification + explicit Deviations section
4. **Stop for approval**
5. Post-approval: execute step-by-step, one commit per step, push only when told
6. Final side-by-side: this project vs. the SDP reference

Do not silently deviate. Any change from the reference pattern must be called out and justified.
