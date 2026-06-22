# Job Application Agent — Rules & Filters

Automated pipeline: **search → filter → tailor resume (85–90% ATS) → apply → daily report**

## Active filters (your requirements)

| Rule | Setting |
|------|---------|
| Match resume + target role | `MIN_MATCH_SCORE=70` search, `MIN_APPLY_SCORE=75` apply |
| ATS resume ↔ job description | `MIN_RESUME_MATCH=85` (target 85–90%) |
| US locations only | `US_ONLY=true` |
| Skip no sponsorship | `SKIP_NO_SPONSORSHIP=true` |
| Skip US citizens only | `SKIP_US_CITIZEN_ONLY=true` |
| Skip security clearance | `SKIP_SECURITY_CLEARANCE=true` |
| Skip LinkedIn Easy Apply | `SKIP_LINKEDIN_EASY_APPLY=true` |
| Posting window | Prefer **≤5 hours**; if none, apply to **5–24 hour** jobs |
| Max age | Never apply to jobs **older than 24 hours** |

## Pipeline commands

```bash
npm run search    # Find role-matched jobs passing all filters
npm run tailor    # ATS-tailor resume per job (85–90% target)
npm run apply     # Tailor + apply + daily report
npm run report    # Generate today's application report
npm run run       # Full daily pipeline (8am launchd uses this)
```

## Portal-specific application details

Edit **`applicant-profile.json`** for fields each portal asks:

- **Greenhouse** — sponsorship, work authorization, citizen, EEO
- **Lever** — name, phone, LinkedIn, GitHub, comments
- **Ashby** — first/last name, sponsorship, authorization

Also set `.env` overrides: `APPLICANT_PHONE`, `APPLICANT_LINKEDIN`, etc.

## Daily reports

After each run, reports are saved to:

```
data/reports/report-YYYY-MM-DD.md
data/reports/report-YYYY-MM-DD.json
```

Tracks: submitted, prepared (form filled), failed, skipped (with reason).

## Resume tailoring

Requires **`OPENAI_API_KEY`** or **`GEMINI_API_KEY`**.

The agent iterates up to 3 passes until resume scores **≥85%** against the job description. Output is plain-text ATS format (`.docx` + `.txt`).

## Posting window logic

```
1. Collect jobs posted within last 24 hours
2. If any posted within last 5 hours → apply to those only
3. If none within 5 hours → apply to jobs posted 5–24 hours ago
4. Never apply to jobs older than 24 hours
```

## Setup

```bash
cp .env.example .env
# Add OPENAI_API_KEY or GEMINI_API_KEY, optional APIFY_TOKEN, SMTP_PASS

npm install && npm run setup
npm run install-agent   # daily 8:00 AM
```

## Auto-apply safety

```bash
AUTO_APPLY=true
AUTO_SUBMIT=false    # fill forms only — review first
HEADLESS=false       # watch the browser
```

When ready: `AUTO_SUBMIT=true`
