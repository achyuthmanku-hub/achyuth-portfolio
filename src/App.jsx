import { useEffect, useState } from 'react'
import MeshBackground from './components/MeshBackground.jsx'
import ExternalLink from './components/ExternalLink.jsx'
import { useReveal } from './hooks/useReveal.js'

const LINKEDIN = 'https://www.linkedin.com/in/contactachyuth'
const LINKEDIN_LABEL = 'linkedin.com/in/contactachyuth'
const EMAIL = 'achyuthmanku@gmail.com'
const PHONE = '(513) 799-8391'
const RESUME_PDF = '/Achyuth-Reddy-Manku-Resume.pdf'

const GOOGLE_AI_BADGE = {
  title: 'Google AI Professional Certificate',
  issuer: 'Google',
  image:
    'https://images.credly.com/images/5bd2d506-c95c-4766-a5b1-8da62a3a23b2/linkedin_thumb_blob',
  verifyUrl: 'https://www.credly.com/badges/ae450ebe-7304-4583-9aba-145de509bb9d',
}

const NAV = [
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Stack' },
  { id: 'experience', label: 'Work' },
  { id: 'projects', label: 'Builds' },
  { id: 'credentials', label: 'Credentials' },
]

const METRICS = [
  { value: '4+', label: 'Years shipping production systems' },
  { value: '99.9%', label: 'Uptime on money-movement services' },
  { value: '50K+', label: 'Documents indexed in RAG pipelines' },
  { value: '1M+', label: 'Customers served via banking APIs' },
]

const TICKER = [
  'Java',
  'Spring Boot',
  'Node.js',
  'NestJS',
  'AWS',
  'Azure',
  'Kubernetes',
  'LangChain',
  'OpenAI',
  'RAG',
  'React',
  'PostgreSQL',
  'Kafka',
  'OAuth 2.0',
  'Splunk',
  'Grafana',
]

const skillGroups = [
  {
    title: 'Languages',
    code: 'lang',
    items: ['Java', 'Python', 'TypeScript', 'JavaScript', 'SQL', 'Go'],
  },
  {
    title: 'Backend',
    code: 'api',
    items: [
      'Spring Boot',
      'Spring MVC',
      'Spring Security',
      'Hibernate',
      'Node.js',
      'NestJS',
      'REST APIs',
      'GraphQL',
      'Microservices',
    ],
  },
  {
    title: 'Generative AI',
    code: 'ai',
    items: [
      'OpenAI APIs',
      'LangChain',
      'LangSmith',
      'RAG',
      'Prompt engineering',
      'Semantic search',
      'ChromaDB',
      'Pinecone',
      'Cohere re-ranking',
      'TensorFlow.js',
    ],
  },
  {
    title: 'Cloud & DevOps',
    code: 'ops',
    items: [
      'AWS (EC2, S3, Lambda)',
      'Azure',
      'Docker',
      'Kubernetes',
      'Jenkins',
      'Maven',
      'Gradle',
      'Terraform',
      'CI/CD',
    ],
  },
  {
    title: 'Data layer',
    code: 'data',
    items: [
      'PostgreSQL',
      'MySQL',
      'Oracle',
      'MongoDB',
      'Cassandra',
      'DynamoDB',
      'Redis',
      'Kafka',
      'RabbitMQ',
    ],
  },
  {
    title: 'Frontend',
    code: 'ui',
    items: ['React', 'Redux', 'React Hooks', 'Angular', 'HTML5', 'CSS3', 'Responsive design'],
  },
  {
    title: 'Security & Observability',
    code: 'sec',
    items: [
      'OAuth 2.0',
      'JWT',
      'RBAC',
      'Secure SDLC',
      'Splunk',
      'Grafana',
      'Prometheus',
      'ELK Stack',
      'New Relic',
    ],
  },
  {
    title: 'Testing & Quality',
    code: 'qa',
    items: ['JUnit', 'Mockito', 'Selenium', 'JMeter', 'TDD', 'SonarQube'],
  },
]

const experience = [
  {
    company: 'Citibank',
    accent: '#1a5cff',
    range: 'Nov 2024 — Present',
    role: 'Software Engineer',
    highlight: 'GenAI knowledge assistant · 6 microservices · 99.9% uptime',
    bullets: [
      'Designed and shipped six cloud-native microservices (Java, Spring Boot, Node.js, NestJS) on AWS and Azure with 99.9% availability for real-time money transfers.',
      'Built secure REST APIs with OAuth 2.0, JWT, and RBAC for four internal banking platforms — cut cross-team integration time ~30%.',
      'Rebuilt banking dashboard in React and Angular; load times dropped ~25% and slow-UI support tickets mostly stopped.',
      'Distributed data layer across Cassandra, MongoDB, MySQL, and DynamoDB — read speeds improved ~30% by matching store to access pattern.',
      'Containerized 10+ services with Docker/Kubernetes; rollback incidents dropped 40%.',
      'Replaced a 2-week release process with Jenkins, Maven, and Gradle pipelines — now shipping in 3 days with zero-downtime deploys.',
      'Led internal knowledge assistant with LangChain, RAG, and OpenAI — saves each engineer ~3 hrs/week digging through docs.',
      'Partnered with platform and compliance on guardrails, access controls, and audit logging for regulated AI features.',
      'Splunk, Grafana, and ELK monitoring caught and resolved 15+ anomalies before customers noticed.',
    ],
  },
  {
    company: 'Capital One',
    accent: '#d03027',
    range: 'Dec 2023 — Nov 2024',
    role: 'Software Engineer',
    highlight: 'High-traffic APIs · p99 under 300ms',
    bullets: [
      'Designed Java and Spring Boot backend systems for high-traffic banking flows; average API response times dropped ~35%.',
      'Hunted down latency on IBM WebSphere REST services — connection pooling and async patterns took p99 from ~800ms to under 300ms.',
      'Built React, Redux, and React Hooks UI components with responsive design; page load time fell ~20%.',
      'Tightened PostgreSQL with smarter indexing and query tuning; slow-query incidents dropped 60%.',
      'Improved Splunk dashboards and alert hygiene — MTTR for P1 incidents came down ~25%.',
      'Agile Scrum sprints with code reviews, TDD, and pair-debugging via Git and JIRA.',
    ],
  },
  {
    company: 'HSBC',
    accent: '#db0011',
    range: 'Sep 2020 — Aug 2022',
    role: 'Java Backend Engineer',
    highlight: '1M+ customers · 85% test coverage',
    bullets: [
      'Built Java and Spring Boot REST APIs for account management systems used by 1M+ customers (MySQL and MongoDB).',
      'Added Redis caching to read-heavy paths; average response times dropped ~45% almost overnight.',
      'Pushed test coverage from 52% to 85% with JUnit, Mockito, and Selenium — production defects fell ~30%.',
      'Tuned SQL queries and indexes in MySQL until average execution time was cut in half (~50%).',
      'Supported weekly zero-downtime releases with Maven, Jenkins, and Docker; held 99.7% availability SLA.',
    ],
  },
]

const projects = [
  {
    title: 'Enterprise Document Intelligence',
    subtitle: 'Multi-modal RAG at scale',
    tags: ['LangChain', 'GPT-4', 'ChromaDB', 'Cohere'],
    metrics: [
      { k: 'Docs indexed', v: '50K+' },
      { k: 'Retrieval accuracy', v: '89%' },
      { k: 'Avg response', v: '2.3s' },
    ],
    body:
      'Semantic search across PDFs, Word docs, and code repos with hybrid dense + sparse retrieval, semantic chunking, and Cohere re-ranking. LangSmith tracks prompts, latency, and feedback loops.',
  },
  {
    title: 'AI Financial Assistant',
    subtitle: 'Function calling + expense ML',
    tags: ['Spring Boot', 'React', 'OpenAI', 'TensorFlow'],
    metrics: [
      { k: 'Classifier accuracy', v: '87%' },
      { k: 'Categories', v: '15' },
      { k: 'API latency', v: '<200ms' },
    ],
    body:
      'Natural-language finance queries with OpenAI function calling, a TensorFlow expense classifier, and JWT-secured MySQL backend handling 10K+ monthly transactions.',
  },
]

const education = [
  {
    school: 'University of Cincinnati',
    degree: 'Master of Science, Information Technology',
    place: 'Cincinnati, OH',
    when: 'Aug 2022 — May 2023',
  },
  {
    school: 'Jawaharlal Nehru Technological University Hyderabad (JNTUH)',
    degree: 'Bachelor of Technology, Computer Science',
    place: 'Hyderabad, India',
    when: 'Aug 2017 — May 2021',
  },
]

const certifications = [
  {
    title: 'Foundations of Prompt Engineering',
    issuer: 'Amazon Web Services',
    verifyUrl: 'https://skillbuilder.aws/212b66a7-0406-4c12-a577-ce41d81787df',
  },
]

function RevealSection({ id, className = '', children }) {
  const ref = useReveal()
  return (
    <section id={id} ref={ref} className={`reveal ${className}`}>
      {children}
    </section>
  )
}

function JobCard({ job }) {
  const [open, setOpen] = useState(false)
  const visible = open ? job.bullets : job.bullets.slice(0, 3)

  return (
    <article className="job" style={{ '--job-accent': job.accent }}>
      <div className="job__rail" aria-hidden="true" />
      <div className="job__body">
        <header className="job__header">
          <div>
            <p className="job__range">{job.range}</p>
            <h3>{job.company}</h3>
            <p className="job__role">{job.role}</p>
          </div>
          <span className="job__chip">{job.highlight}</span>
        </header>
        <ul>
          {visible.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        {job.bullets.length > 3 && (
          <button type="button" className="job__toggle" onClick={() => setOpen((v) => !v)}>
            {open ? 'Show less' : `+${job.bullets.length - 3} more highlights`}
          </button>
        )}
      </div>
    </article>
  )
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrollPct, setScrollPct] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement
      const max = scrollHeight - clientHeight
      setScrollPct(max > 0 ? (scrollTop / max) * 100 : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <>
      <MeshBackground />
      <div className="scroll-progress" style={{ width: `${scrollPct}%` }} aria-hidden="true" />

      <header className="site-header">
        <div className="site-header__inner">
          <a href="#top" className="logo" onClick={() => setMenuOpen(false)}>
            <span className="logo__mark">AR</span>
            <span className="logo__text">Achyuth Reddy</span>
          </a>

          <button
            type="button"
            className="nav-toggle"
            aria-expanded={menuOpen}
            aria-controls="site-nav"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span />
            <span />
          </button>

          <nav id="site-nav" className={`nav ${menuOpen ? 'nav--open' : ''}`} aria-label="Primary">
            {NAV.map((item) => (
              <a key={item.id} href={`#${item.id}`} onClick={() => setMenuOpen(false)}>
                {item.label}
              </a>
            ))}
            <a className="nav__cta" href={RESUME_PDF} download onClick={() => setMenuOpen(false)}>
              Resume
            </a>
            <ExternalLink
              className="nav__linkedin"
              href={LINKEDIN}
              title={LINKEDIN}
              onClick={() => setMenuOpen(false)}
            >
              LinkedIn
            </ExternalLink>
          </nav>
        </div>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-heading">
          <div className="hero__copy">
            <p className="hero__eyebrow">
              <span className="pulse" aria-hidden="true" />
              Available for backend &amp; GenAI roles
            </p>
            <h1 id="hero-heading">
              <span className="hero__line">Achyuth</span>
              <span className="hero__line hero__line--accent">Reddy Manku</span>
            </h1>
            <p className="hero__mono">backend.engineer @ fintech + generative-ai</p>
            <p className="hero__lead">
              Software engineer with 4+ years building the backend that quietly keeps banks
              running—Java, Spring Boot, and Node.js on AWS and Azure. Lately deep in Generative
              AI: OpenAI APIs, LangChain RAG pipelines, and knowledge assistants engineers actually
              use in regulated production environments.
            </p>
            <div className="hero__actions">
              <ExternalLink className="btn btn--gold" href={LINKEDIN} title={LINKEDIN}>
                Connect on LinkedIn
              </ExternalLink>
              <a className="btn btn--ghost" href={`mailto:${EMAIL}`}>
                {EMAIL}
              </a>
            </div>
            <a
              className="hero__cert"
              href={GOOGLE_AI_BADGE.verifyUrl}
              target="_blank"
              rel="noreferrer"
            >
              <img
                src={GOOGLE_AI_BADGE.image}
                alt={`${GOOGLE_AI_BADGE.title} badge`}
                width={52}
                height={52}
              />
              <span>
                <strong>{GOOGLE_AI_BADGE.title}</strong>
                <em>Credly verified · Google</em>
              </span>
            </a>
          </div>

          <aside className="console" aria-label="Production metrics snapshot">
            <div className="console__bar">
              <span className="console__dot console__dot--live" />
              <span className="console__title">production_pulse.json</span>
              <span className="console__status">LIVE</span>
            </div>
            <div className="console__body">
              {METRICS.map((m) => (
                <div key={m.label} className="console__metric">
                  <span className="console__value">{m.value}</span>
                  <span className="console__label">{m.label}</span>
                </div>
              ))}
              <div className="console__contact">
                <div>
                  <span className="label">location</span>
                  <span>United States</span>
                </div>
                <div>
                  <span className="label">phone</span>
                  <a href="tel:+15137998391">{PHONE}</a>
                </div>
                <div>
                  <span className="label">linkedin</span>
                  <ExternalLink href={LINKEDIN} title={LINKEDIN}>
                    {LINKEDIN_LABEL}
                  </ExternalLink>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <div className="ticker" aria-hidden="true">
          <div className="ticker__track">
            {[...TICKER, ...TICKER].map((item, i) => (
              <span key={`${item}-${i}`}>{item}</span>
            ))}
          </div>
        </div>

        <div className="metrics-strip">
          {METRICS.map((m) => (
            <div key={m.label} className="metrics-strip__item">
              <strong>{m.value}</strong>
              <span>{m.label}</span>
            </div>
          ))}
        </div>

        <RevealSection id="about" className="section">
          <div className="section__head">
            <span className="section__num">01</span>
            <div>
              <h2>About</h2>
              <p className="section__sub">
                Four years in regulated banking—now shipping GenAI that passes compliance review.
              </p>
            </div>
          </div>
          <div className="about-grid">
            <blockquote className="about-quote">
              “The backend that quietly keeps banks running—and the AI layer that stops engineers
              from digging through runbooks at midnight.”
            </blockquote>
            <div className="about-panels">
              <div className="about-panel">
                <h3>What I optimize for</h3>
                <ul>
                  <li>API latency &amp; p99 under real load</li>
                  <li>Zero-downtime deploys &amp; rollback safety</li>
                  <li>RAG answers engineers actually trust</li>
                  <li>Audit-ready AI in regulated environments</li>
                </ul>
              </div>
              <div className="about-panel about-panel--accent">
                <h3>Currently at</h3>
                <p className="about-panel__company">Citibank</p>
                <p>Cloud-native microservices, internal knowledge assistants, and observability that pages on signal—not noise.</p>
              </div>
            </div>
          </div>
        </RevealSection>

        <RevealSection id="skills" className="section">
          <div className="section__head">
            <span className="section__num">02</span>
            <div>
              <h2>Stack</h2>
              <p className="section__sub">Hover a cluster—each maps to production systems I’ve shipped.</p>
            </div>
          </div>
          <div className="bento">
            {skillGroups.map((g) => (
              <div key={g.title} className={`bento__card bento__card--${g.code}`}>
                <span className="bento__code">.{g.code}</span>
                <h3>{g.title}</h3>
                <div className="bento__tags">
                  {g.items.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </RevealSection>

        <RevealSection id="experience" className="section">
          <div className="section__head">
            <span className="section__num">03</span>
            <div>
              <h2>Work</h2>
              <p className="section__sub">Citibank → Capital One → HSBC. Banking scale, startup speed.</p>
            </div>
          </div>
          <div className="timeline">
            {experience.map((job) => (
              <JobCard key={job.company} job={job} />
            ))}
          </div>
        </RevealSection>

        <RevealSection id="projects" className="section">
          <div className="section__head">
            <span className="section__num">04</span>
            <div>
              <h2>Builds</h2>
              <p className="section__sub">Side projects that mirror the GenAI work I do in production.</p>
            </div>
          </div>
          <div className="project-grid">
            {projects.map((p) => (
              <article key={p.title} className="project">
                <div className="project__top">
                  <div>
                    <p className="project__subtitle">{p.subtitle}</p>
                    <h3>{p.title}</h3>
                  </div>
                  <span className="project__status">200 OK</span>
                </div>
                <div className="project__metrics">
                  {p.metrics.map((m) => (
                    <div key={m.k}>
                      <strong>{m.v}</strong>
                      <span>{m.k}</span>
                    </div>
                  ))}
                </div>
                <p className="project__body">{p.body}</p>
                <div className="project__tags">
                  {p.tags.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </RevealSection>

        <RevealSection id="credentials" className="section">
          <div className="section__head">
            <span className="section__num">05</span>
            <div>
              <h2>Credentials</h2>
              <p className="section__sub">Verified AI and cloud certifications.</p>
            </div>
          </div>
          <div className="cred-wall">
            <a
              className="cred-feature"
              href={GOOGLE_AI_BADGE.verifyUrl}
              target="_blank"
              rel="noreferrer"
            >
              <div className="cred-feature__glow" aria-hidden="true" />
              <img
                src={GOOGLE_AI_BADGE.image}
                alt={`${GOOGLE_AI_BADGE.title} badge`}
                width={140}
                height={140}
              />
              <div>
                <h3>{GOOGLE_AI_BADGE.title}</h3>
                <p>Google · AI fluency, Gemini, workplace automation, 20+ hands-on projects</p>
                <span className="cred-link">Verify on Credly →</span>
              </div>
            </a>
            <div className="cred-side">
              {certifications.map((c) => (
                <a key={c.title} className="cred-card" href={c.verifyUrl} target="_blank" rel="noreferrer">
                  <span className="cred-card__badge">AWS</span>
                  <div>
                    <h4>{c.title}</h4>
                    <p>{c.issuer}</p>
                  </div>
                </a>
              ))}
              <div className="edu-stack">
                {education.map((e) => (
                  <div key={e.school} className="edu-card">
                    <p className="edu-card__when">{e.when}</p>
                    <h4>{e.degree}</h4>
                    <p>
                      {e.school} · {e.place}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </RevealSection>

        <section className="cta" aria-labelledby="cta-heading">
          <div className="cta__inner reveal is-visible">
            <p className="cta__eyebrow">Let&apos;s build something reliable</p>
            <h2 id="cta-heading">Need a backend engineer who ships GenAI in production?</h2>
            <p>I&apos;m open to Software Engineer, Backend, and Generative AI roles.</p>
            <div className="cta__actions">
              <a className="btn btn--gold" href={`mailto:${EMAIL}`}>
                Start a conversation
              </a>
              <ExternalLink className="btn btn--ghost" href={LINKEDIN} title={LINKEDIN}>
                LinkedIn profile
              </ExternalLink>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <p>
          Crafted by Achyuth Reddy Manku · {new Date().getFullYear()} ·{' '}
          <ExternalLink href={LINKEDIN} title={LINKEDIN}>
            LinkedIn
          </ExternalLink>
        </p>
      </footer>
    </>
  )
}

export default App
