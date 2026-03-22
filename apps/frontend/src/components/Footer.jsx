"use client"
import React from 'react'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <>
      <section className="cta-banner">
        <div className="container">
          <div className="cta-banner-inner">
            <div>
              <p className="section-label">Ready to Start?</p>
              <h2>Need IT Solutions?<br /><span>Let&apos;s start now.</span></h2>
            </div>
            <a href="#contact" className="btn-primary" style={{fontSize:'1rem', padding:'1rem 2.5rem'}}>
              Get in Touch -&gt;
            </a>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-top">
            <div className="footer-brand">
              <div style={{display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.25rem'}}>
                <div className="logo-badge">OK</div>
                <span style={{fontFamily:"'Space Grotesk', sans-serif", fontWeight:700, fontSize:'1.2rem'}}>
                  WAVE IT
                </span>
              </div>
              <p>Next-generation IT solutions for the digital era. Building tomorrow&apos;s infrastructure, today.</p>
              <div className="footer-social">
                {['f', 't', 'in', 'yt'].map((s, i) => (
                  <a key={i} href="#" className="social-icon" aria-label={`Social ${s}`}>
                    {s === 'f' ? 'FB' : s === 't' ? 'X' : s === 'in' ? 'IN' : 'YT'}
                  </a>
                ))}
              </div>
            </div>

            <div className="footer-col">
              <h4>Services</h4>
              <ul>
                {['Rapid Deployment','Machine Learning','Cyber Security','Cloud Infrastructure','Digital Transformation'].map(l => (
                  <li key={l}><a href="#services">{l}</a></li>
                ))}
              </ul>
            </div>

            <div className="footer-col">
              <h4>Company</h4>
              <ul>
                {['About Us','Projects','Blog','Careers','Press'].map(l => (
                  <li key={l}><a href={`#${l.toLowerCase().replace(' ','-')}`}>{l}</a></li>
                ))}
              </ul>
            </div>

            <div className="footer-col">
              <h4>Contact</h4>
              <ul>
                <li><a href="mailto:hello@optivuskyte.io">hello@optivuskyte.io</a></li>
                <li><a href="tel:+1234567890">+1 (234) 567-890</a></li>
                <li><span style={{color:'#a7aabb', fontSize:'0.875rem'}}>San Francisco, CA</span></li>
                <li><span style={{color:'#a7aabb', fontSize:'0.875rem'}}>London, UK</span></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; {year} Optivus Kyte / WAVE IT. All rights reserved.</p>
            <div style={{display:'flex', gap:'2rem'}}>
              <a href="#" style={{fontSize:'0.8rem', color:'#a7aabb'}}>Privacy Policy</a>
              <a href="#" style={{fontSize:'0.8rem', color:'#a7aabb'}}>Terms of Service</a>
              <a href="#" style={{fontSize:'0.8rem', color:'#a7aabb'}}>Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
