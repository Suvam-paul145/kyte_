"use client"
import React from 'react'

/* ── Wireframe SVG icons matching the reference ── */
const IconExpertise = () => (
  <svg width="120" height="90" viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Eye / lens wireframe with meridian lines */}
    <ellipse cx="60" cy="45" rx="50" ry="28" stroke="#4a7fa5" strokeWidth="1" />
    <ellipse cx="60" cy="45" rx="35" ry="28" stroke="#4a7fa5" strokeWidth="0.8" />
    <ellipse cx="60" cy="45" rx="18" ry="28" stroke="#4a7fa5" strokeWidth="0.8" />
    <ellipse cx="60" cy="45" rx="50" ry="14" stroke="#4a7fa5" strokeWidth="0.7" />
    <ellipse cx="60" cy="45" rx="50" ry="5" stroke="#4a7fa5" strokeWidth="0.6" />
    <line x1="10" y1="45" x2="110" y2="45" stroke="#4a7fa5" strokeWidth="0.7" />
    <line x1="60" y1="17" x2="60" y2="73" stroke="#4a7fa5" strokeWidth="0.7" />
    {/* horizontal guide lines */}
    <line x1="22" y1="30" x2="98" y2="30" stroke="#4a7fa5" strokeWidth="0.5" strokeDasharray="2 2" />
    <line x1="22" y1="60" x2="98" y2="60" stroke="#4a7fa5" strokeWidth="0.5" strokeDasharray="2 2" />
  </svg>
)

const IconTechnology = () => (
  <svg width="90" height="120" viewBox="0 0 90 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Hourglass / double-cone wireframe */}
    <ellipse cx="45" cy="15" rx="35" ry="10" stroke="#4a7fa5" strokeWidth="1" />
    <ellipse cx="45" cy="60" rx="8"  ry="3"  stroke="#4a7fa5" strokeWidth="0.8" />
    <ellipse cx="45" cy="105" rx="35" ry="10" stroke="#4a7fa5" strokeWidth="1" />
    {/* top cone lines */}
    <line x1="10"  y1="15" x2="37" y2="60" stroke="#4a7fa5" strokeWidth="0.8" />
    <line x1="80"  y1="15" x2="53" y2="60" stroke="#4a7fa5" strokeWidth="0.8" />
    <line x1="45"  y1="5"  x2="45" y2="57" stroke="#4a7fa5" strokeWidth="0.7" strokeDasharray="3 3" />
    {/* bottom cone lines */}
    <line x1="10"  y1="105" x2="37" y2="63" stroke="#4a7fa5" strokeWidth="0.8" />
    <line x1="80"  y1="105" x2="53" y2="63" stroke="#4a7fa5" strokeWidth="0.8" />
    <line x1="45"  y1="63"  x2="45" y2="115" stroke="#4a7fa5" strokeWidth="0.7" strokeDasharray="3 3" />
    {/* horizontal mid rings */}
    <ellipse cx="45" cy="32" rx="22" ry="6" stroke="#4a7fa5" strokeWidth="0.6" />
    <ellipse cx="45" cy="88" rx="22" ry="6" stroke="#4a7fa5" strokeWidth="0.6" />
  </svg>
)

const IconSolutions = () => (
  <svg width="130" height="90" viewBox="0 0 130 90" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Folded plane / terrain wireframe */}
    <polyline points="5,75 32,30 65,55 98,15 125,40" fill="none" stroke="#4a7fa5" strokeWidth="1" />
    <polyline points="5,85 32,40 65,65 98,25 125,50" fill="none" stroke="#4a7fa5" strokeWidth="0.6" />
    <polyline points="5,65 32,20 65,45 98,5  125,30" fill="none" stroke="#4a7fa5" strokeWidth="0.6" />
    {/* vertical grid lines */}
    <line x1="32"  y1="20" x2="32"  y2="40" stroke="#4a7fa5" strokeWidth="0.6" />
    <line x1="65"  y1="45" x2="65"  y2="65" stroke="#4a7fa5" strokeWidth="0.6" />
    <line x1="98"  y1="5"  x2="98"  y2="25" stroke="#4a7fa5" strokeWidth="0.6" />
    <line x1="125" y1="30" x2="125" y2="50" stroke="#4a7fa5" strokeWidth="0.6" />
    <line x1="5"   y1="65" x2="5"   y2="85" stroke="#4a7fa5" strokeWidth="0.6" />
    {/* extra terrain lines */}
    <polyline points="18,80 45,38 80,60 112,22" fill="none" stroke="#4a7fa5" strokeWidth="0.5" strokeDasharray="3 3" />
  </svg>
)

const IconResults = () => (
  <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Globe/sphere wireframe */}
    <circle cx="50" cy="50" r="40" stroke="#4a7fa5" strokeWidth="1" />
    <ellipse cx="50" cy="50" rx="40" ry="16" stroke="#4a7fa5" strokeWidth="0.8" />
    <ellipse cx="50" cy="50" rx="40" ry="32" stroke="#4a7fa5" strokeWidth="0.7" />
    <ellipse cx="50" cy="50" rx="20" ry="40" stroke="#4a7fa5" strokeWidth="0.8" />
    <ellipse cx="50" cy="50" rx="8"  ry="40" stroke="#4a7fa5" strokeWidth="0.6" />
    <line x1="10" y1="50" x2="90" y2="50" stroke="#4a7fa5" strokeWidth="0.7" />
    <line x1="50" y1="10" x2="50" y2="90" stroke="#4a7fa5" strokeWidth="0.7" strokeDasharray="2 2" />
  </svg>
)

const features = [
  {
    Icon: IconExpertise,
    title: 'expertise',
    desc: 'Our team of experienced experts have the knowledge and expertise to deliver innovative IT solutions that meet your unique needs.'
  },
  {
    Icon: IconTechnology,
    title: 'technology',
    desc: 'We stay up to date with the latest trends and technologies in the IT industry, so you can get the most advanced solutions available.'
  },
  {
    Icon: IconSolutions,
    title: 'solutions',
    desc: 'We take a personalized approach to every project, working closely with you to understand your business and create solutions.'
  },
  {
    Icon: IconResults,
    title: 'results',
    desc: 'Our track record speaks for itself — we\'ve helped businesses of all sizes and industries achieve their goals with our IT solutions.'
  }
]

export default function Features() {
  return (
    <section className="wcu-section" id="about-us">
      {/* Background wave lines SVG */}
      <div className="wcu-wave-bg">
        <svg viewBox="0 0 800 600" preserveAspectRatio="xMaxYMin slice" xmlns="http://www.w3.org/2000/svg">
          {[0,25,50,75,100,125,150,175,200,225,250,275].map((off, i) => (
            <path
              key={i}
              d={`M ${500 + off} 0 C ${450 + off} 80 ${350 + off} 150 ${280 + off} 250 S ${180 + off} 400 ${100 + off} 600`}
              fill="none"
              stroke={`rgba(70,120,180,${0.12 - i * 0.008})`}
              strokeWidth="1"
            />
          ))}
        </svg>
      </div>

      <div className="wcu-inner">
        {/* Heading area */}
        <div className="wcu-heading-wrap">
          <div className="wcu-orb" />
          <h2 className="wcu-heading">
            Why<br />Choose Us?
          </h2>
        </div>

        {/* 4-column grid */}
        <div className="wcu-grid">
          {features.map(({ Icon, title, desc }) => (
            <div className="wcu-col" key={title}>
              <div className="wcu-icon">
                <Icon />
              </div>
              <h3 className="wcu-title">{title}</h3>
              <p className="wcu-desc">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
