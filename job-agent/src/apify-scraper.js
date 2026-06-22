import 'dotenv/config'

const APIFY = 'https://api.apify.com/v2'

const ACTORS = {
  linkedin: 'bebity~linkedin-jobs-scraper',
  indeed: 'santamaria-automations/indeed-scraper',
}

function authHeaders() {
  const token = process.env.APIFY_TOKEN
  if (!token) throw new Error('APIFY_TOKEN is not set. Copy job-agent/.env.example to job-agent/.env')
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

async function runActor(actorId, input) {
  const res = await fetch(`${APIFY}/acts/${actorId}/runs`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Apify run failed (${actorId}): ${res.status} ${err}`)
  }
  const { data } = await res.json()
  return waitForRun(data.id)
}

async function waitForRun(runId, maxWaitMs = 180000) {
  const start = Date.now()
  while (Date.now() - start < maxWaitMs) {
    const res = await fetch(`${APIFY}/actor-runs/${runId}`, { headers: authHeaders() })
    const { data } = await res.json()
    if (data.status === 'SUCCEEDED') return fetchDataset(data.defaultDatasetId)
    if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(data.status)) {
      throw new Error(`Apify run ${runId} ended with status ${data.status}`)
    }
    await sleep(5000)
  }
  throw new Error(`Apify run ${runId} timed out`)
}

async function fetchDataset(datasetId) {
  const res = await fetch(`${APIFY}/datasets/${datasetId}/items`, { headers: authHeaders() })
  return res.json()
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function linkedInSearchUrl(query, location) {
  const postedWindow = process.env.LINKEDIN_POSTED_WINDOW || 'r86400' // past 24 hours
  const params = new URLSearchParams({
    keywords: query,
    location,
    f_TPR: postedWindow,
  })
  return `https://www.linkedin.com/jobs/search/?${params}`
}

function mapLinkedInItem(item, platform = 'LinkedIn') {
  const easyApply =
    item.easyApply === true ||
    item.isEasyApply === true ||
    String(item.applyMethod || '').toLowerCase().includes('easy apply')

  return {
    title: item.title || item.jobTitle || '',
    company: item.companyName || item.company || '',
    location: item.location || item.jobLocation || 'United States',
    platform,
    applyLink: item.link || item.url || item.jobUrl || '',
    description: item.description || item.jobDescription || '',
    postedAt: item.postedAt || item.listedAt || item.datePosted || null,
    keySkills: [],
    easyApply,
    externalApply: !!item.externalApplyUrl,
  }
}

function mapIndeedItem(item) {
  return {
    title: item.title || item.jobTitle || '',
    company: item.company || item.companyName || '',
    location: item.location || item.formattedLocation || 'United States',
    platform: 'Indeed',
    applyLink: item.url || item.link || item.jobUrl || '',
    description: item.description || item.snippet || '',
    postedAt: item.datePosted || item.pubDate || null,
    keySkills: item.skills || [],
  }
}

export async function scrapeLinkedIn(query, location = 'United States') {
  const url = linkedInSearchUrl(query, location)
  const items = await runActor(ACTORS.linkedin, {
    urls: [{ url }],
    count: Number(process.env.MAX_JOBS_PER_PLATFORM) || 15,
    scrapeCompany: false,
  })
  return items.map((i) => mapLinkedInItem(i))
}

export async function scrapeIndeed(query, location = 'United States') {
  const items = await runActor(ACTORS.indeed, {
    query,
    location,
    maxItems: Number(process.env.MAX_JOBS_PER_PLATFORM) || 15,
    fromDays: Number(process.env.DATE_POSTED_DAYS) || 1,
  })
  return items.map(mapIndeedItem)
}

/** Dice/Monster: use LinkedIn-style search URLs via public aggregators when dedicated actors need separate setup */
export async function scrapeAllPlatforms(queries) {
  const all = []
  for (const query of queries) {
    try {
      const li = await scrapeLinkedIn(query)
      all.push(...li)
    } catch (e) {
      console.warn(`LinkedIn scrape skipped for "${query}":`, e.message)
    }
    try {
      const indeed = await scrapeIndeed(query)
      all.push(...indeed)
    } catch (e) {
      console.warn(`Indeed scrape skipped for "${query}":`, e.message)
    }
  }
  return all.filter((j) => j.applyLink && j.title && !j.easyApply)
}
