"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { connectWallet, reconnectWallet, disconnectWallet } from '../services/wallet'
import useStore from '../store/useStore'
import { issueKyteToken } from '../services/kyteApi'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const { walletAddress, setWalletAddress, setJwtToken, logout } = useStore()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll)
    
    // Auto reconnect
    reconnectWallet().then(address => {
        if (address) setWalletAddress(address)
    })

    return () => window.removeEventListener('scroll', onScroll)
  }, [setWalletAddress])

  const handleConnect = async () => {
    if (walletAddress) {
        await disconnectWallet()
        logout()
    } else {
        const address = await connectWallet()
        if (address) {
            setWalletAddress(address)
            try {
                const token = await issueKyteToken(address)
                setJwtToken(token)
            } catch (e) {
                console.error("Auth failed", e)
            }
        }
    }
  }

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="navbar-inner container">
        {/* Logo */}
        <Link href="/" className="wavenet-logo">
          <span className="logo-wave">KYTE</span>
        </Link>

        {/* Center Nav Links */}
        <ul className="navbar-links">
          {['ABOUT US', 'FEATURES', 'PRICING', 'DOCS', 'CONTACT'].map(link => (
            <li key={link}>
              <a href={`#${link.toLowerCase().replace(' ', '-')}`}>{link}</a>
            </li>
          ))}
        </ul>

        {/* Wallet / Sign In Button */}
        <div className="navbar-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button onClick={handleConnect} className="btn-signin" style={{ fontSize: '0.8rem' }}>
                {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "CONNECT WALLET"}
            </button>
            {!walletAddress && (
                <Link href="/signin" className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>SIGN IN</Link>
            )}
        </div>
      </div>
    </nav>
  )
}
