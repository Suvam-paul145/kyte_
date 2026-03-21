import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "../supabaseClient";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/signin");
      } else {
        setUser(user);
      }
      setLoading(false);
    };

    void loadUser();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="signin-page" style={{ display: 'grid', placeItems: 'center' }}>
        <div className="signin-spinner" style={{ width: '40px', height: '40px' }} />
      </div>
    );
  }

  const avatarUrl = user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user?.email}&background=11192b&color=66d3ff`;
  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'Kyte Developer';

  return (
    <div className="app" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#0a0e1a" }}>
      <Navbar />
      
      <main style={{ flex: 1, padding: "8rem 2rem 4rem", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3rem" }}>
            <div>
              <p className="section-label" style={{ marginBottom: "0.5rem" }}>Developer Portal</p>
              <h1 style={{ fontSize: "2.5rem", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: "#fff" }}>
                Dashboard
              </h1>
            </div>
            <button 
              onClick={handleSignOut}
              className="btn-secondary" 
              style={{ padding: "0.5rem 1.2rem", fontSize: "0.85rem", height: "fit-content" }}
            >
              Sign Out
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2rem" }}>
            {/* Left Column - Profile */}
            <div className="glass-card" style={{ padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", height: "fit-content" }}>
              <div style={{ position: "relative", marginBottom: "1.5rem" }}>
                <img 
                  src={avatarUrl} 
                  alt="Profile" 
                  style={{ width: "96px", height: "96px", borderRadius: "50%", border: "2px solid rgba(102, 211, 255, 0.3)", padding: "4px", background: "#0a0e1a" }} 
                />
                <div style={{ position: "absolute", bottom: "4px", right: "4px", width: "16px", height: "16px", background: "#4ade80", borderRadius: "50%", border: "3px solid #0a0e1a" }} />
              </div>
              <h2 style={{ fontSize: "1.25rem", color: "#fff", marginBottom: "0.25rem" }}>{fullName}</h2>
              <p style={{ color: "var(--on-surface-variant)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>{user?.email}</p>
              
              <div style={{ width: "100%", height: "1px", background: "rgba(68,71,86,0.2)", margin: "1rem 0" }} />
              
              <div style={{ width: "100%", display: "flex", justifyContent: "space-between", fontSize: "0.85rem", padding: "0.5rem 0" }}>
                <span style={{ color: "var(--on-surface-variant)" }}>Account Status</span>
                <span style={{ color: "#4ade80", fontWeight: 600 }}>Active</span>
              </div>
              <div style={{ width: "100%", display: "flex", justifyContent: "space-between", fontSize: "0.85rem", padding: "0.5rem 0" }}>
                <span style={{ color: "var(--on-surface-variant)" }}>Auth Provider</span>
                <span style={{ color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <svg width="14" height="14" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                  </svg>
                  Google
                </span>
              </div>
            </div>

            {/* Right Column - Workspaces & CLI */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {/* CLI Status Card */}
              <div className="glass-card" style={{ padding: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                  <h3 style={{ fontSize: "1.1rem", color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="4 17 10 11 4 5"></polyline>
                      <line x1="12" y1="19" x2="20" y2="19"></line>
                    </svg>
                    Terminal Link
                  </h3>
                  <span style={{ fontSize: "0.75rem", background: "rgba(102, 211, 255, 0.1)", color: "var(--primary)", padding: "0.3rem 0.8rem", borderRadius: "99px", fontWeight: 600 }}>Active Connection</span>
                </div>
                <p style={{ fontSize: "0.9rem", color: "var(--on-surface-variant)", marginBottom: "1.5rem" }}>
                  Your web account is ready to accept commands from the Kyte CLI. You can now execute commands locally that will sync with this account.
                </p>
                <div style={{ background: "#0a0e1a", border: "1px solid rgba(123, 145, 195, 0.15)", borderRadius: "0.5rem", padding: "1rem", fontFamily: "monospace", fontSize: "0.85rem", color: "#a6badc" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                    <span style={{ color: "#4ade80" }}>➜</span>
                    <span style={{ color: "#66d3ff" }}>kyte</span>
                    <span style={{ color: "#fff" }}>run --agent auto "Build my auth system"</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ color: "transparent" }}>➜</span>
                    <span style={{ opacity: 0.7 }}>Agent connected and executing tasks...</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity Card */}
              <div className="glass-card" style={{ padding: "2rem" }}>
                <h3 style={{ fontSize: "1.1rem", color: "#fff", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                  Recent Activity
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "flex", gap: "1rem", paddingBottom: "1rem", borderBottom: "1px solid rgba(68,71,86,0.15)" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "0.5rem", background: "rgba(102, 211, 255, 0.1)", color: "var(--primary)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>
                    <div>
                      <p style={{ color: "#fff", fontSize: "0.9rem", fontWeight: 500 }}>Account created & verified</p>
                      <p style={{ color: "var(--on-surface-variant)", fontSize: "0.8rem", marginTop: "0.2rem" }}>Just now via Google Auth</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "0.5rem", background: "rgba(255, 255, 255, 0.05)", color: "var(--on-surface-variant)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </div>
                    <div>
                      <p style={{ color: "var(--on-surface-variant)", fontSize: "0.9rem", fontWeight: 500 }}>Awaiting first CLI command</p>
                      <p style={{ color: "rgba(166, 186, 220, 0.5)", fontSize: "0.8rem", marginTop: "0.2rem" }}>Run `kyte` in your terminal to begin</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
