import React from 'react'

export default function Hero() {
  return (
    <section className="hero" id="home">
      {/* Animated SVG Wave Background */}
      <div className="hero-wave-bg">
        <svg viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="bgGrad" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#12182e" />
              <stop offset="100%" stopColor="#080b18" />
            </radialGradient>
          </defs>
          <rect width="1440" height="800" fill="url(#bgGrad)" />
          {[0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200].map((offset, i) => (
            <path
              key={i}
              d={`M -100 ${500 + offset} C 200 ${400 + offset} 400 ${350 - offset * 0.5} 600 ${420 + offset * 0.3} S 900 ${480 + offset * 0.2} 1100 ${430 + offset * 0.4} S 1350 ${400 + offset} 1540 ${450 + offset}`}
              fill="none"
              stroke={`rgba(102, 211, 255, ${0.04 - i * 0.002})`}
              strokeWidth="1.5"
            />
          ))}
          <ellipse cx="300" cy="600" rx="350" ry="200" fill="rgba(0,30,60,0.35)" />
          <ellipse cx="1100" cy="500" rx="320" ry="250" fill="rgba(0,15,40,0.3)" />
          <ellipse cx="700" cy="700" rx="500" ry="150" fill="rgba(0,20,50,0.25)" />
        </svg>
      </div>

      {/* 3D Floating Orbs */}
      <div className="orb orb-top-right" />
      <div className="orb orb-mid-left" />
      <div className="orb-torus" />

      {/* Floating SaaS badge — top right */}
      <div className="cli-badge cli-badge-tr">
        <span className="cli-prompt">✨</span> New Update Available
      </div>

      {/* Floating output badge — bottom left */}
      <div className="cli-badge cli-badge-bl">
        <span className="cli-ok">✔</span> 99.99% Uptime SLA
      </div>

      {/* Hero Content — Centered */}
      <div className="container hero-center">
        <h1 className="hero-headline">
          <span className="hero-line-1">YOUR BEST</span>
          <span className="hero-line-2">
            <em className="hero-it">SAAS </em>
            <span className="hero-partners">PLATFORM</span>
          </span>
        </h1>

        <p className="hero-desc">
          KYTE is a next-generation web application template featuring premium<br />
          glassmorphism aesthetics, modern animations, and built-in authentication.
        </p>

        <a href="#features" className="btn-explore">
          EXPLORE NOW <span className="btn-arrow">————→</span>
        </a>
      </div>
    </section>
  )
}
