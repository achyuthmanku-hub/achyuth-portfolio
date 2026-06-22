const ABSOLUTE_URL = /^https?:\/\//i

export default function ExternalLink({
  href,
  className = '',
  children,
  ...props
}) {
  const safeHref = ABSOLUTE_URL.test(href) ? href : `https://${href.replace(/^\/+/, '')}`

  return (
    <a
      href={safeHref}
      className={className}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  )
}
