import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const QUEUE_PATH = join(__dirname, '../data/apply-queue.json')

function loadQueue() {
  if (!existsSync(QUEUE_PATH)) return { pending: [], applied: [] }
  return JSON.parse(readFileSync(QUEUE_PATH, 'utf8'))
}

function saveQueue(data) {
  writeFileSync(QUEUE_PATH, JSON.stringify(data, null, 2))
}

/**
 * Semi-automated apply assistant:
 * - Queues high-match jobs
 * - Opens apply URLs in default browser (you complete forms with your credentials)
 * - Tracks status locally
 *
 * Full unattended apply to LinkedIn/Indeed requires your logged-in session and
 * often violates platform ToS — use this as an assistant, not a bot.
 */
export function queueForApply(jobs, minScore = 75) {
  const queue = loadQueue()
  const existing = new Set(queue.pending.map((j) => j.applyLink).concat(queue.applied.map((j) => j.applyLink)))

  for (const job of jobs) {
    if (job.matchScore < minScore) continue
    if (existing.has(job.applyLink)) continue
    queue.pending.push({
      ...job,
      queuedAt: new Date().toISOString(),
      status: 'pending',
    })
    existing.add(job.applyLink)
  }

  saveQueue(queue)
  return queue.pending.length
}

export function processApplyQueue({ openBrowser = false, limit = 5 } = {}) {
  const queue = loadQueue()
  const batch = queue.pending.splice(0, limit)

  for (const job of batch) {
    console.log(`\n→ ${job.title} @ ${job.company} (${job.matchScore}%)`)
    console.log(`  ${job.applyLink}`)
    if (openBrowser && process.platform === 'darwin') {
      execSync(`open "${job.applyLink.replace(/"/g, '\\"')}"`)
    }
    job.status = 'opened'
    job.openedAt = new Date().toISOString()
    queue.applied.push(job)
  }

  saveQueue(queue)
  console.log(`\nProcessed ${batch.length} jobs. Complete applications manually, then mark done in data/apply-queue.json`)
  return batch
}
