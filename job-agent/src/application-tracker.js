import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '../data')
const LOG_PATH = join(DATA_DIR, 'apply-log.json')
const REPORTS_DIR = join(DATA_DIR, 'reports')

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

export function loadTracker() {
  if (!existsSync(LOG_PATH)) {
    return {
      applied: [],
      prepared: [],
      failed: [],
      skipped: [],
      dailyRuns: [],
    }
  }
  return JSON.parse(readFileSync(LOG_PATH, 'utf8'))
}

export function saveTracker(tracker) {
  mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(LOG_PATH, JSON.stringify(tracker, null, 2))
}

export function recordApplication(entry, status) {
  const tracker = loadTracker()
  const bucket =
    status === 'submitted'
      ? 'applied'
      : status === 'prepared'
        ? 'prepared'
        : status === 'skipped'
          ? 'skipped'
          : 'failed'

  tracker[bucket].push({
    ...entry,
    status,
    recordedAt: new Date().toISOString(),
  })

  saveTracker(tracker)
  return entry
}

export function recordDailyRun(summary) {
  const tracker = loadTracker()
  tracker.dailyRuns = tracker.dailyRuns || []
  tracker.dailyRuns.push({
    ...summary,
    date: todayKey(),
    ranAt: new Date().toISOString(),
  })
  saveTracker(tracker)
}

export function alreadyApplied(applyLink) {
  const tracker = loadTracker()
  const all = [...tracker.applied, ...tracker.prepared, ...tracker.failed, ...tracker.skipped]
  return all.some((e) => e.applyLink === applyLink)
}

export function buildDailyReport(date = todayKey()) {
  const tracker = loadTracker()
  const dayStart = `${date}T00:00:00.000Z`
  const dayEnd = `${date}T23:59:59.999Z`

  const inDay = (entry) => {
    const t = entry.recordedAt || entry.at || entry.ranAt
    return t && t >= dayStart && t <= dayEnd
  }

  const applied = tracker.applied.filter(inDay)
  const prepared = tracker.prepared.filter(inDay)
  const failed = tracker.failed.filter(inDay)
  const skipped = tracker.skipped.filter(inDay)
  const runs = (tracker.dailyRuns || []).filter((r) => r.date === date)

  const report = {
    date,
    generatedAt: new Date().toISOString(),
    summary: {
      submitted: applied.length,
      prepared: prepared.length,
      failed: failed.length,
      skipped: skipped.length,
      pipelineRuns: runs.length,
    },
    submitted: applied.map(formatEntry),
    prepared: prepared.map(formatEntry),
    failed: failed.map(formatEntry),
    skipped: skipped.map(formatEntry),
    pipelineRuns: runs,
  }

  return report
}

function formatEntry(e) {
  return {
    title: e.title,
    company: e.company,
    matchScore: e.matchScore,
    resumeMatchScore: e.resumeMatchScore,
    postingWindow: e.postingWindow,
    platform: e.platform,
    applyLink: e.applyLink,
    resumePath: e.resumePath,
    status: e.status,
    message: e.message || e.reason,
    time: e.recordedAt || e.at,
  }
}

export function saveDailyReport(report) {
  mkdirSync(REPORTS_DIR, { recursive: true })
  const jsonPath = join(REPORTS_DIR, `report-${report.date}.json`)
  const mdPath = join(REPORTS_DIR, `report-${report.date}.md`)

  writeFileSync(jsonPath, JSON.stringify(report, null, 2))
  writeFileSync(mdPath, renderMarkdownReport(report))

  return { jsonPath, mdPath }
}

function renderMarkdownReport(report) {
  const s = report.summary
  let md = `# Job Application Report — ${report.date}\n\n`
  md += `Generated: ${report.generatedAt}\n\n`
  md += `## Summary\n\n`
  md += `| Metric | Count |\n|--------|-------|\n`
  md += `| Submitted | ${s.submitted} |\n`
  md += `| Prepared (form filled) | ${s.prepared} |\n`
  md += `| Failed | ${s.failed} |\n`
  md += `| Skipped | ${s.skipped} |\n`
  md += `| Pipeline runs | ${s.pipelineRuns} |\n\n`

  if (report.submitted.length) {
    md += `## Submitted Applications\n\n`
    for (const e of report.submitted) {
      md += `- **${e.title}** @ ${e.company} (${e.matchScore}% job / ${e.resumeMatchScore || '—'}% resume)\n`
      md += `  - ${e.applyLink}\n`
    }
    md += `\n`
  }

  if (report.prepared.length) {
    md += `## Prepared (Review Before Submit)\n\n`
    for (const e of report.prepared) {
      md += `- ${e.title} @ ${e.company}\n`
    }
    md += `\n`
  }

  if (report.skipped.length) {
    md += `## Skipped\n\n`
    for (const e of report.skipped) {
      md += `- ${e.title} @ ${e.company} — ${e.message}\n`
    }
    md += `\n`
  }

  if (report.failed.length) {
    md += `## Failed\n\n`
    for (const e of report.failed) {
      md += `- ${e.title} @ ${e.company} — ${e.message}\n`
    }
  }

  return md
}

export function getApplyLog() {
  return loadTracker()
}
