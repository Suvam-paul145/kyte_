"use client"
import React, { useState } from 'react'

const serviceList = [
  {
    title: 'Rapid Deployment',
    desc: 'Accelerate your time-to-market with our agile delivery framework. We ship production-ready systems in weeks, not months, without compromising on quality or scalability.'
  },
  {
    title: 'Machine Learning & AI',
    desc: 'Custom ML model development, MLOps pipelines, and AI integration services. From NLP to computer vision — we build intelligence into your core product.'
  },
  {
    title: 'Cyber Security',
    desc: 'Comprehensive security audits, penetration testing, zero-trust architecture design, and incident response. We protect your business 24/7.'
  },
  {
    title: 'Digital Transformation',
    desc: 'Full-scale modernization of legacy systems, cloud migration, and process automation. We guide your organization through every stage of the digital journey.'
  },
  {
    title: 'Cloud Infrastructure',
    desc: 'Multi-cloud strategy, serverless architecture, and DevOps implementation. We design scalable, cost-optimized infrastructure that grows with your business.'
  }
]

export default function Services() {
  const [openIdx, setOpenIdx] = useState(0)

  return (
    <section className="services" id="services">
      <div className="container">
        <div className="services-inner">
          <div className="services-left">
            <p className="section-label">What We Do</p>
            <h2>Our Core <span className="gradient-text">Services</span></h2>
            <p>We deliver end-to-end technology solutions tailored to your unique challenges and business goals.</p>
            <div className="services-img-wrap">⚙️</div>
          </div>

          <div className="services-list">
            {serviceList.map((s, i) => (
              <div className={`service-item${openIdx === i ? ' open' : ''}`} key={i}>
                <div className="service-header" onClick={() => setOpenIdx(openIdx === i ? -1 : i)}>
                  <h3>{s.title}</h3>
                  <div className="service-toggle">{openIdx === i ? '×' : '+'}</div>
                </div>
                <div className={`service-body${openIdx === i ? ' open' : ''}`}>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
