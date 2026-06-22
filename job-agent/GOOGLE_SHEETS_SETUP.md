# Google Sheets setup (5 minutes)

Reports sync to two tabs after each `npm run run`, `npm run apply`, or `npm run report`.

| Tab | Contents |
|-----|----------|
| **Applications** | One row per job (submitted, prepared, failed, skipped) |
| **Daily Summary** | One row per pipeline run |

---

## Step 1 — Create the spreadsheet

1. Open [Google Sheets](https://sheets.google.com) → **Blank spreadsheet**
2. Name it e.g. `Job Application Tracker`
3. Copy the **Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
   ```

---

## Step 2 — Google Cloud service account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or pick an existing one)
3. **APIs & Services → Library** → enable **Google Sheets API**
4. **APIs & Services → Credentials → Create credentials → Service account**
5. Create the account → **Keys → Add key → JSON** → download the file
6. Save it as:
   ```
   job-agent/google-service-account.json
   ```
   (This file is gitignored — never commit it.)

---

## Step 3 — Share the sheet with the service account

1. Open the downloaded JSON and copy the `client_email` (looks like `something@project-id.iam.gserviceaccount.com`)
2. In your Google Sheet → **Share** → paste that email → role **Editor** → Send

---

## Step 4 — Configure `.env`

Add to `job-agent/.env`:

```bash
GOOGLE_SHEETS_ID=your_spreadsheet_id_here
GOOGLE_SERVICE_ACCOUNT_PATH=./google-service-account.json
```

Optional tab names:

```bash
GOOGLE_SHEETS_APPLICATIONS_TAB=Applications
GOOGLE_SHEETS_SUMMARY_TAB=Daily Summary
```

---

## Step 5 — Test

```bash
cd job-agent
npm run sheets:test
npm run report
```

You should see rows appear in both tabs. Headers are created automatically on first run.

---

## Applications tab columns

| Column | Example |
|--------|---------|
| Date | 2026-06-06 |
| Time | 08:05:12 |
| Company | Stripe |
| Job Title | Software Engineer |
| Status | submitted / prepared / failed / skipped |
| Job Match % | 88 |
| Resume Match % | 91 |
| Platform | Greenhouse |
| Posting Window | ≤5h |
| Apply URL | https://... |
| Resume Path | data/tailored-resumes/... |
| Notes | skip reason or error message |

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `The caller does not have permission` | Share the sheet with the service account email |
| `Requested entity was not found` | Check `GOOGLE_SHEETS_ID` |
| `Google Sheets API has not been used` | Enable Sheets API in Cloud Console |
| `Service account JSON not found` | Check path in `GOOGLE_SERVICE_ACCOUNT_PATH` |

Local `.md` / `.json` reports in `data/reports/` are still saved as backup.
