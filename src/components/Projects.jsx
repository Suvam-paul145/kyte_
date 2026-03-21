import React from 'react'

const projects = [
  {
    emoji: '🛰️',
    title: 'Sentinel Protocol X',
    category: 'Cyber Security',
    desc: 'Zero-trust architecture for Fortune 500 enterprise',
    featured: false
  },
  {
    emoji: '👤',
    title: 'Mike Medika',
    category: 'Lead Architect',
    desc: 'Healthcare AI platform · 2M+ patients served',
    featured: true
  },
  {
    emoji: '🔗',
    title: 'Neural Link CMS',
    category: 'Machine Learning',
    desc: 'AI-driven content management system',
    featured: false
  },
  {
    emoji: '☁️',
    title: 'CloudShift Migration',
    category: 'Cloud Infrastructure',
    desc: 'Multi-cloud migration for global retailer',
    featured: false
  },
  {
    emoji: '📊',
    title: 'Quant Dashboard',
    category: 'Data Engineering',
    desc: 'Real-time financial analytics platform',
    featured: false
  },
  {
    emoji: '🤖',
    title: 'AutoML Pipeline',
    category: 'Machine Learning',
    desc: 'Automated model training and deployment',
    featured: false
  }
]

export default function Projects() {
  return (
    <section className="projects" id="projects">
      <div className="container">
        <p className="section-label">Our Work</p>
        <h2>Featured <span className="gradient-text">Projects</span></h2>
        <p className="projects-subtitle">
          Real solutions, real impact. Explore what our engineering teams have built.
        </p>
        <div className="projects-grid">
          {projects.map((p, i) => (
            <div className={`project-card${p.featured ? ' featured' : ''}`} key={i}>
              <div className="project-img">{p.emoji}</div>
              <div className="project-info">
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
                <span className="project-tag">{p.category}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
