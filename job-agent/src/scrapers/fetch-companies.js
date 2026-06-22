import { fetchGreenhouseBoard } from './greenhouse.js'
import { fetchWorkdayBoard } from './workday.js'
import { fetchLeverBoard } from './lever.js'
import { fetchAshbyBoard } from './ashby.js'

const FETCHERS = {
  greenhouse: (source, name) => fetchGreenhouseBoard(source.slug, name),
  workday: (source, name) => fetchWorkdayBoard(source, name),
  lever: (source, name) => fetchLeverBoard(source, name),
  ashby: (source, name) => fetchAshbyBoard(source, name),
}

export async function fetchAllCompanyJobs(companies, { concurrency = 5 } = {}) {
  const all = []
  const tasks = []

  for (const company of companies) {
    for (const source of company.sources || []) {
      tasks.push(async () => {
        const fetcher = FETCHERS[source.type]
        if (!fetcher) {
          console.warn(`Unknown source type ${source.type} for ${company.name}`)
          return []
        }
        try {
          const jobs = await fetcher(source, company.name)
          console.log(`  ${company.name} (${source.type}): ${jobs.length} jobs`)
          return jobs
        } catch (err) {
          console.warn(`  ${company.name} (${source.type}) skipped: ${err.message}`)
          return []
        }
      })
    }
  }

  for (let i = 0; i < tasks.length; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency)
    const results = await Promise.all(batch.map((fn) => fn()))
    for (const jobs of results) all.push(...jobs)
  }

  return all
}
