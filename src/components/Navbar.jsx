import React, { useState, useEffect } from 'react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="navbar-inner container">
        {/* Logo */}
        <a href="#home" className="wavenet-logo">
          <span className="logo-wave">KYTE</span>
        </a>

        {/* Center Nav Links */}
        <ul className="navbar-links">
          {['ABOUT US', 'FEATURES', 'PRICING', 'DOCS', 'CONTACT'].map(link => (
            <li key={link}>
              <a href={`#${link.toLowerCase().replace(' ', '-')}`}>{link}</a>
            </li>
          ))}
        </ul>

        {/* Sign In Button */}
        <a href="#contact" className="btn-signin">SIGN IN</a>
      </div>
    </nav>
  )
}
