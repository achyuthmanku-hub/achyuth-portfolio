const ASHBY_QUERY = `
query ApiJobBoardWithTeams($organizationHostedJobsPageName: String!) {
  jobBoard: jobBoardWithTeams(organizationHostedJobsPageName: $organizationHostedJobsPageName) {
    jobPostings {
      id
      title
      locationName
      publishedDate
      descriptionHtml
    }
  }
}`

function stripHtml(html = '') {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export async function fetchAshbyBoard(source, companyName) {
  const slug = source.slug
  const res = await fetch('https://jobs.ashbyhq.com/api/non-user-graphql?op=ApiJobBoardWithTeams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operationName: 'ApiJobBoardWithTeams',
      variables: { organizationHostedJobsPageName: slug },
      query: ASHBY_QUERY,
    }),
  })

  if (!res.ok) {
    throw new Error(`Ashby ${slug}: HTTP ${res.status}`)
  }

  const data = await res.json()
  const postings = data?.data?.jobBoard?.jobPostings || []

  return postings.map((item) => ({
    title: item.title || 'Untitled',
    company: companyName,
    location: item.locationName || '',
    platform: `Ashby (${slug})`,
    applyLink: `https://jobs.ashbyhq.com/${slug}/${item.id}`,
    description: stripHtml(item.descriptionHtml || ''),
    postedAt: item.publishedDate || null,
    keySkills: [],
    source: 'ashby',
  }))
}
