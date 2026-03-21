"use client"
import React, { useState } from 'react'

const faqs = [
  {
    q: 'How long does a typical project take?',
    a: 'Project timelines vary based on scope and complexity. A typical web application takes 6–12 weeks. Enterprise systems may take 3–6 months. We always begin with a discovery sprint to define a precise timeline.'
  },
  {
    q: 'Do you offer ongoing maintenance and support?',
    a: 'Absolutely. We offer flexible support tiers — from basic monitoring and updates to 24/7 dedicated SRE teams. All projects come with a 90-day warranty period post-launch.'
  },
  {
    q: 'What technologies do you work with?',
    a: 'We are technology-agnostic. Our stack spans React, Next.js, Python, Go, Node.js, AWS, GCP, Azure, Kubernetes, and more. We recommend the best tool for your specific problem.'
  },
  {
    q: 'How do you handle project communication?',
    a: 'We assign a dedicated project manager and use bi-weekly sprint reviews. You\'ll always have complete visibility with access to our project dashboards, Slack channels, and GitHub repos.'
  }
]

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState(null)

  return (
    <section className="faq" id="contact">
      <div className="container">
        <div className="faq-inner">
          <div className="faq-left">
            <p className="section-label">Got Questions?</p>
            <h2>Frequently Asked <span className="gradient-text">Questions</span></h2>
            <p>Find answers to the most common questions our clients ask before starting a project.</p>
            <div className="faq-list">
              {faqs.map((f, i) => (
                <div className={`faq-item${openIdx === i ? ' open' : ''}`} key={i}>
                  <div className="faq-question" onClick={() => setOpenIdx(openIdx === i ? null : i)}>
                    <span>{f.q}</span>
                    <div className="faq-toggle">{openIdx === i ? '×' : '+'}</div>
                  </div>
                  <div className={`faq-answer${openIdx === i ? ' open' : ''}`}>
                    <p>{f.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="faq-cta-box">
              <div style={{fontSize:'2.5rem', marginBottom:'1rem'}}>💬</div>
              <h3>Still Have Questions?</h3>
              <p>Our solution architects are ready to discuss your unique challenges and craft a custom roadmap.</p>
              <button className="btn-white">Schedule a Call →</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
