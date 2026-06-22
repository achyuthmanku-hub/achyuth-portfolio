import {
  getApplicant,
  fillGreenhouseForm,
  fillLeverForm,
  fillAshbyForm,
  fillCommonScreening,
  uploadResume,
} from './portal-forms.js'
import {
  applyJobFilters,
  isLinkedInEasyApply,
} from './filters.js'
import {
  recordApplication,
  alreadyApplied,
} from './application-tracker.js'
import { TARGET_MIN } from './resume-tailor.js'

function isLeverUrl(url = '') {
  return /jobs\.lever\.co/i.test(url) || /lever\.co\/.*\/apply/i.test(url)
}

function isGreenhouseUrl(url = '') {
  return /greenhouse\.io/i.test(url)
}

function isAshbyUrl(url = '') {
  return /jobs\.ashbyhq\.com/i.test(url)
}

function detectPlatform(url = '') {
  if (isLeverUrl(url)) return 'Lever'
  if (isAshbyUrl(url)) return 'Ashby'
  if (isGreenhouseUrl(url)) return 'Greenhouse'
  return 'Unknown'
}

async function finishApply(page, platform) {
  if (process.env.AUTO_SUBMIT === 'true') {
    const submit = page
      .locator(
        '#submit_app, button[type="submit"]:has-text("Submit"), button:has-text("Submit application"), input[type="submit"]'
      )
      .first()
    if (await submit.count()) {
      await submit.click()
      await page.waitForTimeout(3000)
      return { status: 'submitted', message: `Application submitted on ${platform}` }
    }
    return {
      status: 'prepared',
      message: `Form filled on ${platform}; submit button not found — review manually`,
    }
  }

  return {
    status: 'prepared',
    message: `Form prefilled on ${platform} — set AUTO_SUBMIT=true to submit`,
  }
}

async function applyGreenhouse(page, job, resumePath, applicant) {
  await page.goto(job.applyLink, { waitUntil: 'domcontentloaded', timeout: 60000 })

  const applyButton = page
    .locator('#apply_button, a:has-text("Apply"), button:has-text("Apply")')
    .first()
  if (await applyButton.count()) {
    await applyButton.click({ timeout: 10000 }).catch(() => {})
    await page.waitForTimeout(1500)
  }

  await fillGreenhouseForm(page, applicant)
  await fillCommonScreening(page, applicant)
  if (resumePath) await uploadResume(page, resumePath)

  return finishApply(page, 'Greenhouse')
}

async function applyLever(page, job, resumePath, applicant) {
  await page.goto(job.applyLink, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await fillLeverForm(page, applicant)
  await fillCommonScreening(page, applicant)
  if (resumePath) await uploadResume(page, resumePath)
  return finishApply(page, 'Lever')
}

async function applyAshby(page, job, resumePath, applicant) {
  await page.goto(job.applyLink, { waitUntil: 'domcontentloaded', timeout: 60000 })

  const applyBtn = page.locator('button:has-text("Apply"), a:has-text("Apply")').first()
  if (await applyBtn.count()) {
    await applyBtn.click().catch(() => {})
    await page.waitForTimeout(1500)
  }

  await fillAshbyForm(page, applicant)
  await fillCommonScreening(page, applicant)
  if (resumePath) await uploadResume(page, resumePath)
  return finishApply(page, 'Ashby')
}

export async function applyToJob(job, { resumePath, headless = false } = {}) {
  if (alreadyApplied(job.applyLink)) {
    return { status: 'skipped', message: 'Already processed this URL' }
  }

  const filterResult = applyJobFilters(job)
  if (!filterResult.pass) {
    recordApplication({ ...job, reason: filterResult.reason }, 'skipped')
    return { status: 'skipped', message: `Filtered: ${filterResult.reason}` }
  }

  if (isLinkedInEasyApply(job)) {
    recordApplication({ ...job, reason: 'linkedin_easy_apply' }, 'skipped')
    return { status: 'skipped', message: 'LinkedIn Easy Apply skipped' }
  }

  const minResumeMatch = Number(process.env.MIN_RESUME_MATCH) || TARGET_MIN
  if (job.resumeMatchScore && job.resumeMatchScore < minResumeMatch) {
    recordApplication(
      { ...job, reason: `resume_match_${job.resumeMatchScore}_below_${minResumeMatch}` },
      'skipped'
    )
    return {
      status: 'skipped',
      message: `Resume match ${job.resumeMatchScore}% below ${minResumeMatch}% target`,
    }
  }

  const supported =
    isGreenhouseUrl(job.applyLink) || isLeverUrl(job.applyLink) || isAshbyUrl(job.applyLink)

  if (!supported) {
    recordApplication({ ...job, reason: 'unsupported_platform' }, 'skipped')
    return {
      status: 'skipped',
      message: 'Auto-apply supports Greenhouse, Lever, Ashby only (Workday = manual queue)',
    }
  }

  const { chromium } = await import('playwright')
  const applicant = getApplicant()
  const platform = detectPlatform(job.applyLink)

  const browser = await chromium.launch({ headless, slowMo: headless ? 0 : 80 })
  const page = await browser.newPage()

  try {
    let result
    if (isLeverUrl(job.applyLink)) {
      result = await applyLever(page, job, resumePath, applicant)
    } else if (isAshbyUrl(job.applyLink)) {
      result = await applyAshby(page, job, resumePath, applicant)
    } else {
      result = await applyGreenhouse(page, job, resumePath, applicant)
    }

    recordApplication(
      { ...job, ...result, resumePath, platform },
      result.status === 'submitted' ? 'submitted' : result.status
    )
    return result
  } catch (err) {
    recordApplication({ ...job, error: err.message, resumePath, platform }, 'failed')
    return { status: 'failed', message: err.message }
  } finally {
    await browser.close()
  }
}

export async function applyToJobs(jobs, { resumeByJobId = {}, limit = 3, headless = false } = {}) {
  const results = []
  let count = 0

  for (const job of jobs) {
    if (count >= limit) break

    const resumePath = resumeByJobId[job.applyLink] || resumeByJobId[job.id] || null
    console.log(
      `\nApplying: ${job.title} @ ${job.company} (job ${job.matchScore}% / resume ${job.resumeMatchScore || '?'}%)`
    )
    const result = await applyToJob(job, { resumePath, headless })
    console.log(`  → ${result.status}: ${result.message}`)
    results.push({ job, result })
    if (result.status !== 'skipped') count += 1
  }

  return results
}

export { getApplyLog } from './application-tracker.js'
