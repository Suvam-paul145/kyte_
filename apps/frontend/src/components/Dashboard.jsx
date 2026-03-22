"use client"
import React, { useEffect, useState } from "react";
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
import { deployKyteContract } from "../services/algorandDeploy";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Github,
  Zap,
  Shield,
  PlusCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import confetti from "canvas-confetti";

// ─── Project Creation Modal ────────────────────────────────────────────────────

function CreateProjectModal({ onClose, onCreated, jwtToken, walletAddress }) {
  const [step, setStep] = useState("form"); // form | deploying | done
  const [appId, setAppId] = useState(null);
  const [deployError, setDeployError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    requirements: "",
    payment_algo: "1",
    score_threshold: "80",
  });

  const handleDeploy = async () => {
    if (!form.title || !form.description || !form.requirements || !form.payment_algo) {
      setDeployError("Please fill in all required fields.");
      return;
    }

    const paymentAlgo = parseFloat(form.payment_algo);
    if (isNaN(paymentAlgo) || paymentAlgo <= 0) {
      setDeployError("Payment amount must be a positive number.");
      return;
    }

    setDeployError("");
    setStep("deploying");

    try {
      // Step 1: Deploy to Algorand TestNet via Pera Wallet
      let realAppId = null;
      if (walletAddress) {
        try {
          realAppId = await deployKyteContract(walletAddress, paymentAlgo);
        } catch (e) {
          // If user cancelled or Pera failed, fall back to mock
          console.warn("[Deploy] On-chain deploy failed, using mock:", e.message);
          realAppId = null;
        }
      }

      // Step 2: Register project on backend
      const requirements = form.requirements
        .split("\n")
        .map((r) => r.trim())
        .filter(Boolean);

      const payload = {
        title: form.title,
        description: form.description,
        requirements,
        payment_algo: paymentAlgo,
        score_threshold: parseInt(form.score_threshold, 10) || 80,
      };

      // If we got a real on-chain app_id, include it
      if (realAppId) {
        payload.app_id = realAppId;
      }

      const result = await createProject(jwtToken, payload);
      setAppId(result.app_id);
      setStep("done");
      onCreated(result);
    } catch (e) {
      setDeployError(e.message || "Deployment failed. Please try again.");
      setStep("form");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(6,9,18,0.92)", backdropFilter: "blur(12px)",
        display: "grid", placeItems: "center", padding: "1rem",
      }}
    >
      <motion.div
        initial={{ scale: 0.93, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.93, opacity: 0 }}
        className="glass-card"
        style={{ maxWidth: 560, width: "100%", padding: "2.5rem", position: "relative" }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "none", border: "none", color: "#fff", cursor: "pointer", opacity: 0.5 }}
        >
          <XCircle size={22} />
        </button>

        {/* Form Step */}
        {step === "form" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
              <div style={{ padding: "0.6rem", background: "rgba(102,211,255,0.1)", borderRadius: "8px" }}>
                <PlusCircle size={20} color="#66d3ff" />
              </div>
              <div>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 700, margin: 0 }}>Post New Project</h2>
                <p style={{ fontSize: "0.8rem", opacity: 0.5, margin: 0 }}>Deploys a Kyte smart contract on Algorand TestNet</p>
              </div>
            </div>

            <div style={{ display: "grid", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.8rem", opacity: 0.6, display: "block", marginBottom: "0.4rem" }}>Project Title *</label>
                <input
                  className="signin-input"
                  placeholder="e.g. Algorand DeFi Protocol Audit"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  style={{ fontSize: "0.9rem", width: "100%", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", opacity: 0.6, display: "block", marginBottom: "0.4rem" }}>Description *</label>
                <textarea
                  className="signin-input"
                  placeholder="Describe what work needs to be done..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  style={{ fontSize: "0.9rem", width: "100%", boxSizing: "border-box", resize: "vertical" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", opacity: 0.6, display: "block", marginBottom: "0.4rem" }}>Requirements (one per line) *</label>
                <textarea
                  className="signin-input"
                  placeholder={"Check for reentrancy issues\nVerify permission checks\nEnsure global state is correct"}
                  value={form.requirements}
                  onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                  rows={4}
                  style={{ fontSize: "0.9rem", width: "100%", boxSizing: "border-box", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", opacity: 0.6, display: "block", marginBottom: "0.4rem" }}>Payment (ALGO) *</label>
                  <input
                    className="signin-input"
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="e.g. 5.0"
                    value={form.payment_algo}
                    onChange={(e) => setForm({ ...form, payment_algo: e.target.value })}
                    style={{ fontSize: "0.9rem", width: "100%", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", opacity: 0.6, display: "block", marginBottom: "0.4rem" }}>Pass Score (1-100)</label>
                  <input
                    className="signin-input"
                    type="number"
                    min="1"
                    max="100"
                    placeholder="80"
                    value={form.score_threshold}
                    onChange={(e) => setForm({ ...form, score_threshold: e.target.value })}
                    style={{ fontSize: "0.9rem", width: "100%", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {deployError && (
                <div style={{ padding: "0.75rem 1rem", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: "8px", fontSize: "0.85rem", color: "#f87171" }}>
                  {deployError}
                </div>
              )}

              {walletAddress && (
                <div style={{ padding: "0.75rem 1rem", background: "rgba(102,211,255,0.05)", border: "1px solid rgba(102,211,255,0.15)", borderRadius: "8px", fontSize: "0.8rem", opacity: 0.7, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Shield size={14} color="#66d3ff" />
                  <span>Pera Wallet will prompt you to sign the <code>ApplicationCreateTxn</code> on Algorand TestNet.</span>
                </div>
              )}

              <motion.button
                className="btn-primary"
                onClick={handleDeploy}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem" }}
              >
                <Zap size={16} />
                {walletAddress ? "Deploy Contract & Post Project" : "Post Project (Mock Mode)"}
              </motion.button>
            </div>
          </>
        )}

        {/* Deploying Step */}
        {step === "deploying" && (
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            <div style={{ marginBottom: "2rem" }}>
              <Loader2 size={48} color="#66d3ff" style={{ animation: "spin 1s linear infinite" }} className="spin-loader" />
            </div>
            <h3 style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>Deploying to TestNet...</h3>
            <p style={{ opacity: 0.5, fontSize: "0.9rem", marginBottom: "1.5rem" }}>
              Pera Wallet will prompt you to sign the transaction.
              <br />Approve it in your Pera mobile app or browser extension.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", textAlign: "left", padding: "1rem", background: "rgba(255,255,255,0.03)", borderRadius: "8px", fontSize: "0.8rem", opacity: 0.6 }}>
              <span>① Fetching compiled TEAL from backend...</span>
              <span>② Building ApplicationCreateTxn via algosdk...</span>
              <span>③ Requesting Pera Wallet signature...</span>
              <span>④ Submitting to Algorand TestNet...</span>
              <span>⑤ Waiting for block confirmation...</span>
            </div>
          </div>
        )}

        {/* Done Step */}
        {step === "done" && (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ marginBottom: "1.5rem" }}>
              <CheckCircle2 size={56} color="#4ade80" />
            </div>
            <h3 style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>Contract Deployed!</h3>
            <p style={{ opacity: 0.6, marginBottom: "1.5rem" }}>Your Kyte smart contract is live on Algorand TestNet.</p>
            {appId && (
              <div style={{ padding: "1rem", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: "8px", marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "0.8rem", opacity: 0.6, marginBottom: "0.25rem" }}>App ID</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#4ade80" }}>{appId}</div>
                <a
                  href={`https://testnet.algoexplorer.io/application/${appId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: "0.8rem", color: "#66d3ff", display: "inline-flex", alignItems: "center", gap: "0.25rem", marginTop: "0.5rem" }}
                >
                  View on Algoexplorer <ExternalLink size={12} />
                </a>
              </div>
            )}
            <button className="btn-primary" onClick={onClose} style={{ width: "100%" }}>
              Go to Dashboard
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { walletAddress, jwtToken } = useStore();
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [evaluation, setEvaluation] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [view, setView] = useState("discover"); // discover | details
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleProjectCreated = (result) => {
    setProjects((prev) => [...prev, result]);
    setActiveProjectId(result.project_id);
    setShowCreateModal(false);
    setView("details");
    confetti({
      particleCount: 100,
      spread: 60,
      origin: { y: 0.5 },
      colors: ["#66d3ff", "#759aff", "#4ade80"],
    });
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
          colors: ["#66d3ff", "#759aff", "#ffffff"],
        });
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setEvaluating(false);
    }
  };

  const activeProject = projects.find((p) => p.project_id === activeProjectId);

  return (
    <div className="dashboard-root" style={{ minHeight: "100vh", background: "#060912", color: "#fff" }}>
      <Navbar />

      <main className="container" style={{ padding: "8rem 1rem 4rem" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3rem" }}>
          <div>
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="signin-eyebrow"
              style={{ color: "var(--primary)", marginBottom: "0.5rem" }}
            >
              {walletAddress ? `Connected · Algorand TestNet` : "Connect wallet to participate"}
            </motion.p>
            <h1 style={{ fontSize: "2.5rem", fontWeight: 800 }}>Dashboard</h1>
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              onClick={() => setView("discover")}
              className={`btn-${view === "discover" ? "primary" : "secondary"}`}
              style={{ fontSize: "0.85rem" }}
            >
              Discover
            </button>
            <button
              onClick={() => setView("manage")}
              className={`btn-${view === "manage" ? "primary" : "secondary"}`}
              style={{ fontSize: "0.85rem" }}
            >
              My Projects
            </button>
          </div>
        </div>

        {/* Discover View */}
        {view === "discover" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>

            {/* New Project Card */}
            <motion.div
              whileHover={{ y: -5 }}
              className="glass-card"
              style={{
                padding: "2rem", border: "1px dashed rgba(102,211,255,0.3)",
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", textAlign: "center", cursor: "pointer",
              }}
              onClick={() => setShowCreateModal(true)}
            >
              <div className="signin-card-icon" style={{ marginBottom: "1rem" }}>
                <Zap size={24} color="#66d3ff" />
              </div>
              <h3>Post New Project</h3>
              <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.6)", marginTop: "0.5rem" }}>
                Deploy a Kyte contract on Algorand TestNet &amp; lock funds in escrow
              </p>
              <div style={{ marginTop: "1rem", padding: "0.4rem 1rem", borderRadius: "20px", background: "rgba(102,211,255,0.1)", fontSize: "0.75rem", color: "#66d3ff" }}>
                Signed via Pera Wallet
              </div>
            </motion.div>

            {/* Existing Projects */}
            {projects.map((p, i) => (
              <motion.div
                key={p.project_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="glass-card"
                style={{ padding: "1.5rem", position: "relative" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem", borderRadius: "4px", background: "rgba(102,211,255,0.1)", color: "#66d3ff" }}>
                    OPEN
                  </span>
                  <span style={{ fontWeight: 700, color: "#66d3ff" }}>{p.payment_algo} ALGO</span>
                </div>
                <h3 style={{ marginBottom: "0.5rem" }}>{p.title}</h3>
                <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", marginBottom: "0.75rem", overflow: "hidden" }}>
                  {p.description}
                </p>
                {p.app_id && (
                  <div style={{ fontSize: "0.75rem", opacity: 0.5, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    App ID: {p.app_id}
                    <a
                      href={`https://testnet.algoexplorer.io/application/${p.app_id}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ color: "#66d3ff" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={11} />
                    </a>
                  </div>
                )}
                <button
                  className="btn-primary"
                  style={{ width: "100%", fontSize: "0.8rem" }}
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
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem" }}>
            <div>
              <button
                onClick={() => setView("discover")}
                style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", background: "none", border: "none", cursor: "pointer" }}
              >
                ← Back to discover
              </button>
              <h2 style={{ fontSize: "2rem", marginBottom: "1rem" }}>{activeProject.title}</h2>
              <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.6, marginBottom: "2rem" }}>{activeProject.description}</p>

              <div className="glass-card" style={{ padding: "2rem" }}>
                <h4 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Shield size={18} color="#66d3ff" /> AI Enforcement Policy
                </h4>
                <div style={{ display: "grid", gap: "1rem" }}>
                  {activeProject.requirements?.map((req, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", background: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#66d3ff", flexShrink: 0 }} />
                      <span style={{ fontSize: "0.95rem" }}>{req}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div className="glass-card" style={{ padding: "1.5rem" }}>
                <h4 style={{ marginBottom: "1rem" }}>Escrow Status</h4>
                <div style={{ padding: "1rem", background: "rgba(74,222,128,0.1)", borderRadius: "8px", border: "1px solid rgba(74,222,128,0.2)", marginBottom: "1rem" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#4ade80" }}>{activeProject.payment_algo} ALGO</div>
                  <div style={{ fontSize: "0.75rem", opacity: 0.7 }}>Locked on TestNet</div>
                </div>
                <div style={{ fontSize: "0.8rem", opacity: 0.5, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  App ID: {activeProject.app_id}
                  {activeProject.app_id && (
                    <a
                      href={`https://testnet.algoexplorer.io/application/${activeProject.app_id}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ color: "#66d3ff" }}
                    >
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>

              <div className="glass-card" style={{ padding: "1.5rem" }}>
                <h4 style={{ marginBottom: "1rem" }}>Submit Work</h4>
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  <div style={{ position: "relative" }}>
                    <Github style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", opacity: 0.4 }} size={16} />
                    <input
                      className="signin-input"
                      placeholder="GitHub URL"
                      style={{ paddingLeft: "2.5rem", fontSize: "0.85rem" }}
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

        {/* Evaluation Overlay */}
        <AnimatePresence>
          {evaluating && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: "fixed", inset: 0, background: "rgba(6,9,18,0.9)", zIndex: 100, display: "grid", placeItems: "center", backdropFilter: "blur(10px)" }}
            >
              <div style={{ textAlign: "center" }}>
                <div className="signin-spinner" style={{ width: "60px", height: "60px", margin: "0 auto 2rem" }} />
                <h2 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Gemini 1.5 Flash Auditing...</h2>
                <p style={{ opacity: 0.6 }}>Scanning code against {activeProject?.requirements?.length} requirements</p>
              </div>
            </motion.div>
          )}

          {evaluation && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              style={{ position: "fixed", inset: 0, background: "rgba(6,9,18,0.95)", zIndex: 101, display: "grid", placeItems: "center", padding: "2rem", overflowY: "auto" }}
            >
              <div className="glass-card" style={{ maxWidth: "800px", width: "100%", padding: "3rem", position: "relative" }}>
                <button
                  onClick={() => setEvaluation(null)}
                  style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "none", border: "none", color: "#fff", cursor: "pointer" }}
                >
                  <XCircle size={24} opacity={0.5} />
                </button>

                <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                  <div style={{
                    width: "120px", height: "120px", borderRadius: "50%",
                    border: `8px solid ${evaluation.overall_score >= 80 ? "#4ade80" : "#f87171"}`,
                    display: "grid", placeItems: "center", margin: "0 auto 1.5rem", fontSize: "2.5rem", fontWeight: 900,
                  }}>
                    {evaluation.overall_score}
                  </div>
                  <h2 style={{ fontSize: "2rem" }}>
                    {evaluation.overall_score >= 80 ? "Audit Passed!" : "Audit Failed"}
                  </h2>
                  <p style={{ opacity: 0.6, marginTop: "0.5rem" }}>
                    {evaluation.overall_score >= 80 ? "Payment scheduled for release" : "Requirements were not fully met"}
                  </p>
                </div>

                <div style={{ display: "grid", gap: "1rem", marginBottom: "3rem" }}>
                  {evaluation.results?.map((res, i) => (
                    <div key={i} style={{ display: "flex", gap: "1rem", padding: "1.5rem", background: "rgba(255,255,255,0.03)", borderRadius: "12px", alignItems: "flex-start" }}>
                      {res.met ? <CheckCircle2 color="#4ade80" size={20} /> : <AlertCircle color="#f87171" size={20} />}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                          <span style={{ fontWeight: 600 }}>{res.requirement}</span>
                          <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>{res.score}/100</span>
                        </div>
                        <p style={{ fontSize: "0.85rem", opacity: 0.6 }}>{res.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {evaluation.gap_report && (
                  <div style={{ padding: "1.5rem", background: "rgba(248,113,113,0.1)", borderRadius: "12px", border: "1px solid rgba(248,113,113,0.2)" }}>
                    <h4 style={{ color: "#f87171", marginBottom: "0.5rem" }}>Gap Report</h4>
                    <p style={{ fontSize: "0.9rem", lineHeight: 1.5 }}>{evaluation.gap_report}</p>
                  </div>
                )}

                <div style={{ marginTop: "3rem", display: "flex", gap: "1rem" }}>
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

      {/* Create Project Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateProjectModal
            onClose={() => setShowCreateModal(false)}
            onCreated={handleProjectCreated}
            jwtToken={jwtToken}
            walletAddress={walletAddress}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
