import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import applicant from '../applicant-profile.json' with { type: 'json' }

const __dirname = dirname(fileURLToPath(import.meta.url))

export function getApplicant() {
  const env = {
    firstName: process.env.APPLICANT_FIRST_NAME,
    lastName: process.env.APPLICANT_LAST_NAME,
    email: process.env.APPLICANT_EMAIL,
    phone: process.env.APPLICANT_PHONE,
    linkedin: process.env.APPLICANT_LINKEDIN,
    website: process.env.APPLICANT_WEBSITE,
    github: process.env.APPLICANT_GITHUB,
  }

  return {
    firstName: env.firstName || applicant.personal.firstName,
    lastName: env.lastName || applicant.personal.lastName,
    fullName: applicant.personal.fullName,
    email: env.email || applicant.personal.email,
    phone: env.phone || applicant.personal.phone,
    linkedin: env.linkedin || applicant.personal.linkedin,
    website: env.website || applicant.personal.website,
    github: env.github || applicant.personal.github,
    city: applicant.personal.city,
    country: applicant.personal.country,
    workAuthorization: applicant.workAuthorization,
    education: applicant.education,
    experience: applicant.experience,
    greenhouse: applicant.greenhouse,
    lever: applicant.lever,
    ashby: applicant.ashby,
    common: applicant.commonScreening,
  }
}

async function fillField(page, selectors, value) {
  if (!value) return false
  for (const selector of selectors) {
    const el = page.locator(selector).first()
    if (await el.count()) {
      await el.fill(String(value))
      return true
    }
  }
  return false
}

async function selectOption(page, selectors, value) {
  if (!value) return false
  for (const selector of selectors) {
    const el = page.locator(selector).first()
    if (await el.count()) {
      await el.selectOption({ label: value }).catch(async () => {
        await el.selectOption(value).catch(() => {})
      })
      return true
    }
  }
  return false
}

async function clickRadio(page, patterns) {
  for (const pattern of patterns) {
    const el = page.locator(`label:has-text("${pattern}")`).first()
    if (await el.count()) {
      await el.click()
      return true
    }
  }
  return false
}

export async function fillGreenhouseForm(page, applicant) {
  await fillField(page, ['#first_name', 'input[name="job_application[first_name]"]'], applicant.firstName)
  await fillField(page, ['#last_name', 'input[name="job_application[last_name]"]'], applicant.lastName)
  await fillField(page, ['#email', 'input[name="job_application[email]"]'], applicant.email)
  await fillField(page, ['#phone', 'input[name="job_application[phone]"]'], applicant.phone)
  await fillField(page, ['input[name*="linkedin" i]', 'input[id*="linkedin" i]'], applicant.linkedin)
  await fillField(page, ['input[name*="website" i]', 'input[name*="portfolio" i]'], applicant.website)

  await clickRadio(page, [
    applicant.greenhouse.sponsorship_answer,
    'Yes, I require sponsorship',
    'I require sponsorship',
  ])

  await selectOption(
    page,
    ['select[name*="sponsor" i]', 'select[id*="sponsor" i]'],
    applicant.greenhouse.sponsorship_answer
  )

  await selectOption(
    page,
    ['select[name*="authorized" i]', 'select[name*="legally" i]'],
    applicant.greenhouse.authorized_us_answer
  )

  await clickRadio(page, [applicant.greenhouse.authorized_us_answer, 'Yes'])
}

export async function fillLeverForm(page, applicant) {
  await fillField(page, ['input[name="name"]'], applicant.fullName)
  await fillField(page, ['input[name="email"]', 'input[type="email"]'], applicant.email)
  await fillField(page, ['input[name="phone"]'], applicant.phone)
  await fillField(page, ['input[name="org"]'], applicant.lever.org)
  await fillField(page, ['input[name="urls[LinkedIn]"]', 'input[name*="linkedin" i]'], applicant.linkedin)
  await fillField(page, ['input[name="urls[GitHub]"]', 'input[name*="github" i]'], applicant.github)
  await fillField(page, ['textarea[name="comments"]'], applicant.lever.comments)
}

export async function fillAshbyForm(page, applicant) {
  await fillField(page, ['input[name="firstName"]', 'input[placeholder*="First" i]'], applicant.firstName)
  await fillField(page, ['input[name="lastName"]', 'input[placeholder*="Last" i]'], applicant.lastName)
  await fillField(page, ['input[name="email"]', 'input[type="email"]'], applicant.email)
  await fillField(page, ['input[name="phone"]', 'input[type="tel"]'], applicant.phone)
  await fillField(page, ['input[name*="linkedin" i]'], applicant.linkedin)

  await clickRadio(page, [applicant.ashby.requiresSponsorship, 'Yes'])
  await clickRadio(page, [applicant.ashby.authorizedToWork, 'Yes'])
}

export async function fillCommonScreening(page, applicant) {
  await fillField(
    page,
    ['input[name*="years" i]', 'input[placeholder*="years" i]'],
    applicant.common.yearsOfProfessionalExperience
  )
  await fillField(page, ['input[name*="school" i]', 'input[name*="university" i]'], applicant.education.school)
  await fillField(page, ['input[name*="degree" i]'], applicant.education.highestDegree)
}

export async function uploadResume(page, resumePath) {
  if (!resumePath) return false
  const input = page.locator('input[type="file"]').first()
  if (await input.count()) {
    await input.setInputFiles(resumePath)
    return true
  }
  return false
}

export function loadApplicantProfile() {
  return getApplicant()
}
