import profile from '../resume-profile.json' with { type: 'json' }

const SKILL_ALIASES = {
  'springboot': 'spring boot',
  'spring-boot': 'spring boot',
  'k8s': 'kubernetes',
  'eks': 'kubernetes',
  'genai': 'generative ai',
  'gen ai': 'generative ai',
  'llm': 'openai',
  'restful': 'rest',
  'rest api': 'rest',
  'react.js': 'react',
  'node': 'node.js',
  'postgres': 'postgresql',
  'nosql': 'mongodb',
}

function normalize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^\w\s+#.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function skillInText(norm, skill) {
  if (skill.length <= 3) {
    const re = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
    return re.test(norm)
  }
  return norm.includes(skill)
}

function extractSkillsFromText(text) {
  const norm = normalize(text)
  const found = new Set()
  for (const skill of profile.technicalSkills) {
    if (skillInText(norm, skill)) found.add(skill)
  }
  for (const [alias, canonical] of Object.entries(SKILL_ALIASES)) {
    if (skillInText(norm, alias)) found.add(canonical)
  }
  return found
}

function matchesTargetRole(title = '') {
  const norm = normalize(title)

  if (/\bmarketing engineer\b/i.test(title)) {
    return false
  }

  if (profile.targetRoles.some((role) => norm.includes(normalize(role)))) {
    return true
  }

  const excluded =
    /\b(marketing|sales|customer success|compliance|designer|recruiter|coordinator|specialist|advocate|operations|content|program manager|product manager|account manager|customer marketing)\b/i
  const technical =
    /\b(software|full[\s-]?stack|backend|frontend|gen[\s-]?ai|ai|java|platform|infrastructure|devops|sre|cloud|web|mobile|machine learning|ml|data|security)\b/i

  if (excluded.test(title) && !technical.test(title)) {
    return false
  }

  return /\b(software|full[\s-]?stack|backend|frontend|gen[\s-]?ai|ai|java|platform|infrastructure|devops|sre|cloud|web|mobile|machine learning|ml|data|security)?\s*(engineer|developer)\b/i.test(
    title
  )
}

export function computeResumeJobMatch(resumeText, job) {
  const blob = normalize(
    [job.title, job.company, job.location, job.description, ...(job.keySkills || [])].join(' ')
  )
  const resumeNorm = normalize(resumeText)
  const jobSkills = extractSkillsFromText(blob)
  const resumeSkills = extractSkillsFromText(resumeNorm)

  const matched = [...jobSkills].filter((s) => resumeSkills.has(s) || resumeNorm.includes(s))
  const skillPct = jobSkills.size === 0 ? 55 : Math.round((matched.length / jobSkills.size) * 100)

  let keywordBonus = 0
  const jdWords = blob.split(' ').filter((w) => w.length > 4)
  const resumeWordSet = new Set(resumeNorm.split(' '))
  const overlap = jdWords.filter((w) => resumeWordSet.has(w)).length
  if (jdWords.length) keywordBonus = Math.min(15, Math.round((overlap / jdWords.length) * 15))

  let roleBonus = matchesTargetRole(job.title) ? 10 : 0

  return Math.min(98, Math.max(0, Math.round(skillPct * 0.75 + keywordBonus + roleBonus)))
}

export function scoreJob(job) {
  const blob = normalize(
    [job.title, job.company, job.location, job.description, ...(job.keySkills || [])].join(' ')
  )

  if (!matchesTargetRole(job.title)) {
    return {
      matchScore: 0,
      matchedSkills: [],
      jobSkills: [],
      whyMatch: 'Title does not match target roles',
    }
  }

  const resumeSkills = new Set(profile.technicalSkills)
  const jobSkills = extractSkillsFromText(blob)
  const matched = [...jobSkills].filter((s) => resumeSkills.has(s))
  const skillMatchPct =
    jobSkills.size === 0 ? 50 : Math.round((matched.length / jobSkills.size) * 100)

  let roleBonus = 0
  for (const role of profile.targetRoles) {
    if (blob.includes(normalize(role))) {
      roleBonus = 15
      break
    }
  }

  let domainBonus = 0
  if (/fintech|bank|financial|payment|capital|insurance/i.test(blob)) domainBonus = 10
  if (/generative|langchain|rag|llm|openai|agentic/i.test(blob)) domainBonus += 8

  let levelPenalty = 0
  if (/10\+?\s*years|15\+?\s*years|principal|staff\s+engineer/i.test(blob)) levelPenalty = 12
  if (/entry[\s-]level|new grad|0-1\s*years/i.test(blob) && profile.yearsExperience >= 3) {
    levelPenalty = 5
  }

  const matchScore = Math.min(
    98,
    Math.max(40, Math.round(skillMatchPct * 0.65 + roleBonus + domainBonus - levelPenalty))
  )

  return {
    matchScore,
    matchedSkills: matched,
    jobSkills: [...jobSkills],
    whyMatch: buildWhyMatch(matched, blob, roleBonus, domainBonus),
  }
}

function buildWhyMatch(matched, blob, roleBonus, domainBonus) {
  const parts = []
  if (matched.length) {
    parts.push(`Strong overlap on ${matched.slice(0, 5).join(', ')}`)
  }
  if (domainBonus >= 10) parts.push('aligns with your fintech/banking background')
  if (/rag|langchain|generative|agentic/i.test(blob)) {
    parts.push('matches your GenAI/RAG production experience at Citi')
  }
  if (roleBonus) parts.push('title fits your target role profile')
  return parts.slice(0, 2).join('; ') || 'General software engineering fit with your Java/cloud stack'
}

export function dedupeJobs(jobs) {
  const seen = new Map()
  for (const job of jobs) {
    const key = normalize(`${job.title}|${job.company}`).slice(0, 80)
    const existing = seen.get(key)
    if (!existing || job.matchScore > existing.matchScore) {
      seen.set(key, job)
    }
  }
  return [...seen.values()]
}

export function filterByMatchScore(jobs, { minScore = 60, maxAgeDays = 1 } = {}) {
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000
  return jobs.filter((j) => {
    if (j.matchScore < minScore || j.matchScore === 0) return false
    if (j.postedAt) {
      const t = new Date(j.postedAt).getTime()
      if (!Number.isNaN(t) && t < cutoff) return false
    }
    return true
  })
}

export { profile }
