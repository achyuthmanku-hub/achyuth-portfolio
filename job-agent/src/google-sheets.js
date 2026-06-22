import { readFileSync, existsSync } from 'fs'
import { google } from 'googleapis'

const APPLICATION_HEADERS = [
  'Date',
  'Time',
  'Company',
  'Job Title',
  'Status',
  'Job Match %',
  'Resume Match %',
  'Platform',
  'Posting Window',
  'Apply URL',
  'Resume Path',
  'Notes',
]

const SUMMARY_HEADERS = [
  'Date',
  'Run Time',
  'Searched',
  'Eligible',
  'Tailored',
  'Submitted',
  'Prepared',
  'Failed',
  'Skipped',
  'Posting Window',
  'Window Type',
]

function isConfigured() {
  return !!(process.env.GOOGLE_SHEETS_ID && getServiceAccountPath())
}

function getServiceAccountPath() {
  return (
    process.env.GOOGLE_SERVICE_ACCOUNT_PATH ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    ''
  )
}

function loadCredentials() {
  const path = getServiceAccountPath()
  if (!path || !existsSync(path)) {
    throw new Error(
      `Google service account JSON not found. Set GOOGLE_SERVICE_ACCOUNT_PATH in .env (see GOOGLE_SHEETS_SETUP.md)`
    )
  }
  return JSON.parse(readFileSync(path, 'utf8'))
}

async function getSheetsClient() {
  const credentials = loadCredentials()
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  return google.sheets({ version: 'v4', auth })
}

async function ensureTab(sheets, spreadsheetId, tabName) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId })
  const exists = meta.data.sheets?.some((s) => s.properties?.title === tabName)
  if (exists) return

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{ addSheet: { properties: { title: tabName } } }],
    },
  })
}

async function ensureHeaders(sheets, spreadsheetId, tabName, headers) {
  const range = `'${tabName}'!A1:1`
  const current = await sheets.spreadsheets.values.get({ spreadsheetId, range })
  const firstRow = current.data.values?.[0]
  if (firstRow?.length) return

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'RAW',
    requestBody: { values: [headers] },
  })
}

function allApplicationRows(report) {
  const buckets = [
    ['submitted', report.submitted],
    ['prepared', report.prepared],
    ['failed', report.failed],
    ['skipped', report.skipped],
  ]

  const rows = []
  for (const [status, entries] of buckets) {
    for (const e of entries) {
      const time = e.time ? new Date(e.time) : new Date(report.generatedAt)
      rows.push([
        report.date,
        time.toLocaleTimeString('en-US', { hour12: false }),
        e.company || '',
        e.title || '',
        status,
        e.matchScore ?? '',
        e.resumeMatchScore ?? '',
        e.platform || '',
        e.postingWindow || '',
        e.applyLink || '',
        e.resumePath || '',
        e.message || '',
      ])
    }
  }
  return rows
}

function summaryRow(report) {
  const run = report.pipelineRuns?.[report.pipelineRuns.length - 1] || {}
  const s = report.summary
  return [
    report.date,
    new Date(report.generatedAt).toLocaleTimeString('en-US', { hour12: false }),
    run.searched ?? '',
    run.eligible ?? '',
    run.tailored ?? '',
    s.submitted,
    s.prepared,
    s.failed,
    s.skipped,
    run.postingWindow ?? '',
    run.windowType ?? '',
  ]
}

export async function syncReportToGoogleSheets(report) {
  if (!isConfigured()) {
    console.log('Google Sheets not configured — skipping (see GOOGLE_SHEETS_SETUP.md)')
    return { synced: false, reason: 'not_configured' }
  }

  const spreadsheetId = process.env.GOOGLE_SHEETS_ID
  const applicationsTab = process.env.GOOGLE_SHEETS_APPLICATIONS_TAB || 'Applications'
  const summaryTab = process.env.GOOGLE_SHEETS_SUMMARY_TAB || 'Daily Summary'

  const sheets = await getSheetsClient()

  await ensureTab(sheets, spreadsheetId, applicationsTab)
  await ensureTab(sheets, spreadsheetId, summaryTab)
  await ensureHeaders(sheets, spreadsheetId, applicationsTab, APPLICATION_HEADERS)
  await ensureHeaders(sheets, spreadsheetId, summaryTab, SUMMARY_HEADERS)

  const appRows = allApplicationRows(report)
  if (appRows.length) {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${applicationsTab}'!A:L`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: appRows },
    })
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${summaryTab}'!A:K`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [summaryRow(report)] },
  })

  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
  console.log(`Google Sheet updated (${appRows.length} application row(s)): ${url}`)
  return { synced: true, url, applicationRows: appRows.length }
}

export async function testGoogleSheetsConnection() {
  if (!isConfigured()) {
    throw new Error('Set GOOGLE_SHEETS_ID and GOOGLE_SERVICE_ACCOUNT_PATH in .env')
  }

  const sheets = await getSheetsClient()
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID
  const meta = await sheets.spreadsheets.get({ spreadsheetId })
  return {
    title: meta.data.properties?.title,
    url: meta.data.spreadsheetUrl,
    sheets: meta.data.sheets?.map((s) => s.properties?.title),
  }
}

export { isConfigured as isGoogleSheetsConfigured }
