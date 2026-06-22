const US_MARKERS = [
  'united states',
  'usa',
  'u.s.a',
  'u.s.',
  'america',
  'remote, us',
  'remote us',
  'us remote',
  'us only',
  'us-based',
]

const NON_US_MARKERS = [
  'united kingdom',
  ', uk',
  'uk,',
  'canada',
  'india',
  'germany',
  'ireland',
  'singapore',
  'australia',
  'japan',
  'china',
  'mexico',
  'brazil',
  'france',
  'spain',
  'italy',
  'netherlands',
  'poland',
  'israel',
  'korea',
  'taiwan',
  'hong kong',
  'emea',
  'apac',
  'latam',
  'europe',
]

const US_STATE_CODES =
  /\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)\b/

const NO_SPONSORSHIP_PATTERNS = [
  /\bno\s+(?:visa\s+)?sponsorship\b/i,
  /\bnot\s+(?:able|eligible)\s+to\s+(?:provide|offer)\s+sponsorship\b/i,
  /\bunable\s+to\s+sponsor\b/i,
  /\bwill\s+not\s+sponsor\b/i,
  /\bwithout\s+sponsorship\b/i,
  /\bnot\s+sponsor(?:ing|ed)?\b/i,
  /\bno\s+h-?1b\b/i,
  /\bno\s+opt\b/i,
  /\bno\s+cpt\b/i,
  /\bmust\s+be\s+(?:legally\s+)?authorized\s+to\s+work\s+in\s+the\s+united\s+states\s+without\s+sponsorship\b/i,
  /\brequires?\s+(?:current\s+)?(?:us\s+)?(?:work\s+)?authorization\s+without\s+sponsorship\b/i,
  /\bpermanent\s+work\s+authorization\s+required\b/i,
  /\bnot\s+eligible\s+for\s+(?:visa\s+)?sponsorship\b/i,
  /\bsponsorship\s+is\s+not\s+(?:available|provided|offered)\b/i,
]

const US_CITIZEN_ONLY_PATTERNS = [
  /\b(?:must\s+be\s+(?:a\s+)?)?u\.?s\.?\s+citizen(?:ship)?\s+(?:required|only|necessary)\b/i,
  /\b(?:only\s+)?u\.?s\.?\s+citizens?\s+(?:only|required|need\s+apply|eligible)\b/i,
  /\bcitizens?\s+only\b/i,
  /\brequires?\s+u\.?s\.?\s+citizenship\b/i,
  /\bactive\s+u\.?s\.?\s+citizenship\b/i,
  /\beligible\s+only\s+for\s+u\.?s\.?\s+citizens\b/i,
  /\bnot\s+open\s+to\s+(?:non-)?citizens\b/i,
]

const SECURITY_CLEARANCE_PATTERNS = [
  /\bsecurity\s+clearance\s+(?:required|needed|necessary|mandatory)\b/i,
  /\b(?:active|current|existing)\s+(?:security\s+)?clearance\b/i,
  /\b(?:secret|top\s+secret|ts\/sci|ts-sci)\s+clearance\b/i,
  /\bclearance\s*:\s*(?:secret|top\s+secret|ts)\b/i,
  /\bmust\s+(?:have|hold|maintain|possess)\s+(?:an?\s+)?(?:active\s+)?clearance\b/i,
  /\beligible\s+for\s+(?:a\s+)?security\s+clearance\b/i,
  /\bpolygraph\s+(?:required|needed)\b/i,
  /\bpublic\s+trust\s+clearance\b/i,
]

export function isUnitedStatesLocation(location = '') {
  const lower = String(location).toLowerCase().trim()
  if (!lower) return false
  if (NON_US_MARKERS.some((m) => lower.includes(m))) return false
  if (US_MARKERS.some((m) => lower.includes(m))) return true
  if (/\bremote\b.*\bus\b/.test(lower) || /\bus\b.*\bremote\b/.test(lower)) return true
  if (US_STATE_CODES.test(location)) return true
  if (/\bUS\b/.test(location)) return true
  return false
}

export function mentionsNoSponsorship(text = '') {
  return NO_SPONSORSHIP_PATTERNS.some((re) => re.test(String(text)))
}

export function requiresUsCitizenship(text = '') {
  return US_CITIZEN_ONLY_PATTERNS.some((re) => re.test(String(text)))
}

export function requiresSecurityClearance(text = '') {
  return SECURITY_CLEARANCE_PATTERNS.some((re) => re.test(String(text)))
}

export function isLinkedInEasyApply(job = {}) {
  if (job.easyApply === true || job.isEasyApply === true) return true
  if (String(job.applyMethod || '').toLowerCase().includes('easy apply')) return true

  const link = String(job.applyLink || job.url || '')
  const platform = String(job.platform || '').toLowerCase()

  if (/easy[\s-]?apply/i.test(String(job.description || '').slice(0, 500)) && platform.includes('linkedin')) {
    return true
  }

  if (/linkedin\.com\/jobs\/view/i.test(link) && !job.externalApply) {
    return true
  }

  return false
}

export function getHoursSincePosted(postedAt, now = new Date()) {
  if (!postedAt) return null

  const text = String(postedAt).trim().toLowerCase()

  if (text.includes('just posted') || text.includes('posted today') || text === 'today') {
    return 0.5
  }

  const minuteMatch = text.match(/(\d+)\s*minutes?\s*ago/)
  if (minuteMatch) return Number(minuteMatch[1]) / 60

  const hourMatch = text.match(/(\d+)\s*hours?\s*ago/)
  if (hourMatch) return Number(hourMatch[1])

  if (text.includes('hour') || text.includes('minute')) return 1

  const dayMatch = text.match(/(\d+)\s*days?\s*ago/)
  if (dayMatch) return Number(dayMatch[1]) * 24

  if (text.includes('30+') && text.includes('day')) return 30 * 24

  const parsed = new Date(postedAt)
  if (Number.isNaN(parsed.getTime())) return null

  const hours = (now.getTime() - parsed.getTime()) / 3600000
  return hours >= 0 ? hours : null
}

export function applyJobFilters(job, options = {}) {
  const {
    usOnly = true,
    skipNoSponsorship = true,
    skipUsCitizenOnly = true,
    skipSecurityClearance = true,
    skipLinkedInEasyApply = true,
    maxPostedHours = 24,
    now = new Date(),
  } = options

  if (usOnly && !isUnitedStatesLocation(job.location)) {
    return { pass: false, reason: 'not_us_location' }
  }

  const descriptionBlob = [job.title, job.description, job.company].join('\n')

  if (skipNoSponsorship && mentionsNoSponsorship(descriptionBlob)) {
    return { pass: false, reason: 'no_sponsorship' }
  }

  if (skipUsCitizenOnly && requiresUsCitizenship(descriptionBlob)) {
    return { pass: false, reason: 'us_citizens_only' }
  }

  if (skipSecurityClearance && requiresSecurityClearance(descriptionBlob)) {
    return { pass: false, reason: 'security_clearance' }
  }

  if (skipLinkedInEasyApply && isLinkedInEasyApply(job)) {
    return { pass: false, reason: 'linkedin_easy_apply' }
  }

  const hours = getHoursSincePosted(job.postedAt, now)
  if (hours === null) {
    return { pass: false, reason: 'unknown_post_date' }
  }

  if (hours > maxPostedHours) {
    return { pass: false, reason: 'too_old' }
  }

  return { pass: true, reason: 'ok', hoursSincePosted: hours }
}

export function filterJobs(jobs, options = {}) {
  return jobs
    .map((job) => {
      const result = applyJobFilters(job, options)
      return result.pass ? { ...job, hoursSincePosted: result.hoursSincePosted } : null
    })
    .filter(Boolean)
}

/**
 * Prefer jobs posted within 5 hours.
 * If none exist, fall back to jobs posted 5–24 hours ago.
 */
export function selectJobsByPostingWindow(jobs, { freshHours = 5, maxHours = 24 } = {}) {
  const eligible = jobs.filter((j) => {
    const h = j.hoursSincePosted ?? getHoursSincePosted(j.postedAt)
    return h !== null && h <= maxHours
  })

  const fresh = eligible.filter((j) => (j.hoursSincePosted ?? getHoursSincePosted(j.postedAt)) <= freshHours)
  if (fresh.length > 0) {
    return { jobs: fresh, window: 'fresh', label: `≤${freshHours}h` }
  }

  const fallback = eligible.filter((j) => {
    const h = j.hoursSincePosted ?? getHoursSincePosted(j.postedAt)
    return h > freshHours && h <= maxHours
  })

  return { jobs: fallback, window: 'fallback', label: `${freshHours}–${maxHours}h` }
}

export function filterJobsForApply(jobs, options = {}) {
  const freshHours = Number(process.env.POSTED_FRESH_HOURS) || options.freshHours || 5
  const maxHours = Number(process.env.POSTED_MAX_HOURS) || options.maxHours || 24

  const filtered = filterJobs(jobs, {
    ...options,
    maxPostedHours: maxHours,
  })

  return selectJobsByPostingWindow(filtered, { freshHours, maxHours })
}
