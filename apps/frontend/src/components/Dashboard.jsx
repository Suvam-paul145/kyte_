"use client"
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import useStore from "../store/useStore";
import Navbar from "./Navbar";
import Footer from "./Footer";
import {
  createProject,
  getProjectReport,
  getProjectStatus,
  submitProject,
} from "../services/kyteApi";
import { CheckCircle2, XCircle, AlertCircle, Github, ExternalLink, Zap, Shield, Search } from "lucide-react";
import confetti from "canvas-confetti";

export default function Dashboard() {
  const router = useRouter();
  const { walletAddress, jwtToken } = useStore();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [evaluation, setEvaluation] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [view, setView] = useState("discover"); // discover, manage, details

  // Mock initial projects if none exist
  useEffect(() => {
    if (!walletAddress) {
       // Optional: Redirect or show restricted view
    }
  }, [walletAddress]);

  const handleCreateDemoProject = async () => {
    setLoading(true);
    try {
      const result = await createProject(jwtToken, {
        title: "Algorand Smart Contract Audit",
        description: "Audit the provided PyTeal contract for security vulnerabilities.",
        requirements: [
          "Check for reentrancy issues",
          "Verify permission checks on DeleteApplication",
          "Ensure global state is updated correctly",
          "Max 1000 lines of code"
        ],
        payment_algo: 10.5,
        score_threshold: 80,
      });
      setProjects([...projects, result]);
      setActiveProjectId(result.project_id);
      setView("details");
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!submissionUrl) return;
    setEvaluating(true);
    setEvaluation(null);
    try {
      const result = await submitProject(jwtToken, {
        project_id: activeProjectId,
        submission_url: submissionUrl,
      });
      setEvaluation(result);
      if (result.overall_score >= 80) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#66d3ff', '#759aff', '#ffffff']
        });
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setEvaluating(false);
    }
  };

  const activeProject = projects.find(p => p.project_id === activeProjectId);

  return (
    <div className="dashboard-root" style={{ minHeight: "100vh", background: "#060912", color: "#fff" }}>
      <Navbar />
      
      <main className="container" style={{ padding: "8rem 1rem 4rem" }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
            <div>
                <motion.p 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="signin-eyebrow" style={{ color: "var(--primary)", marginBottom: '0.5rem' }}
                >
                    {walletAddress ? "Connected to Algorand TestNet" : "Connect wallet to participate"}
                </motion.p>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Dashboard</h1>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={() => setView("discover")}
                  className={`btn-${view === "discover" ? "primary" : "secondary"}`}
                  style={{ fontSize: '0.85rem' }}
                >
                  Discover
                </button>
                <button 
                  onClick={() => setView("manage")}
                  className={`btn-${view === "manage" ? "primary" : "secondary"}`}
                  style={{ fontSize: '0.85rem' }}
                >
                  My Projects
                </button>
            </div>
        </div>

        {/* Discover View */}
        {view === "discover" && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                <motion.div 
                    whileHover={{ y: -5 }}
                    className="glass-card" 
                    style={{ padding: '2rem', border: '1px dashed rgba(102, 211, 255, 0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', cursor: 'pointer' }}
                    onClick={handleCreateDemoProject}
                >
                    <div className="signin-card-icon" style={{ marginBottom: '1rem' }}>
                        <Zap size={24} color="#66d3ff" />
                    </div>
                    <h3>Post New Project</h3>
                    <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem' }}>Lock funds in escrow and set requirements</p>
                </motion.div>

                {projects.map((p, i) => (
                    <motion.div 
                        key={p.project_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-card" 
                        style={{ padding: '1.5rem', position: 'relative' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'rgba(102, 211, 255, 0.1)', color: '#66d3ff' }}>
                                OPEN
                            </span>
                            <span style={{ fontWeight: 700, color: '#66d3ff' }}>{p.payment_algo} ALGO</span>
                        </div>
                        <h3 style={{ marginBottom: '0.5rem' }}>{p.title}</h3>
                        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem', lineClamp: 2, overflow: 'hidden' }}>
                            {p.description}
                        </p>
                        <button 
                            className="btn-primary" 
                            style={{ width: '100%', fontSize: '0.8rem' }}
                            onClick={() => { setActiveProjectId(p.project_id); setView("details"); }}
                        >
                            View Details
                        </button>
                    </motion.div>
                ))}
            </div>
        )}

        {/* Details View */}
        {view === "details" && activeProject && (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div>
                    <button onClick={() => setView("discover")} style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>
                        ← Back to discover
                    </button>
                    <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{activeProject.title}</h2>
                    <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: '2rem' }}>{activeProject.description}</p>
                    
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <h4 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                           <Shield size={18} color="#66d3ff" /> AI Enforcement Policy
                        </h4>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {activeProject.requirements.map((req, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#66d3ff' }} />
                                    <span style={{ fontSize: '0.95rem' }}>{req}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <h4 style={{ marginBottom: '1rem' }}>Escrow Status</h4>
                        <div style={{ padding: '1rem', background: 'rgba(74, 222, 128, 0.1)', borderRadius: '8px', border: '1px solid rgba(74, 222, 128, 0.2)', marginBottom: '1rem' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4ade80' }}>{activeProject.payment_algo} ALGO</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Locked on TestNet</div>
                        </div>
                        <div style={{ fontSize: '0.85rem', opacity: 0.6 }}>
                            App ID: {activeProject.app_id}
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <h4 style={{ marginBottom: '1rem' }}>Submit Work</h4>
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            <div style={{ position: 'relative' }}>
                                <Github style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} size={16} />
                                <input 
                                    className="signin-input" 
                                    placeholder="GitHub URL" 
                                    style={{ paddingLeft: '2.5rem', fontSize: '0.85rem' }} 
                                    value={submissionUrl}
                                    onChange={(e) => setSubmissionUrl(e.target.value)}
                                />
                            </div>
                            <button 
                                className="btn-primary" 
                                disabled={evaluating || !submissionUrl}
                                onClick={handleSubmit}
                            >
                                {evaluating ? "AI AUDITING..." : "SUBMIT FOR REVIEW"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Evaluation Results Overlay */}
        <AnimatePresence>
            {evaluating && (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(6, 9, 18, 0.9)', zIndex: 100, display: 'grid', placeItems: 'center', backdropFilter: 'blur(10px)' }}
                >
                    <div style={{ textAlign: 'center' }}>
                        <div className="signin-spinner" style={{ width: '60px', height: '60px', margin: '0 auto 2rem' }} />
                        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Gemini 1.5 Flash Auditing...</h2>
                        <p style={{ opacity: 0.6 }}>Scanning code against {activeProject?.requirements.length} requirements</p>
                    </div>
                </motion.div>
            )}

            {evaluation && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(6, 9, 18, 0.95)', zIndex: 101, display: 'grid', placeItems: 'center', padding: '2rem', overflowY: 'auto' }}
                >
                    <div className="glass-card" style={{ maxWidth: '800px', width: '100%', padding: '3rem', position: 'relative' }}>
                        <button 
                            onClick={() => setEvaluation(null)}
                            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
                        >
                            <XCircle size={24} opacity={0.5} />
                        </button>

                        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                            <div style={{ 
                                width: '120px', height: '120px', borderRadius: '50%', border: `8px solid ${evaluation.overall_score >= 80 ? '#4ade80' : '#f87171'}`,
                                display: 'grid', placeItems: 'center', margin: '0 auto 1.5rem', fontSize: '2.5rem', fontWeight: 900
                            }}>
                                {evaluation.overall_score}
                            </div>
                            <h2 style={{ fontSize: '2rem' }}>
                                {evaluation.overall_score >= 80 ? "Audit Passed!" : "Audit Failed"}
                            </h2>
                            <p style={{ opacity: 0.6, marginTop: '0.5rem' }}>
                                {evaluation.overall_score >= 80 ? "Payment scheduled for release" : "Requirements were not fully met"}
                            </p>
                        </div>

                        <div style={{ display: 'grid', gap: '1rem', marginBottom: '3rem' }}>
                            {evaluation.results.map((res, i) => (
                                <div key={i} style={{ display: 'flex', gap: '1rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', alignItems: 'flex-start' }}>
                                    {res.met ? <CheckCircle2 color="#4ade80" size={20} /> : <AlertCircle color="#f87171" size={20} />}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                            <span style={{ fontWeight: 600 }}>{res.requirement}</span>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{res.score}/100</span>
                                        </div>
                                        <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>{res.reason}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {evaluation.gap_report && (
                            <div style={{ padding: '1.5rem', background: 'rgba(248, 113, 113, 0.1)', borderRadius: '12px', border: '1px solid rgba(248, 113, 113, 0.2)' }}>
                                <h4 style={{ color: '#f87171', marginBottom: '0.5rem' }}>Gap Report</h4>
                                <p style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{evaluation.gap_report}</p>
                            </div>
                        )}

                        <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem' }}>
                            {evaluation.overall_score >= 80 ? (
                                <button className="btn-primary" style={{ flex: 1 }} onClick={() => setEvaluation(null)}>
                                    RECOVER PAYMENT
                                </button>
                            ) : (
                                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setEvaluation(null)}>
                                    REVISE SUBMISSION
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

      </main>

      <Footer />
    </div>
  );
}
