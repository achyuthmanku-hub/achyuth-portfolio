export async function fetchLeverBoard(source, companyName) {
  const slug = source.slug
  const res = await fetch(`https://api.lever.co/v0/postings/${slug}?mode=json`)
  if (!res.ok) {
    throw new Error(`Lever ${slug}: HTTP ${res.status}`)
  }

  const postings = await res.json()
  return postings.map((item) => ({
    title: item.text || 'Untitled',
    company: companyName,
    location: item.categories?.location || '',
    platform: `Lever (${slug})`,
    applyLink: item.hostedUrl || item.applyUrl || '',
    description: [
      item.descriptionPlain || '',
      item.lists?.map((l) => l.content).join(' ') || '',
    ].join('\n'),
    postedAt: item.createdAt ? new Date(item.createdAt).toISOString() : null,
    keySkills: [],
    source: 'lever',
  }))
}
