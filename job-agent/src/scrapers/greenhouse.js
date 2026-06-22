import { load as loadHtml } from 'cheerio'

const GH_API = 'https://boards-api.greenhouse.io/v1/boards'

function stripHtml(html = '') {
  if (!html) return ''
  const $ = loadHtml(html)
  return $.text().replace(/\s+/g, ' ').trim()
}

export async function fetchGreenhouseBoard(slug, companyName = slug) {
  const res = await fetch(`${GH_API}/${slug}/jobs?content=true`)
  if (!res.ok) {
    throw new Error(`Greenhouse board ${slug}: HTTP ${res.status}`)
  }
  const payload = await res.json()
  return (payload.jobs || []).map((item) => ({
    title: item.title || 'Untitled',
    company: companyName,
    location: item.location?.name || '',
    platform: `Greenhouse (${slug})`,
    applyLink: item.absolute_url || '',
    description: stripHtml(item.content || ''),
    postedAt: item.first_published || item.updated_at || null,
    keySkills: [],
    source: 'greenhouse',
    sourceId: String(item.id),
  }))
}

export async function fetchGreenhouseBoards(boards = []) {
  const all = []
  for (const board of boards) {
    try {
      const jobs = await fetchGreenhouseBoard(board.slug, board.name || board.slug)
      all.push(...jobs)
    } catch (err) {
      console.warn(`Greenhouse ${board.slug} skipped:`, err.message)
    }
  }
  return all
}
