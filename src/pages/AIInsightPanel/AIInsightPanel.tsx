import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot, Sparkles, TrendingUp, AlertCircle,
  CheckCircle2, XCircle, Clock, ChevronRight,
  BarChart3, FileCode2, Lightbulb, RefreshCw
} from 'lucide-react'
import './AIInsightPanel.css'

// ── Types ────────────────────────────────────────────────────────────────
interface RequirementResult {
  id: string
  text: string
  met: boolean
  score: number
  reason: string
  evidence?: string
  fixTime?: string
}

interface EvalResult {
  iteration: number
  timestamp: string
  overallScore: number
  passed: boolean
  results: RequirementResult[]
  gapReport: string
  executionMs: number
  modelUsed: string
}

// ── Mock ─────────────────────────────────────────────────────────────────
const EVAL: EvalResult = {
  iteration: 2,
  timestamp: '2025-03-22T13:45:41Z',
  overallScore: 91,
  passed: true,
  executionMs: 4823,
  modelUsed: 'gemini-1.5-flash',
  gapReport:
    'All three requirements are now met with high confidence. ' +
    'JWT middleware correctly rejects unauthenticated requests on all protected routes. ' +
    'POST /users creates and hashes passwords. HTTP status codes are precise and consistent. ' +
    'No critical gaps remain.',
  results: [
    {
      id: 'r1',
      text: 'Implement JWT authentication middleware that returns 401 on unauthenticated requests',
      met: true,
      score: 91,
      reason: 'Depends(get_current_user) found on /todos GET, POST, DELETE routes. Unauthenticated request correctly returns 401 with WWW-Authenticate header.',
      evidence: 'auth.py:L34 — def get_current_user(token: str = Depends(oauth2_scheme))',
      fixTime: 'Completed',
    },
    {
      id: 'r2',
      text: 'Expose POST /users endpoint that accepts email/password and returns 201',
      met: true,
      score: 86,
      reason: 'POST /users found in routes/users.py. Returns 201 with user ID. Password hashed with bcrypt. Minor: email uniqueness not validated.',
      evidence: 'routes/users.py:L12 — @router.post("/users", status_code=201)',
      fixTime: 'Completed (minor gap noted)',
    },
    {
      id: 'r3',
      text: 'Return proper HTTP status codes across all endpoints',
      met: true,
      score: 95,
      reason: 'GET returns 200, POST returns 201, DELETE returns 204, not-found returns 404, auth failures return 401. All correct.',
      evidence: 'routes/todos.py:L8,L24,L48 — status_code parameters verified',
      fixTime: 'Completed',
    },
  ],
}

const PREV_EVAL: EvalResult = {
  ...EVAL,
  iteration: 1,
  overallScore: 62,
  passed: false,
  timestamp: '2025-03-22T11:02:54Z',
  results: [
    { ...EVAL.results[0], met: false, score: 22, reason: 'No auth middleware found. /todos returns 200 without token.', fixTime: '~45 min' },
    { ...EVAL.results[1], met: false, score: 40, reason: 'POST /users route not registered in router.', fixTime: '~30 min' },
    { ...EVAL.results[2], met: true, score: 95, reason: 'HTTP codes all correct across existing routes.', fixTime: 'Completed' },
  ],
  gapReport: 'JWT middleware is absent. /todos routes are unprotected. POST /users endpoint does not exist — add it to routes/users.py and register with router.',
}

// ── Animated score arc ────────────────────────────────────────────────────
function ScoreArc({ score, size = 96 }: { score: number; size?: number }) {
  const r = (size - 12) / 2
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  const color = score >= 80 ? 'var(--emerald)' : score >= 60 ? 'var(--amber)' : 'var(--crimson)'

  return (
    <svg width={size} height={size} className="score-arc" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--rim-soft)" strokeWidth={5} />
      <motion.circle
        cx={size/2} cy={size/2} r={r}
        fill="none" stroke={color} strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - fill }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      />
    </svg>
  )
}

// ── Req card ──────────────────────────────────────────────────────────────
function ReqCard({ req, index }: { req: RequirementResult; index: number }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.08, duration: 0.4 }}
      className={`ai-req-card ${req.met ? 'ai-req-card--pass' : 'ai-req-card--fail'}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="ai-req-header">
        <span className={`ai-req-icon ${req.met ? 'ai-req-icon--pass' : 'ai-req-icon--fail'}`}>
          {req.met ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
        </span>
        <div className="ai-req-body">
          <p className="ai-req-text">{req.text}</p>
          {!expanded && (
            <p className="ai-req-reason-preview">{req.reason.slice(0, 80)}…</p>
          )}
        </div>
        <div className="ai-req-right">
          <span className={`ai-score-pill ai-score-pill--${req.met ? 'pass' : 'fail'}`}>
            {req.score}
          </span>
          <motion.span animate={{ rotate: expanded ? 90 : 0 }} className="ai-req-chevron">
            <ChevronRight size={13} />
          </motion.span>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="ai-req-expanded"
          >
            <p className="ai-req-reason">{req.reason}</p>
            {req.evidence && (
              <div className="ai-req-evidence">
                <FileCode2 size={11} />
                <code>{req.evidence}</code>
              </div>
            )}
            <div className="ai-req-fix">
              <Clock size={11} />
              Fix time: <strong>{req.fixTime}</strong>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Diff bar ──────────────────────────────────────────────────────────────
function ScoreDiff({ prev, curr }: { prev: number; curr: number }) {
  const delta = curr - prev
  const positive = delta >= 0
  return (
    <div className="ai-diff-bar">
      <div className="ai-diff-label">Iteration 1</div>
      <div className="ai-diff-track">
        <motion.div
          className="ai-diff-fill ai-diff-fill--prev"
          initial={{ width: 0 }}
          animate={{ width: `${prev}%` }}
          transition={{ duration: 0.8, delay: 0.3 }}
        />
      </div>
      <span className="ai-diff-score ai-diff-score--prev">{prev}</span>
      <div className="ai-diff-arrow">{positive ? '→' : '→'}</div>
      <div className="ai-diff-label">Iteration 2</div>
      <div className="ai-diff-track">
        <motion.div
          className="ai-diff-fill ai-diff-fill--curr"
          initial={{ width: 0 }}
          animate={{ width: `${curr}%` }}
          transition={{ duration: 0.8, delay: 0.5 }}
        />
      </div>
      <span className="ai-diff-score ai-diff-score--curr">{curr}</span>
      <span className={`ai-diff-delta ${positive ? 'ai-diff-delta--up' : 'ai-diff-delta--down'}`}>
        {positive ? '+' : ''}{delta}
      </span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function AIInsightPanel() {
  const [activeIter, setActiveIter] = useState<1 | 2>(2)
  const eval_ = activeIter === 2 ? EVAL : PREV_EVAL

  return (
    <div className="ai-page">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="ai-page-header"
      >
        <div className="ai-title-group">
          <Bot size={20} className="ai-page-icon" />
          <div>
            <h1 className="ai-page-title">AI Insight Panel</h1>
            <p className="ai-page-sub">Gemini 1.5 Flash — per-requirement audit</p>
          </div>
        </div>
        <div className="ai-iter-toggle">
          {([1, 2] as const).map(n => (
            <button
              key={n}
              className={`ai-iter-btn ${activeIter === n ? 'ai-iter-btn--active' : ''}`}
              onClick={() => setActiveIter(n)}
            >
              Iteration {n}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Score + meta row */}
      <motion.div
        key={activeIter}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="ai-score-row"
      >
        <div className="ai-score-card">
          <div className="ai-score-arc-wrap">
            <ScoreArc score={eval_.overallScore} size={88} />
            <div className="ai-score-center">
              <span className="ai-score-big">{eval_.overallScore}</span>
              <span className="ai-score-den">/100</span>
            </div>
          </div>
          <div className="ai-score-meta">
            <div className={`ai-verdict ${eval_.passed ? 'ai-verdict--pass' : 'ai-verdict--fail'}`}>
              {eval_.passed ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              {eval_.passed ? 'Threshold passed — payment released' : 'Below threshold — resubmission required'}
            </div>
            <div className="ai-score-chips">
              <span className="ai-meta-chip">
                <BarChart3 size={10} />
                Iteration {eval_.iteration}
              </span>
              <span className="ai-meta-chip">
                <Clock size={10} />
                {eval_.executionMs}ms
              </span>
              <span className="ai-meta-chip ai-meta-chip--violet">
                <Sparkles size={10} />
                {eval_.modelUsed}
              </span>
            </div>
          </div>
        </div>

        {/* Gap report card */}
        <div className="ai-gap-card">
          <div className="ai-gap-header">
            <Lightbulb size={14} className="ai-gap-icon" />
            <span>Gap report</span>
          </div>
          <p className="ai-gap-text">{eval_.gapReport}</p>
          {!eval_.passed && (
            <button className="kyte-btn kyte-btn--cyan kyte-btn--sm" style={{ marginTop: 12 }}>
              <RefreshCw size={12} />
              Resubmit with fix
            </button>
          )}
        </div>
      </motion.div>

      {/* Score comparison (only when both iterations exist) */}
      <div className="ai-section">
        <div className="ai-section-head">
          <TrendingUp size={14} />
          Score progression
        </div>
        <ScoreDiff prev={PREV_EVAL.overallScore} curr={EVAL.overallScore} />
      </div>

      {/* Requirements */}
      <div className="ai-section">
        <div className="ai-section-head">
          <FileCode2 size={14} />
          Per-requirement breakdown
          <span className="ai-section-count">
            {eval_.results.filter(r => r.met).length}/{eval_.results.length} passed
          </span>
        </div>
        <div className="ai-req-list">
          <AnimatePresence mode="wait">
            {eval_.results.map((r, i) => (
              <ReqCard key={`${activeIter}-${r.id}`} req={r} index={i} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
