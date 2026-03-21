"use client"
import React from 'react'

export default function Stats() {
  return (
    <section className="stats">
      <div className="container">
        <p className="section-label" style={{textAlign:'center', color:'#0066ff'}}>Our Impact</p>
        <div className="stats-quote">
          "We believe that technology can{' '}
          <span style={{background:'linear-gradient(135deg,#00c9ff,#0066ff)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text'}}>
            change the world.
          </span>"
        </div>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-num">350+</div>
            <div className="stat-lbl">Clients Worldwide</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">98%</div>
            <div className="stat-lbl">Client Satisfaction</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">15</div>
            <div className="stat-lbl">Years of Excellence</div>
          </div>
        </div>
      </div>
    </section>
  )
}
