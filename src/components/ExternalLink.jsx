const ABSOLUTE_URL = /^https?:\/\//i

function normalizeHref(href) {
  if (!href) return href
  if (ABSOLUTE_URL.test(href)) return href

  const trimmed = href.replace(/^\/+/, '')
  // Avoid turning "linkedin.com/..." into "https://linkedin.com/..." (wrong host).
  if (/^linkedin\.com\//i.test(trimmed)) {
    return `https://www.${trimmed.replace(/\/+$/, '')}/`
  }

  return `https://${trimmed}`
}

export default function ExternalLink({
  href,
  className = '',
  children,
  ...props
}) {
  return (
    <a
      href={normalizeHref(href)}
      className={className}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  )
}
