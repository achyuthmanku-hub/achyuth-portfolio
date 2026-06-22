import 'dotenv/config'
import nodemailer from 'nodemailer'
import { profile } from './job-matcher.js'

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildHtmlTable(jobs) {
  const rows = jobs
    .map(
      (j) => `
    <tr>
      <td>${escapeHtml(j.title)}</td>
      <td>${escapeHtml(j.company)}</td>
      <td>${escapeHtml(j.location)}</td>
      <td>${escapeHtml(j.platform)}</td>
      <td><a href="${escapeHtml(j.applyLink)}">Apply</a></td>
      <td><strong>${j.matchScore}%</strong></td>
      <td>${escapeHtml((j.keySkills || []).slice(0, 6).join(', '))}</td>
      <td>${escapeHtml(j.whyMatch || '')}</td>
    </tr>`
    )
    .join('')

  return `
    <h2>Job matches for ${escapeHtml(profile.name)}</h2>
    <p>${jobs.length} roles (US, entry–mid level, ≥${process.env.MIN_MATCH_SCORE || 60}% match)</p>
    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif;font-size:13px">
      <thead>
        <tr style="background:#0f172a;color:#fff">
          <th>Job Title</th><th>Company</th><th>Location</th><th>Platform</th>
          <th>Apply</th><th>Match</th><th>Key Skills</th><th>Why it fits</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `
}

export async function sendJobDigest(jobs) {
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const to = process.env.RECIPIENT_EMAIL || profile.email

  if (!user || !pass) {
    throw new Error('SMTP_USER and SMTP_PASS required in .env (use Gmail App Password)')
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user, pass },
  })

  const date = new Date().toISOString().slice(0, 10)
  await transporter.sendMail({
    from: `"Job Agent" <${user}>`,
    to,
    subject: `[Job Agent] ${jobs.length} matched roles — ${date}`,
    html: buildHtmlTable(jobs),
    text: jobs
      .map(
        (j) =>
          `${j.title} @ ${j.company} (${j.matchScore}%)\n${j.applyLink}\n${j.whyMatch}\n`
      )
      .join('\n---\n'),
  })

  console.log(`Email sent to ${to} with ${jobs.length} jobs`)
}

export async function sendDailyReportEmail(report, mdPath) {
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!user || !pass) return false

  const to = process.env.RECIPIENT_EMAIL || profile.email
  const { readFileSync } = await import('fs')

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user, pass },
  })

  const s = report.summary
  await transporter.sendMail({
    from: `"Job Agent" <${user}>`,
    to,
    subject: `[Job Agent Report] ${report.date} — ${s.submitted} submitted, ${s.prepared} prepared`,
    text: readFileSync(mdPath, 'utf8'),
  })

  console.log(`Report emailed to ${to}`)
  return true
}
