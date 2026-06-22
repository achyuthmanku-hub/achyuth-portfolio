import 'dotenv/config'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { scrapeAllPlatforms } from './apify-scraper.js'
import { scoreJob, dedupeJobs, profile } from './job-matcher.js'
import { filterJobs, filterJobsForApply } from './filters.js'
import { sendJobDigest, sendDailyReportEmail } from './email-digest.js'
import { fetchAllCompanyJobs } from './scrapers/fetch-companies.js'
import { tailorResumeForJob, saveTailoredResumeDocx, TARGET_MIN } from './resume-tailor.js'
import { applyToJobs } from './auto-applier.js'
import {
  buildDailyReport,
  saveDailyReport,
  recordDailyRun,
} from './application-tracker.js'
import { syncReportToGoogleSheets, testGoogleSheetsConnection } from './google-sheets.js'
import companies from '../companies.json' with { type: 'json' }

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '../data')
const OUT_PATH = join(DATA_DIR, 'latest-jobs.json')

const MIN_JOB_MATCH = Number(process.env.MIN_MATCH_SCORE) || 70
const MIN_APPLY_JOB_MATCH = Number(process.env.MIN_APPLY_SCORE) || 75
const MIN_RESUME_MATCH = Number(process.env.MIN_RESUME_MATCH) || TARGET_MIN

function enrichJobs(raw) {
  return raw.map((job) => {
    const scored = scoreJob(job)
    return {
      ...job,
      id: job.applyLink || `${job.company}|${job.title}`,
      matchScore: scored.matchScore,
      keySkills: job.keySkills?.length ? job.keySkills : scored.jobSkills.slice(0, 8),
      whyMatch: scored.whyMatch,
      matchedSkills: scored.matchedSkills,
    }
  })
}

async function fetchAllJobs() {
  let raw = []

  console.log(`Fetching jobs from ${companies.length} companies...`)
  raw = raw.concat(await fetchAllCompanyJobs(companies))

  if (process.env.APIFY_TOKEN) {
    console.log('Scraping LinkedIn + Indeed (24h, no Easy Apply)...')
    raw = raw.concat(await scrapeAllPlatforms(profile.searchQueries.slice(0, 5)))
  } else {
    console.log('APIFY_TOKEN not set — company boards only.')
  }

  return raw.filter((j) => j.applyLink && j.title)
}

async function searchJobs() {
  let jobs = enrichJobs(await fetchAllJobs())
  jobs = dedupeJobs(jobs)

  jobs = filterJobs(jobs, {
    usOnly: process.env.US_ONLY !== 'false',
    skipNoSponsorship: process.env.SKIP_NO_SPONSORSHIP !== 'false',
    skipUsCitizenOnly: process.env.SKIP_US_CITIZEN_ONLY !== 'false',
    skipSecurityClearance: process.env.SKIP_SECURITY_CLEARANCE !== 'false',
    skipLinkedInEasyApply: process.env.SKIP_LINKEDIN_EASY_APPLY !== 'false',
    maxPostedHours: Number(process.env.POSTED_MAX_HOURS) || 24,
  })

  jobs = jobs.filter((j) => j.matchScore >= MIN_JOB_MATCH && j.matchScore > 0)
  jobs.sort((a, b) => b.matchScore - a.matchScore)

  mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(OUT_PATH, JSON.stringify(jobs, null, 2))
  console.log(`Saved ${jobs.length} role-matched jobs (≤24h, filtered) → ${OUT_PATH}`)
  return jobs
}

function loadJobs() {
  if (!existsSync(OUT_PATH)) throw new Error('Run `npm run search` first')
  return JSON.parse(readFileSync(OUT_PATH, 'utf8'))
}

function selectApplyCandidates(jobs) {
  const { jobs: windowed, window, label } = filterJobsForApply(jobs)
  const eligible = windowed.filter((j) => j.matchScore >= MIN_APPLY_JOB_MATCH)

  console.log(
    `Posting window: ${label} (${window}) — ${eligible.length} jobs ≥${MIN_APPLY_JOB_MATCH}% role match`
  )

  return { eligible, postingWindow: label, windowType: window }
}

async function tailorForJobs(jobs, limit = 5) {
  const resumeByJobId = {}
  const tailored = []

  for (const job of jobs.slice(0, limit)) {
    const result = await tailorResumeForJob(job, {
      minJobScore: MIN_APPLY_JOB_MATCH,
      jobMatchScore: job.matchScore,
    })

    if (result.resumeMatchScore < MIN_RESUME_MATCH - 5) {
      console.log(
        `Skip tailor apply: ${job.title} @ ${job.company} — resume match ${result.resumeMatchScore}% (need ${MIN_RESUME_MATCH}%)`
      )
      continue
    }

    const saved = await saveTailoredResumeDocx(job, result.text)
    resumeByJobId[job.applyLink] = saved.docxPath

    const enriched = {
      ...job,
      resumeMatchScore: result.resumeMatchScore,
      resumePath: saved.docxPath,
    }

    tailored.push({
      job: enriched,
      tailored: result.tailored,
      resumeMatchScore: result.resumeMatchScore,
      reason: result.reason,
      ...saved,
    })

    console.log(
      `${result.tailored ? 'Tailored' : 'Base'} resume → ${saved.docxPath} | job ${job.matchScore}% / resume ${result.resumeMatchScore}%`
    )
  }

  writeFileSync(join(DATA_DIR, 'tailored-manifest.json'), JSON.stringify(tailored, null, 2))
  return {
    tailored,
    resumeByJobId,
    applyJobs: tailored.map((t) => t.job),
  }
}

async function generateReport() {
  const report = buildDailyReport()
  const paths = saveDailyReport(report)
  console.log(`Daily report saved:\n  ${paths.mdPath}\n  ${paths.jsonPath}`)

  await syncReportToGoogleSheets(report).catch((e) =>
    console.warn('Google Sheets sync skipped:', e.message)
  )

  if (process.env.SMTP_USER) {
    await sendDailyReportEmail(report, paths.mdPath).catch((e) =>
      console.warn('Report email skipped:', e.message)
    )
  }
  return report
}

async function main() {
  const cmd = process.argv[2] || 'run'

  if (cmd === 'search') {
    printTable(await searchJobs())
    return
  }

  if (cmd === 'report') {
    await generateReport()
    return
  }

  if (cmd === 'sheets:test') {
    const info = await testGoogleSheetsConnection()
    console.log('Connected:', info.title)
    console.log('URL:', info.url)
    console.log('Tabs:', info.sheets?.join(', '))
    return
  }

  if (cmd === 'tailor') {
    const jobs = loadJobs()
    const { eligible } = selectApplyCandidates(jobs)
    await tailorForJobs(eligible)
    return
  }

  if (cmd === 'apply') {
    const jobs = loadJobs()
    const { eligible, postingWindow } = selectApplyCandidates(jobs)
    const { resumeByJobId, applyJobs } = await tailorForJobs(
      eligible,
      Number(process.env.APPLY_LIMIT) || 5
    )
    await applyToJobs(applyJobs, {
      resumeByJobId,
      limit: Number(process.env.APPLY_LIMIT) || 5,
      headless: process.env.HEADLESS !== 'false',
    })
    recordDailyRun({ postingWindow, applied: applyJobs.length })
    await generateReport()
    return
  }

  if (cmd === 'email') {
    await sendJobDigest(loadJobs())
    return
  }

  if (cmd === 'run') {
    const jobs = await searchJobs()
    printTable(jobs)

    if (!jobs.length) {
      console.log('\nNo matching jobs in the last 24 hours.')
      await generateReport()
      return
    }

    const { eligible, postingWindow, windowType } = selectApplyCandidates(jobs)

    if (!eligible.length) {
      console.log(`\nNo jobs in ${postingWindow} window with ≥${MIN_APPLY_JOB_MATCH}% role match.`)
      recordDailyRun({ postingWindow, windowType, eligible: 0 })
      await generateReport()
      return
    }

    if (process.env.SMTP_USER) {
      await sendJobDigest(eligible.slice(0, 20))
    }

    const { resumeByJobId, applyJobs } = await tailorForJobs(
      eligible,
      Number(process.env.APPLY_LIMIT) || 5
    )

    if (!applyJobs.length) {
      console.log(`\nNo jobs met ${MIN_RESUME_MATCH}% resume match after tailoring.`)
      recordDailyRun({ postingWindow, windowType, tailored: 0 })
      await generateReport()
      return
    }

    if (process.env.AUTO_APPLY === 'true') {
      await applyToJobs(applyJobs, {
        resumeByJobId,
        limit: Number(process.env.APPLY_LIMIT) || 5,
        headless: process.env.HEADLESS !== 'false',
      })
    } else {
      console.log('\nSet AUTO_APPLY=true in .env to submit applications.')
    }

    recordDailyRun({
      postingWindow,
      windowType,
      searched: jobs.length,
      eligible: eligible.length,
      tailored: applyJobs.length,
    })
    await generateReport()
    return
  }

  console.log(`Usage: npm run [search|tailor|apply|report|email|run]

Filters applied:
  • Role + resume match (≥${MIN_JOB_MATCH}% search, ≥${MIN_APPLY_JOB_MATCH}% apply)
  • Resume tailored to ${MIN_RESUME_MATCH}-${Number(process.env.TARGET_RESUME_MATCH_MAX) || 90}% ATS match
  • US only, ≤24h old (prefer ≤5h, fallback 5–24h if none fresh)
  • Skip: no sponsorship, US citizens only, security clearance, LinkedIn Easy Apply`)
}

function printTable(jobs) {
  console.log('\n' + '='.repeat(100))
  for (const j of jobs.slice(0, 15)) {
    const hrs = j.hoursSincePosted != null ? `${j.hoursSincePosted.toFixed(1)}h ago` : '?'
    console.log(`${j.matchScore}% | ${j.title} @ ${j.company} (${hrs})`)
    console.log(`   ${j.location} | ${j.platform}`)
    console.log(`   ${j.applyLink}`)
    console.log(`   Fit: ${j.whyMatch}\n`)
  }
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
