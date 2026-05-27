# SDP CRM — Apps Script Downstream CAPI Engine

Apps Script bound to the **SDP CRM** Google Sheet that fires three downstream
Meta Conversions API events whenever a sales-team-edited dropdown is set to TRUE:

| Sheet dropdown set to TRUE | Meta CAPI event fired | Carries value? |
|---|---|---|
| `call_booked` (col X) | `CallBookedWithSDP` | no |
| `call_showed` (col AB) | `CallDoneWithSDP` | no |
| `sale_closed` (col AF) | `SDPHighTicketPurchase` | yes — `contracted_value` from col AG |

The tripwire `SDPPurchase` event for the ₹97 payment is fired separately by our
Next.js backend at payment-verify time. This script handles only the three
downstream events. The two systems share the same Meta pixel ID and access
token but never talk to each other directly — the Sheet is the only link.

---

## Files

- **`Code.gs`** — paste into the Apps Script editor (replaces the default file)
- **`appsscript.json`** — paste into the manifest (Apps Script editor → gear icon → Show appsscript.json manifest file)
- **`README.md`** — this file

These files live in the repo as a template. They are NOT auto-deployed. To make
them live, copy-paste them into a Google Sheet's Apps Script editor (steps below).

---

## Prerequisites

Before deploying, the following must be true:

1. **The SDP CRM Google Sheet exists** with the 36-column schema:
   `lead_id | created_at | first_name | last_name | email | phone | city | country_code | fbc | fbp | client_ip_address | client_user_agent | external_id | event_source_url | amount | is_test | purchase_event_id | utm_source | utm_medium | utm_campaign | utm_content | utm_term | fbclid | call_booked | booking_time | schedule_capi_event_id | schedule_capi_sent | call_showed | showup_time | showup_capi_event_id | showup_capi_sent | sale_closed | contracted_value | sales_time | htsale_capi_event_id | htsale_capi_sent`
   in row 1, columns A through AJ.

2. **The hidden `_Errors` tab exists** with this header in row 1:
   `timestamp | row_number | event_type | http_status | response_body | retry_count`

3. **Column types are correctly set**:
   - X, AA, AB, AE, AF, AJ → **Dropdown** (Data → Data validation → Dropdown → values `TRUE` and `FALSE`, exact uppercase). **Do NOT use checkboxes** — they pre-populate as FALSE when Pabbly creates a new row, which is indistinguishable from "sales team explicitly marked FALSE". Dropdowns stay empty until someone picks a value.
   - Y, AC, AH → **Date+time** (Format → Number → Date time)
   - AG → **Plain number** (no thousands separator, no currency symbol)

4. **Spreadsheet timezone is `Asia/Kolkata`** (File → Settings → Timezone).
   This matters because Apps Script reads `booking_time`/`showup_time`/`sales_time`
   as Date objects and the timezone determines what those datetimes resolve to.

5. **Pabbly is writing rows correctly** — at least one real payment has produced
   a row with all 23 auto-fill columns populated (especially `lead_id`, `email`,
   `fbc`, `fbp`, `client_ip_address`, `client_user_agent`).

---

## Deployment (first-time setup, ~10 minutes)

### 1. Open the Sheet's Apps Script editor

In the SDP CRM Sheet → **Extensions** menu → **Apps Script**.

This opens a new tab with an empty `Code.gs` file.

### 2. Paste in `Code.gs`

- Select all in the default `Code.gs` → delete.
- Paste the entire contents of [`Code.gs`](./Code.gs) from this repo.
- Cmd+S (Mac) or Ctrl+S (Win) to save.
- Rename the file to `Code` if it's not already.

### 3. Replace the manifest

- Click the gear icon (Project Settings) in the left sidebar.
- Check **"Show 'appsscript.json' manifest file in editor"**.
- Click back to the Editor (`< >` icon).
- Open `appsscript.json` (now visible in the file list).
- Replace its contents with [`appsscript.json`](./appsscript.json).
- Save.

### 4. Add Script Properties (where secrets live)

- Project Settings (gear icon) → scroll to **Script Properties** → **Add script property**.

Add these three properties:

| Property name | Value | Notes |
|---|---|---|
| `META_PIXEL_ID` | `1611587520198855` | Your existing pixel ID (matches Vercel's `NEXT_PUBLIC_META_PIXEL_ID`) |
| `META_CAPI_ACCESS_TOKEN` | `<your token>` | Same value as Vercel's `META_CAPI_ACCESS_TOKEN`. **Treat as a secret.** Anyone with edit access to this Apps Script can read it. |
| `EVENT_SOURCE_URL_DEFAULT` | `https://sdp.sciencedrivenperformance.in/new-book-a-call` | Fallback if a row's `event_source_url` column is empty |

Optional advanced overrides (only set if you need them):

| Property name | Default | Use when |
|---|---|---|
| `MAIN_SHEET_NAME` | `Sheet1` | You renamed the main tab to something other than `Sheet1` |
| `META_GRAPH_API_VERSION` | `v25.0` | Meta releases a new API version and you want to pin to it |

Click **Save script properties**.

### 5. Install the onEdit trigger

- Go back to the Editor (`< >` icon).
- In the function selector dropdown at the top, choose `setupTriggers`.
- Click **Run**.
- Google will prompt for authorization the first time:
  - Click **Review permissions** → choose the Google account that owns the Sheet.
  - You'll see a "Google hasn't verified this app" warning — this is normal for unpublished Apps Scripts. Click **Advanced** → **Go to (project name) (unsafe)**.
  - Approve the requested scopes:
    - See, edit, create, and delete only the **current** spreadsheet
    - Connect to an external service (UrlFetchApp — for posting to Meta)
    - Manage your script's triggers
- The function runs. Look at the bottom panel — you should see a log line:
  `setupTriggers OK — removed 0 old, installed 1 new onSheetEdit trigger`.
- Sheet shows a toast: `setupTriggers OK …`.

### 6. Smoke test

Don't trust unverified code — test it against Meta's Test Events tab.

- In a browser, open **Meta Events Manager** → your dataset (`SDP <> New Nov`) → **Test Events** tab.
- Copy the **Test Event Code** displayed (e.g., `TEST12345`).

**Option A — test against a real row** (recommended once Pabbly is mapped):

- Open the SDP CRM Sheet.
- Find a real row (or paste the dummy row from the bottom of this README).
- Click the `call_booked` dropdown (column X) → select `TRUE`.
- Wait 5-10 seconds.
- In Meta Events Manager → Test Events: a `CallBookedWithSDP` event should appear.
  - Source: Server
  - Event Match Quality: should be 8-9+ if all identifier columns are populated
  - User parameters: email, phone, fn, ln, ct, country, external_id all shown as "Sent"
- Back in the Sheet: column Z should now hold `pay_xxx_schedule`, column AA should now show `TRUE`.
- Repeat for `call_showed` (col AB) — expect `CallDoneWithSDP` to appear.
- Repeat for `sale_closed` (col AF) — but FIRST fill in `contracted_value` (col AG) with a number like `60000`, then set the dropdown to `TRUE`. Expect `SDPHighTicketPurchase` with `value: 60000` in custom_data.

**Option B — paste a dummy row** if Pabbly isn't writing real rows yet (see "Dummy row" section at the bottom of this README).

### 7. Optional — add the script to the Sheet menu

For sales-team convenience, you can add an "SDP CRM" menu to the Sheet that lets non-tech users run `replayPendingEvents()` manually. Not implemented in v1; add later if you need it.

---

## Replicating for a new client (~15 minutes per client)

The whole point of Apps Script-only architecture: zero backend deploy needed
to add a new client. Steps for client N+1:

1. **Create a new Google Sheet** in their Google account, copy the 36-column header from this repo.
2. **Open the Sheet's Apps Script editor** (Extensions → Apps Script).
3. **Paste `Code.gs` and `appsscript.json`** from this repo (no changes needed).
4. **Set 3 Script Properties** for the new client:
   - `META_PIXEL_ID` = their pixel ID
   - `META_CAPI_ACCESS_TOKEN` = their CAPI access token
   - `EVENT_SOURCE_URL_DEFAULT` = their funnel's checkout URL
5. **Run `setupTriggers`** + authorize.
6. **Smoke test** against their pixel's Test Events tab.

That's it. No code change. No backend deploy. The Apps Script is the same code
across all clients; only the script properties differ.

---

## How it works internally

### Trigger flow

```
Sales team checks call_booked on row 47
  ↓
Google fires installable onEdit trigger → onSheetEdit(e)
  ↓
onSheetEdit reads e.range, identifies col X = call_booked
  ↓
Looks up EVENTS.CALL_BOOKED config (eventName, columns, suffix)
  ↓
Checks e.value is TRUE (it is — TRUE just selected from dropdown)
  ↓
Reads col AA (schedule_capi_sent) — confirms it's blank/FALSE (not already sent)
  ↓
fireDownstreamEvent(sheet, 47, EVENTS.CALL_BOOKED)
  ↓
  • reads entire row (36 cells)
  • builds event_id = `${lead_id}_schedule`
  • parses booking_time (col Y) → Unix seconds
  • builds user_data: SHA-256 hashes em/ph/fn/ln/ct/country + external_id
                     + raw fbc/fbp/client_ip_address/client_user_agent
  • builds custom_data: payment_id + UTM context for reporting
  • POSTs to graph.facebook.com/v25.0/{PIXEL_ID}/events?access_token=...
  • Retries up to 3x on 429/5xx with exponential backoff (1s/2s/4s)
  ↓
On 200 from Meta:
  • Sets col Z (schedule_capi_event_id) = `${lead_id}_schedule`
  • Sets col AA (schedule_capi_sent) = TRUE
  • Logs success to Apps Script Cloud Logs
On non-200:
  • Appends a row to the _Errors tab
  • Leaves col AA blank — row remains retry-able
  • Logs warning to Apps Script Cloud Logs
```

### Deduplication strategy

- **Sheet-side**: `schedule_capi_sent` flag check before firing. If TRUE, skip. Prevents double-fire on accidental toggle-off / toggle-on.
- **Meta-side**: event_id is deterministic (`{lead_id}_schedule`). Meta dedupes events within 48h that share `event_name` + `event_id`. If our script accidentally fires twice via retries, Meta counts it as one.
- **Cross-event**: each event type has a different `event_name`, so they never dedupe against each other.

### Why event_id is deterministic, not random

Three reasons:

1. **Idempotent retries**: if a fire fails and we retry later (or `replayPendingEvents` runs), the same event_id is generated. Meta dedupes the retry against the previous attempt if it sneaked through.
2. **Easy audit**: looking at the row, you instantly know which Meta event corresponds to it. No need to look up an opaque UUID.
3. **No state needed**: no random number generator state to persist, no UUID library dependency.

The downside: if you want to fire the same event_name for the same lead twice (e.g., the lead booked TWO different calls), the second fire would dedupe against the first. We accept this limitation because it's the desired behavior for the SDP funnel — a lead is expected to book one call, attend one call, and pay for one high-ticket program.

---

## Operations & troubleshooting

### Where to find logs

- **Success logs**: Apps Script editor → **Executions** tab (left sidebar). Filter by function name `onSheetEdit` or `fireDownstreamEvent`.
- **Failures**: same Executions tab AND the `_Errors` tab in the Sheet.

### A row's dropdown is set to TRUE but the event never fired

Check in order:

1. **Was the trigger installed?** Apps Script editor → Triggers (left sidebar, clock icon). You should see one entry: `onSheetEdit` for spreadsheet `SDP CRM`, event `On edit`.
   - If empty: run `setupTriggers` again.
2. **Did the trigger fire?** Apps Script editor → Executions. Filter for the time you changed the dropdown.
   - If no execution shown: Pabbly's "Add Row" or some other automation might be writing TRUE to a manual column via API — installable onEdit doesn't always fire for those programmatic writes. Workaround: set the dropdown back to blank, then to TRUE again.
3. **Did the script run but exit early?** Check the execution log for messages like `already sent, skipping` (meaning the dedup flag was already TRUE).
4. **Did the script call Meta but get a non-200?** Check `_Errors` tab for a recent row matching this event + row number.

### Apps Script says "Authorization required" every time

Triggers can lose authorization if the script owner changes. Fix: open the editor, run `setupTriggers` again, re-authorize.

### Event arrives in Meta but with low EMQ (e.g., 5-6 instead of 9+)

Usually means one or more identifier columns is blank for that row. Open the row and check that `fbc`, `fbp`, `client_ip_address`, `client_user_agent`, `external_id`, `email`, `phone` are all populated. If any is blank: Pabbly mapping issue — fix in Step 2.

### Force a re-fire of a single event

The dedup flag prevents accidental re-fires. To intentionally re-fire:

1. Open the row.
2. Manually clear the `*_capi_sent` flag column (AA / AE / AJ) — set it back to blank or FALSE.
3. Set the trigger column dropdown (X / AB / AF) back to blank, then to TRUE again.

The event fires fresh. If event_id matches a previous fire within 48h, Meta dedupes — so the second fire usually doesn't increment Meta's count.

### Bulk replay

To replay every row that has a TRUE trigger dropdown but no corresponding sent flag (e.g., after a Meta API outage):

1. Apps Script editor → function dropdown → `replayPendingEvents`.
2. Click Run.
3. Watch the Executions log for `Replayed N event(s)`.

The script paces itself at 500ms between fires to avoid hitting Meta's rate limits.

### Rotating the access token

1. Generate a new CAPI access token in Meta Events Manager → Settings → Conversions API → Generate access token.
2. Apps Script editor → Project Settings → Script Properties → update `META_CAPI_ACCESS_TOKEN`.
3. Save. No restart needed — the next event fire uses the new token.

---

## Dummy row for smoke testing

Paste this into row 2 of the SDP CRM Sheet (replace any test data already there)
if you want to run the smoke test before real payments are flowing through.
Adjust `created_at` / `booking_time` / `showup_time` / `sales_time` to recent
timestamps in IST.

| Col | Value |
|---|---|
| A `lead_id` | `pay_dummyABC123` |
| B `created_at` | `2026-05-27T14:00:00+05:30` |
| C `first_name` | `Test` |
| D `last_name` | `Lead` |
| E `email` | `test+sdp@example.com` |
| F `phone` | `+919999999999` |
| G `city` | `Mumbai` |
| H `country_code` | `IN` |
| I `fbc` | `fb.1.1716200533000.IwAR2_test_fbc` |
| J `fbp` | `fb.1.1716200533000.1234567890` |
| K `client_ip_address` | `203.0.113.42` |
| L `client_user_agent` | `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15` |
| M `external_id` | `9961e4fa802e2d946992b0b40458f818f745e34399d1549ab98e3e3a93908988` |
| N `event_source_url` | `https://sdp.sciencedrivenperformance.in/new-checkout-page` |
| O `amount` | `97` |
| P `is_test` | `false` |
| Q `purchase_event_id` | `pay_dummyABC123` |
| R `utm_source` | `facebook` |
| S `utm_medium` | `cpc` |
| T `utm_campaign` | `sdp_3_vsl_broad` |
| U `utm_content` | `ad_creative_v3` |
| V `utm_term` | `senior_professionals` |
| W `fbclid` | `IwAR2_test_fbclid` |
| X – AJ | leave blank (sales team / script fills these) |

The `external_id` value above is `sha256('test+sdp@example.com')` — pre-computed
so the Apps Script's hash matches it (sanity check that hashing is correct).

After pasting, the smoke test sequence is:

1. **Test `CallBookedWithSDP`**: set col X dropdown to `TRUE`. After 5-10 seconds:
   - Col Z should hold `pay_dummyABC123_schedule`.
   - Col AA should now show `TRUE`.
   - Meta Test Events tab should show `CallBookedWithSDP` with EMQ ~9.
2. **Test `CallDoneWithSDP`**: fill col AC with `2026-05-27 15:30`, then set col AB dropdown to `TRUE`. After 5-10 seconds:
   - Col AD should hold `pay_dummyABC123_showup`.
   - Col AE should now show `TRUE`.
   - Meta Test Events should show `CallDoneWithSDP`.
3. **Test `SDPHighTicketPurchase`**: fill col AG with `60000`, fill col AH with `2026-05-27 15:45`, then set col AF dropdown to `TRUE`. After 5-10 seconds:
   - Col AI should hold `pay_dummyABC123_htsale`.
   - Col AJ should be checked.
   - Meta Test Events should show `SDPHighTicketPurchase` with `value: 60000, currency: INR`.

If any step doesn't produce the expected result, check `_Errors` tab + Apps Script
Executions log.

---

## Known limitations

- **`onEdit` triggers don't fire on edits made by other Apps Scripts** in the same project. Not relevant here (we only have one script).
- **Apps Script execution time limit**: 6 minutes per simple trigger / 30 minutes per installable. A single CAPI fire is sub-second, so this is irrelevant for routine operation. Only `replayPendingEvents` over hundreds of rows could approach this.
- **`UrlFetchApp` daily quota**: 20,000 calls/day on consumer Google accounts, 100,000/day on Workspace. SDP volume is far below this.
- **Script Properties are visible to all editors** of the Apps Script project. Restrict editor access to dev/ops only; give sales team only viewer + commenter access to the Sheet itself.
- **Apps Script does NOT fire on programmatic edits** from external Sheets API callers (like Pabbly's "Add Row") in some configurations. Installable `onEdit` is supposed to fire for both, but behavior is documented inconsistently. Manual dropdown selections by sales team are the canonical trigger path and always work — which is exactly why we use dropdowns (empty by default until a human selects TRUE/FALSE) rather than checkboxes (which pre-populate as FALSE on row creation and would generate noise from Pabbly's writes).
