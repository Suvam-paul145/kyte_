import React from 'react'

const posts = [
  {
    emoji: '🔐',
    date: 'Mar 15, 2025',
    title: 'Zero-Trust Architecture: The Future of Enterprise Security',
    excerpt: 'How modern organisations are eliminating implicit trust and verifying every access request...',
    readTime: '5 min read'
  },
  {
    emoji: '🤖',
    date: 'Mar 8, 2025',
    title: 'MLOps in 2025: Scaling Machine Learning to Production',
    excerpt: 'Best practices for building robust ML pipelines that scale reliably in production environments...',
    readTime: '7 min read'
  },
  {
    emoji: '☁️',
    date: 'Feb 28, 2025',
    title: 'Multi-Cloud Strategy: Avoiding Vendor Lock-In',
    excerpt: 'Why leading enterprises are adopting multi-cloud approaches and how to implement them effectively...',
    readTime: '6 min read'
  }
]

export default function Blog() {
  return (
    <section className="blog" id="blog">
      <div className="container">
        <p className="section-label" style={{textAlign:'center', color:'#0066ff'}}>Insights & Innovations</p>
        <h2>From Our <span style={{background:'linear-gradient(135deg,#00c9ff,#0066ff)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text'}}>Blog</span></h2>
        <p className="blog-subtitle">Technical insights, industry trends, and best practices from our engineering team.</p>
        <div className="blog-grid">
          {posts.map((p, i) => (
            <article className="blog-card" key={i}>
              <div className="blog-img">{p.emoji}</div>
              <div className="blog-body">
                <div className="blog-meta">{p.date} · {p.readTime}</div>
                <h3>{p.title}</h3>
                <p style={{fontSize:'0.8rem', color:'#5a5f7a', marginBottom:'1rem', lineHeight:'1.6'}}>{p.excerpt}</p>
                <a href="#blog" className="blog-link">Read More →</a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
