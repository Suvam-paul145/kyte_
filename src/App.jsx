import React from 'react'
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

function App() {
  return (
    <div className="app">
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
    </div>
  )
}

export default App
