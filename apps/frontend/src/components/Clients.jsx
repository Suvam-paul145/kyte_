"use client"
import React from 'react'

const testimonials = [
  {
    stars: '★★★★★',
    text: '"Optivus Kyte transformed our infrastructure completely. Their team delivered a cloud-native platform that reduced latency by 60% and cut costs significantly. Exceptional work."',
    name: 'Sarah Mitchell',
    company: 'CTO, NexaBridge Corp',
    initials: 'SM'
  },
  {
    stars: '★★★★★',
    text: '"The cybersecurity audit revealed vulnerabilities we didn\'t know existed. Their remediation strategy was thorough, professional, and executed without disrupting our operations."',
    name: 'James Okafor',
    company: 'CISO, Pinnacle Finance',
    initials: 'JO'
  },
  {
    stars: '★★★★☆',
    text: '"From ideation to deployment, the team at Optivus Kyte delivered a best-in-class machine learning model that now powers our core recommendation engine."',
    name: 'Priya Sharma',
    company: 'VP Engineering, FlowTech',
    initials: 'PS'
  },
  {
    stars: '★★★★★',
    text: '"Their rapid deployment framework is unparalleled. We went from concept to live product in 6 weeks. The attention to quality throughout was remarkable."',
    name: 'David Chen',
    company: 'Founder, Quantix Labs',
    initials: 'DC'
  }
]

const logos = ['Microsoft', 'Cisco', 'Salesforce', 'AWS', 'Google', 'Oracle']

export default function Clients() {
  return (
    <section className="clients">
      <div className="container">
        <div className="clients-header">
          <div>
            <p className="section-label">Client Stories</p>
            <h2>Trusted by Industry <span className="gradient-text">Leaders</span></h2>
          </div>
          <div className="clients-arrow">→</div>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((t, i) => (
            <div className="testimonial-card" key={i}>
              <div className="stars">{t.stars}</div>
              <p className="testimonial-text">{t.text}</p>
              <div className="testimonial-author">
                <div className="author-avatar">{t.initials}</div>
                <div>
                  <div className="author-name">{t.name}</div>
                  <div className="author-company">{t.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="client-logos">
          {logos.map(l => (
            <div className="client-logo" key={l}>{l}</div>
          ))}
        </div>
      </div>
    </section>
  )
}
