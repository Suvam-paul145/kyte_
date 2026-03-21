import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const CODE_KEY = "kyte_login_code";

export default function Verify() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const isOAuthReturn = useMemo(() => searchParams.get("oauth") === "1", [searchParams]);
  const urlCode = useMemo(() => searchParams.get("code") || "", [searchParams]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    // If code is in URL, auto-fill it
    if (urlCode) {
      setCode(urlCode);
      localStorage.setItem(CODE_KEY, urlCode);
    } else {
      const existingCode = localStorage.getItem(CODE_KEY);
      if (existingCode) {
        setCode(existingCode);
      }
    }
  }, [urlCode]);

  useEffect(() => {
    const completeAuth = async () => {
      if (!isOAuthReturn) return;

      const storedCode = localStorage.getItem(CODE_KEY);
      if (!storedCode) {
        setError("Missing verification code. Please try the login process again.");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
        
        if (!accessToken) {
          // If no session, wait a bit or check if user exists
          const { data: userData } = await supabase.auth.getUser();
          if (!userData?.user) {
            setLoading(false);
            setError("Session not found. Please sign in with Google again.");
            return;
          }
        }

        const token = accessToken || (await supabase.auth.getSession()).data.session?.access_token;

        const response = await fetch(`${API_BASE_URL}/auth/complete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            code: storedCode,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to link CLI account.");
        }

        // Success! Clean up and go to dashboard
        localStorage.removeItem(CODE_KEY);
        navigate("/dashboard");
      } catch (err) {
        setLoading(false);
        setError(err.message);
      }
    };

    void completeAuth();
  }, [isOAuthReturn, navigate]);


  // Auto-submit if we have a code and the CLI explicitly requested google auth
  const provider = useMemo(() => searchParams.get("provider"), [searchParams]);
  useEffect(() => {
    if (code && provider === "google" && !isOAuthReturn && !loading) {
      const autoSubmit = async () => {
        try {
          // Verify code exists first
          const verifyResponse = await fetch(`${API_BASE_URL}/auth/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
          });
          
          if (!verifyResponse.ok) {
            throw new Error("Invalid or expired code.");
          }
          
          localStorage.setItem(CODE_KEY, code);

          // Auto-trigger Google OAuth wrapper
          const { error: oauthError } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo: `${window.location.origin}/verify?oauth=1`,
            },
          });

          if (oauthError) throw oauthError;
        } catch (err) {
          setError(err.message);
        }
      };
      
      void autoSubmit();
    }
  }, [code, provider, isOAuthReturn, loading]);

  const onContinue = async (event) => {
    event.preventDefault();

    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setError("Please enter the 6-digit code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const verifyResponse = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmedCode }),
      });

      if (!verifyResponse.ok) {
        throw new Error("Invalid or expired code.");
      }

      localStorage.setItem(CODE_KEY, trimmedCode);

      // Trigger Google OAuth
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/verify?oauth=1`,
        },
      });

      if (oauthError) throw oauthError;
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  return (
    <div className="signin-page">
      <div
        className="signin-cursor-glow"
        style={{
          left: mousePos.x,
          top: mousePos.y,
        }}
      />

      <div className="signin-orb signin-orb-1" />
      <div className="signin-orb signin-orb-2" />
      <div className="signin-dot-grid" />

      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "1.5rem", position: "relative", zIndex: 2 }}>
        <motion.div
          className="signin-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ maxWidth: "420px" }}
        >
          <button
            className="signin-back-btn"
            onClick={() => navigate('/')}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Cancel</span>
          </button>

          <div className="signin-card-header">
            <div className="signin-card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <h2 className="signin-card-title">Verify CLI Login</h2>
            <p className="signin-card-subtitle">Link your terminal session with your account</p>
          </div>

          <form onSubmit={onContinue} style={{ marginTop: "1.5rem" }}>
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#8ec9ff", marginBottom: "0.5rem", fontWeight: 600 }}>
                Verification Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABCDEF"
                maxLength={6}
                autoFocus
                style={{
                  width: "100%",
                  padding: "0.85rem",
                  fontSize: "1.1rem",
                  letterSpacing: "0.3em",
                  textAlign: "center",
                  borderRadius: "0.75rem",
                  border: "1px solid rgba(123, 145, 195, 0.3)",
                  background: "rgba(10, 15, 28, 0.6)",
                  color: "#ffffff",
                  outline: "none",
                  fontFamily: "monospace"
                }}
              />
            </div>

            <motion.button
              type="submit"
              className="signin-google-btn"
              disabled={loading || isOAuthReturn}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ background: loading ? "rgba(255,255,255,0.1)" : "var(--gradient-hero)", color: loading ? "#aaa" : "#fff", border: "none" }}
            >
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div key="loader" className="signin-spinner" style={{ borderTopColor: "#fff", borderLeftColor: "rgba(255,255,255,0.2)" }} />
                ) : (
                  <motion.span key="text">{isOAuthReturn ? "Finishing..." : "Continue with Google"}</motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </form>

          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="signin-error-message"
              style={{ background: "rgba(255, 100, 100, 0.1)", padding: "0.75rem", borderRadius: "0.5rem", marginTop: "1rem" }}
            >
              {error}
            </motion.p>
          )}

          <div className="signin-security-note" style={{ marginTop: "1.5rem" }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M8 1.5L2 4V8.5C2 11.8 4.6 14.9 8 15.5C11.4 14.9 14 11.8 14 8.5V4L8 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
              <path d="M5.5 8L7 9.5L10.5 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Secure terminal authorization</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
