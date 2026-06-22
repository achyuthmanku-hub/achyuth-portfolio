import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'
import profile from '../resume-profile.json' with { type: 'json' }
import { computeResumeJobMatch } from './job-matcher.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const RESUME_DIR = join(__dirname, '../resume')
const TAILORED_DIR = join(__dirname, '../data/tailored-resumes')

const TARGET_MIN = Number(process.env.TARGET_RESUME_MATCH_MIN) || 85
const TARGET_MAX = Number(process.env.TARGET_RESUME_MATCH_MAX) || 90

export function loadBaseResume() {
  const candidates = [
    process.env.BASE_RESUME_PATH,
    join(RESUME_DIR, 'base-resume.md'),
    join(RESUME_DIR, 'base-resume.txt'),
  ].filter(Boolean)

  for (const path of candidates) {
    if (existsSync(path) && !path.endsWith('.pdf')) {
      return readFileSync(path, 'utf8').trim()
    }
  }

  throw new Error('Base resume not found. Add resume/base-resume.md')
}

function buildTailorPrompt(baseResume, job, { targetScore = 88, pass = 1 } = {}) {
  return `ORIGINAL RESUME:
${baseResume}

---
JOB TITLE: ${job.title}
COMPANY: ${job.company}
LOCATION: ${job.location}
DESCRIPTION:
${(job.description || '').slice(0, 9000)}

TASK (pass ${pass}): Rewrite this resume so it scores ${targetScore}%+ ATS match against the job description.

ATS RULES — follow exactly:
- Plain text only. No markdown (#, *, tables, columns, icons).
- Sections: PROFESSIONAL SUMMARY, SKILLS, EXPERIENCE, PROJECTS, EDUCATION, CERTIFICATIONS.
- Mirror exact keywords and phrases from the job description where truthfully applicable.
- Lead bullets with strong action verbs matching the JD (built, designed, shipped, optimized).
- Put the most relevant skills and experience first.
- Keep all facts truthful — do NOT invent employers, titles, degrees, or years.
- Single-column layout friendly. Standard fonts implied. No graphics.
- Target ${TARGET_MIN}-${TARGET_MAX}% keyword alignment with the job description.
- Keep similar length to the original (~1 page).

Output ONLY the rewritten resume text.`
}

async function callOpenAI(user) {
  const key = process.env.OPENAI_API_KEY
  if (!key) return null

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.15,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert ATS resume optimizer. Never fabricate experience. Output only plain-text resume content with standard section headers.',
        },
        { role: 'user', content: user },
      ],
    }),
  })

  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() || null
}

async function callGemini(user) {
  const key = process.env.GEMINI_API_KEY
  if (!key) return null

  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: user }] }],
      systemInstruction: {
        parts: [
          {
            text: 'You are an expert ATS resume optimizer. Never fabricate experience. Output only plain-text resume.',
          },
        ],
      },
    }),
  })

  if (!res.ok) throw new Error(`Gemini error: ${res.status}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null
}

function keywordTailor(baseResume, job) {
  const desc = (job.description || '').toLowerCase()
  const missing = profile.technicalSkills.filter(
    (skill) => desc.includes(skill) && !baseResume.toLowerCase().includes(skill)
  )

  if (!missing.length) return baseResume

  const skillsBlock = missing.slice(0, 15).join(', ')
  return `${baseResume}\n\nSKILLS (JD-aligned): ${skillsBlock}`
}

async function llmTailor(baseResume, job, pass) {
  const prompt = buildTailorPrompt(baseResume, job, { targetScore: TARGET_MAX, pass })
  return (await callOpenAI(prompt)) || (await callGemini(prompt))
}

export async function tailorResumeForJob(job, { minJobScore = 60, jobMatchScore = 0 } = {}) {
  const baseResume = loadBaseResume()

  if (jobMatchScore < minJobScore) {
    return {
      text: baseResume,
      tailored: false,
      resumeMatchScore: computeResumeJobMatch(baseResume, job),
      reason: 'below_min_job_score',
    }
  }

  let text = baseResume
  let resumeMatchScore = computeResumeJobMatch(text, job)
  let pass = 0
  const maxPasses = Number(process.env.TAILOR_MAX_PASSES) || 3

  if (resumeMatchScore >= TARGET_MIN) {
    return {
      text,
      tailored: false,
      resumeMatchScore,
      reason: 'already_meets_target',
    }
  }

  const hasLlm = !!(process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY)

  if (hasLlm) {
    while (resumeMatchScore < TARGET_MIN && pass < maxPasses) {
      pass += 1
      try {
        const rewritten = await llmTailor(text, job, pass)
        if (rewritten) {
          text = rewritten
          resumeMatchScore = computeResumeJobMatch(text, job)
        }
      } catch (err) {
        console.warn(`Tailor pass ${pass} failed:`, err.message)
        break
      }
    }
  } else {
    text = keywordTailor(baseResume, job)
    resumeMatchScore = computeResumeJobMatch(text, job)
  }

  if (resumeMatchScore < TARGET_MIN) {
    text = keywordTailor(text, job)
    resumeMatchScore = computeResumeJobMatch(text, job)
  }

  return {
    text,
    tailored: text !== baseResume,
    resumeMatchScore,
    reason:
      resumeMatchScore >= TARGET_MIN
        ? 'ats_tailored_target_met'
        : resumeMatchScore >= TARGET_MIN - 5
          ? 'ats_tailored_near_target'
          : hasLlm
            ? 'below_target_after_tailor'
            : 'keyword_fallback_no_llm_key',
  }
}

function resumeLinesToDocxParagraphs(text) {
  return text.split('\n').map((line) => {
    const trimmed = line.trim()
    if (!trimmed) return new Paragraph({ text: '' })

    const isHeading =
      /^(professional summary|summary|skills|experience|projects|education|certifications)$/i.test(
        trimmed
      ) ||
      (/^[A-Z][A-Za-z /&-]+$/.test(trimmed) && trimmed.length < 45 && !trimmed.includes(','))

    if (isHeading) {
      return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: trimmed, bold: true })],
      })
    }

    return new Paragraph({ children: [new TextRun({ text: trimmed })] })
  })
}

export async function saveTailoredResumeDocx(job, resumeText) {
  mkdirSync(TAILORED_DIR, { recursive: true })

  const safeCompany = job.company.replace(/[^\w-]+/g, '_').slice(0, 40)
  const safeTitle = job.title.replace(/[^\w-]+/g, '_').slice(0, 40)
  const date = new Date().toISOString().slice(0, 10)
  const baseName = `${safeCompany}_${safeTitle}_${date}`

  const txtPath = join(TAILORED_DIR, `${baseName}.txt`)
  writeFileSync(txtPath, resumeText)

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: profile.name, bold: true, size: 28 })],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `${profile.email} | ${profile.phone || ''}`,
                size: 22,
              }),
            ],
          }),
          ...resumeLinesToDocxParagraphs(resumeText),
        ],
      },
    ],
  })

  const docxPath = join(TAILORED_DIR, `${baseName}.docx`)
  writeFileSync(docxPath, await Packer.toBuffer(doc))

  return { txtPath, docxPath }
}

export { TARGET_MIN, TARGET_MAX }
