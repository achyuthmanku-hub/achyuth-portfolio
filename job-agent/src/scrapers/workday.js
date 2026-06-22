export async function fetchWorkdayBoard(source, companyName) {
  const tenant = source.tenant
  const wd = source.wd || 'wd1'
  const site = source.site
  const maxJobs = source.maxJobs || 200
  const searchText = source.query || ''
  const host = `https://${tenant}.${wd}.myworkdayjobs.com`
  const url = `${host}/wday/cxs/${tenant}/${site}/jobs`

  const jobs = []
  let offset = 0
  const limit = 20

  while (jobs.length < maxJobs) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appliedFacets: {},
        limit,
        offset,
        searchText,
      }),
    })

    if (!res.ok) {
      throw new Error(`Workday ${tenant}/${site}: HTTP ${res.status}`)
    }

    const payload = await res.json()
    const postings = payload.jobPostings || []
    if (!postings.length) break

    for (const item of postings) {
      const externalPath = item.externalPath || ''
      jobs.push({
        title: item.title || 'Untitled',
        company: companyName,
        location: item.locationsText || '',
        platform: `Workday (${companyName})`,
        applyLink: externalPath ? `${host}${externalPath}` : host,
        description: item.description || item.bulletFields?.join(' ') || '',
        postedAt: item.postedOn || item.postedDate || null,
        keySkills: [],
        source: 'workday',
      })
    }

    offset += postings.length
    if (offset >= (payload.total || 0) || jobs.length >= maxJobs) break
  }

  return jobs.slice(0, maxJobs)
}
