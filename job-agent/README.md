# Job Application Agent

Automated agent that searches jobs matching your resume, filters for **United States** roles **posted today**, skips positions that mention **no sponsorship**, tailors an **ATS resume** per job, and applies on **Greenhouse** career pages.

Built for **Achyuth Reddy Manku** — Java / Full Stack / GenAI profile.

## What it does

| Step | Command | Behavior |
|------|---------|----------|
| 1. Search | `npm run search` | Fetches Greenhouse boards + optional LinkedIn/Indeed (Apify). Filters US, posted today, no "no sponsorship". Scores vs `resume-profile.json`. |
| 2. Tailor | `npm run tailor` | Rewrites resume per job using OpenAI/Gemini (or keyword fallback). Saves `.docx` + `.txt` under `data/tailored-resumes/`. |
| 3. Apply | `npm run apply` | Playwright fills Greenhouse forms and uploads tailored resume. |
| 4. Full run | `npm run run` | Search → email digest → tailor → apply (when enabled). |

## Quick start

```bash
cd job-agent
cp .env.example .env
# Edit .env: add OPENAI_API_KEY or GEMINI_API_KEY, SMTP, optional APIFY_TOKEN

npm install
npm run setup          # installs Playwright Chromium

npm run search         # preview today's matches
npm run run            # full pipeline (apply off by default)
```

## Configuration

### Resume

- Edit `resume/base-resume.md` (auto-created on first run) **or** set `BASE_RESUME_PATH` to your PDF/DOCX path.
- Skills and search queries live in `resume-profile.json`.

### Filters (`.env`)

```bash
US_ONLY=true                 # United States locations only
POSTED_TODAY_ONLY=true       # Jobs posted today only
SKIP_NO_SPONSORSHIP=true     # Skip JDs mentioning no sponsorship
MIN_MATCH_SCORE=60           # Minimum resume match %
MIN_APPLY_SCORE=70           # Minimum score to auto-apply
```

### Sponsorship filter

Skips jobs whose title or description contains phrases like:

- "no sponsorship", "unable to sponsor", "no H-1B", "without sponsorship"
- "must be authorized to work without sponsorship"

### Auto-apply

```bash
AUTO_APPLY=true      # run Playwright apply step in `npm run run`
AUTO_SUBMIT=false    # set true only after testing — submits Greenhouse forms
HEADLESS=false       # false = visible browser for debugging
APPLY_LIMIT=3        # max applications per run
```

**Supported platforms for auto-apply:** Greenhouse (`*.greenhouse.io`) only.

LinkedIn/Indeed applications require logged-in sessions and often violate ToS — those links are emailed / queued for manual apply.

### Greenhouse companies

Edit `greenhouse-boards.json` to add board slugs:

```json
{ "slug": "stripe", "name": "Stripe" }
```

### Apify (optional)

Set `APIFY_TOKEN` to scrape LinkedIn + Indeed for jobs posted in the last 24 hours.

## Output files

```
data/
├── latest-jobs.json           # filtered + scored jobs
├── tailored-manifest.json     # resume paths per job
├── tailored-resumes/          # ATS .docx + .txt per application
├── apply-queue.json           # manual apply queue
└── apply-log.json             # submitted / failed applications
```

## Schedule daily (macOS)

```bash
# Example: run every weekday at 8am
(crontab -l 2>/dev/null; echo "0 8 * * 1-5 cd \"$HOME/new project 1/job-agent\" && /usr/bin/env AUTO_APPLY=true npm run run >> data/agent.log 2>&1") | crontab -
```

## Important notes

1. **Truthful resumes** — the tailor prompt forbids inventing experience; review every tailored resume before `AUTO_SUBMIT=true`.
2. **Test first** — run `npm run apply` with `AUTO_SUBMIT=false` and `HEADLESS=false` to watch the browser fill forms.
3. **Sponsorship** — jobs that don't mention sponsorship are still included; only explicit "no sponsorship" postings are skipped.
4. **Posted today** — Greenhouse uses ISO timestamps; LinkedIn uses Apify `r86400` (24h) filter.

## Your resume on Desktop

Copy or point to your PDF:

```bash
# Optional: extract text manually into resume/base-resume.md for best tailoring
open ~/Desktop/AChyuth\ JAVA.pdf
```
