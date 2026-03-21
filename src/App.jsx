import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Features from './components/Features'
import Stats from './components/Stats'
import Clients from './components/Clients'
import Services from './components/Services'
import Projects from './components/Projects'
import FAQ from './components/FAQ'
import Blog from './components/Blog'
import Footer from './components/Footer'
import SignIn from './components/SignIn'
import Verify from './components/Verify'
import Dashboard from './components/Dashboard'

function LandingPage() {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <Stats />
      <Clients />
      <Services />
      <Projects />
      <FAQ />
      <Blog />
      <Footer />
    </>
  )
}

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </div>
  )
}

export default App
