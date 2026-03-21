"use client"
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { Link, useNavigate as useRouter } from "react-router-dom";

export default function SignIn() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });
    if (error) {
      console.error('Error signing in:', error.message);
      setErrorMessage(error.message || 'Unable to sign in. Please try again.');
      setIsLoading(false);
      return;
    }
    setIsLoading(false);
  };

  return (
    <div className="signin-page">
      {/* Dynamic cursor glow */}
      <div
        className="signin-cursor-glow"
        style={{
          left: mousePos.x,
          top: mousePos.y,
        }}
      />

      {/* Ambient background orbs */}
      <div className="signin-orb signin-orb-1" />
      <div className="signin-orb signin-orb-2" />
      <div className="signin-orb signin-orb-3" />

      {/* Dot grid overlay */}
      <div className="signin-dot-grid" />

      {/* Split layout */}
      <div className="signin-layout">

        {/* ── Left Panel ── */}
        <motion.div
          className="signin-left"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {/* Brand */}
          <div className="signin-brand">
            <div className="signin-brand-mark">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L18 7V13L10 18L2 13V7L10 2Z" fill="url(#hexGrad)" />
                <defs>
                  <linearGradient id="hexGrad" x1="2" y1="2" x2="18" y2="18">
                    <stop stopColor="#66d3ff" />
                    <stop offset="1" stopColor="#759aff" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="signin-brand-name">
              <span>Optivus</span>
              <span className="signin-brand-accent"> Kyte</span>
            </span>
          </div>

          {/* Headline */}
          <div className="signin-left-content">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <p className="signin-eyebrow">Trusted by professionals</p>
              <h1 className="signin-hero-title">
                Build Your Product
                <br />
                <span className="signin-gradient-text">perfectly secured.</span>
              </h1>
              <p className="signin-hero-sub">
                AI-powered proctoring, real-time analytics, and seamless candidate management — all in one platform.
              </p>
            </motion.div>

            {/* Feature pills */}
            <motion.div
              className="signin-features"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7 }}
            >
              {[
                { icon: '🛡️', label: 'AI Proctoring' },
                { icon: '📊', label: 'Live Analytics' },
                { icon: '🔐', label: 'Zero Trust Security' },
              ].map((f, i) => (
                <div key={i} className="signin-feature-pill">
                  <span>{f.icon}</span>
                  <span>{f.label}</span>
                </div>
              ))}
            </motion.div>

            {/* Floating stat cards */}
            <motion.div
              className="signin-stats-row"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              {[
                { num: '50K+', lbl: 'Exams Conducted' },
                { num: '99.9%', lbl: 'Uptime SLA' },
                { num: '4.9★', lbl: 'User Rating' },
              ].map((s, i) => (
                <div key={i} className="signin-stat-chip">
                  <span className="signin-stat-num">{s.num}</span>
                  <span className="signin-stat-lbl">{s.lbl}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* ── Right Panel (Card) ── */}
        <div className="signin-right">
          <motion.div
            className="signin-card"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
          >
            {/* Back button */}
            <button
              className="signin-back-btn"
              onClick={() => router('/')}
              aria-label="Back to home"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Back</span>
            </button>

            {/* Card Header */}
            <div className="signin-card-header">
              <div className="signin-card-icon">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M11 2.75C6.44 2.75 2.75 6.44 2.75 11C2.75 15.56 6.44 19.25 11 19.25C15.56 19.25 19.25 15.56 19.25 11C19.25 6.44 15.56 2.75 11 2.75Z" stroke="url(#iconGrad)" strokeWidth="1.5" />
                  <path d="M11 7.5V11.5L13.5 14" stroke="url(#iconGrad)" strokeWidth="1.5" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="iconGrad" x1="2.75" y1="2.75" x2="19.25" y2="19.25">
                      <stop stopColor="#66d3ff" />
                      <stop offset="1" stopColor="#759aff" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <h2 className="signin-card-title">Welcome back</h2>
              <p className="signin-card-subtitle">Sign in to your Optivus Kyte account</p>
            </div>

            {/* Divider */}
            <div className="signin-divider">
              <span>Continue with</span>
            </div>

            {/* Pera Wallet Button */}
            <motion.button
              className="btn-primary"
              onClick={() => {
                const navBtn = document.querySelector('.navbar .btn-signin')
                if (navBtn) navBtn.click();
              }}
              style={{ width: '100%', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', background: 'linear-gradient(135deg, #1d976c 0%, #93f9b9 100%)', color: '#000', fontWeight: 600 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Shield size={18} />
              <span>Connect Pera Wallet</span>
            </motion.button>

            {/* Google Button */}
            <motion.button
              className="signin-google-btn"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    className="signin-spinner"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                ) : (
                  <motion.div
                    key="content"
                    className="signin-google-btn-inner"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <svg className="signin-google-icon" viewBox="0 0 48 48" aria-hidden="true">
                      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                    </svg>
                    <span>Sign in with Google</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {errorMessage ? (
              <p className="signin-error-message" role="alert">{errorMessage}</p>
            ) : null}

            {/* Security note */}
            <div className="signin-security-note">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M8 1.5L2 4V8.5C2 11.8 4.6 14.9 8 15.5C11.4 14.9 14 11.8 14 8.5V4L8 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                <path d="M5.5 8L7 9.5L10.5 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Secured with OAuth 2.0 &amp; end-to-end encryption</span>
            </div>

            {/* Terms */}
            <p className="signin-terms">
              By continuing, you agree to our{' '}
              <a href="#" className="signin-link">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="signin-link">Privacy Policy</a>.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};


