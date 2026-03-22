import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck, AlertTriangle, CheckCircle2, Clock, Hash,
  ChevronDown, ChevronRight, Filter, Download, Zap,
  GitCommit, Lock, Unlock, CreditCard, Bot, Eye
} from 'lucide-react'
import './AuditTrail.css'

// ── Types ────────────────────────────────────────────────────────────────
type EventKind =
  | 'contract_deploy'
  | 'payment_lock'
  | 'submission'
  | 'ai_eval'
  | 'score_post'
  | 'payment_release'
  | 'dispute'
  | 'amendment'

interface AuditEvent {
  id: string
  kind: EventKind
  timestamp: string
  actor: string
  actorRole: 'client' | 'developer' | 'ai' | 'contract'
  txId?: string
  summary: string
  detail: string
  score?: number
  algoAmount?: number
  status: 'success' | 'warning' | 'pending'
  blockNumber?: number
}

// ── Mock data ─────────────────────────────────────────────────────────────
const EVENTS: AuditEvent[] = [
  {
    id: 'e1',
    kind: 'contract_deploy',
    timestamp: '2025-03-22T09:14:32Z',
    actor: 'ALGO...A2B3',
    actorRole: 'client',
    txId: 'TX7F3A9E2B1C8D',
    summary: 'Smart contract deployed',
    detail: 'App ID 12345678 created on Algorand TestNet. 3.0 ALGO locked in escrow. Threshold set to 80/100.',
    algoAmount: 3.0,
    status: 'success',
    blockNumber: 45182910,
  },
  {
    id: 'e2',
    kind: 'submission',
    timestamp: '2025-03-22T11:02:17Z',
    actor: 'ALGO...D4E5',
    actorRole: 'developer',
    summary: 'Work submitted (iteration 1)',
    detail: 'Developer submitted https://github.com/dev/api-project. Evaluation pipeline triggered automatically.',
    status: 'success',
    blockNumber: 45183204,
  },
  {
    id: 'e3',
    kind: 'ai_eval',
    timestamp: '2025-03-22T11:02:54Z',
    actor: 'Gemini 1.5 Flash',
    actorRole: 'ai',
    summary: 'AI evaluation completed — below threshold',
    detail: 'Evaluated 3 requirements. JWT middleware absent (score 22). POST /users missing (score 40). HTTP codes correct (score 95). Overall: 62/100.',
    score: 62,
    status: 'warning',
  },
  {
    id: 'e4',
    kind: 'score_post',
    timestamp: '2025-03-22T11:02:59Z',
    actor: 'Backend Oracle',
    actorRole: 'contract',
    txId: 'TX9A1B4C7E3F2D',
    summary: 'Score posted on-chain: 62/100',
    detail: 'Backend wallet called post_score(62) on App ID 12345678. Contract status remains IN_REVIEW. Threshold 80 not reached.',
    score: 62,
    status: 'warning',
    blockNumber: 45183211,
  },
  {
    id: 'e5',
    kind: 'submission',
    timestamp: '2025-03-22T13:45:00Z',
    actor: 'ALGO...D4E5',
    actorRole: 'developer',
    summary: 'Work resubmitted (iteration 2)',
    detail: 'Developer submitted https://github.com/dev/api-project/tree/fix-auth. Evaluation pipeline triggered.',
    status: 'success',
    blockNumber: 45184102,
  },
  {
    id: 'e6',
    kind: 'ai_eval',
    timestamp: '2025-03-22T13:45:41Z',
    actor: 'Gemini 1.5 Flash',
    actorRole: 'ai',
    summary: 'AI evaluation completed — threshold passed',
    detail: 'JWT middleware detected (score 91). POST /users returns 201 (score 86). HTTP codes correct (score 95). Overall: 91/100.',
    score: 91,
    status: 'success',
  },
  {
    id: 'e7',
    kind: 'score_post',
    timestamp: '2025-03-22T13:45:47Z',
    actor: 'Backend Oracle',
    actorRole: 'contract',
    txId: 'TX2E5F8B1A4D9C',
    summary: 'Score posted on-chain: 91/100',
    detail: 'Backend wallet called post_score(91). Score ≥ 80. Contract status auto-set to COMPLETED.',
    score: 91,
    status: 'success',
    blockNumber: 45184115,
  },
  {
    id: 'e8',
    kind: 'payment_release',
    timestamp: '2025-03-22T13:45:49Z',
    actor: 'Smart Contract',
    actorRole: 'contract',
    txId: 'TX6D9A3E7B2F1C',
    summary: 'Payment released — 3.0 ALGO transferred',
    detail: 'Inner transaction executed. 3.0 ALGO transferred from App ID 12345678 to ALGO...D4E5. Project COMPLETED.',
    algoAmount: 3.0,
    status: 'success',
    blockNumber: 45184116,
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────
const KIND_META: Record<EventKind, { icon: React.ReactNode; color: string; label: string }> = {
  contract_deploy:  { icon: <Lock size={13} />,        color: 'cyan',    label: 'Deploy' },
  payment_lock:     { icon: <CreditCard size={13} />,  color: 'violet',  label: 'Lock' },
  submission:       { icon: <GitCommit size={13} />,   color: 'blue',    label: 'Submit' },
  ai_eval:          { icon: <Bot size={13} />,         color: 'amber',   label: 'AI Eval' },
  score_post:       { icon: <Hash size={13} />,        color: 'blue',    label: 'Score' },
  payment_release:  { icon: <Unlock size={13} />,      color: 'emerald', label: 'Release' },
  dispute:          { icon: <AlertTriangle size={13} />, color: 'crimson', label: 'Dispute' },
  amendment:        { icon: <Zap size={13} />,         color: 'amber',   label: 'Amend' },
}

const ROLE_COLOR: Record<string, string> = {
  client: 'cyan', developer: 'violet', ai: 'amber', contract: 'emerald',
}

function fmtTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
function fmtDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Sub-components ────────────────────────────────────────────────────────
function StatusDot({ status }: { status: AuditEvent['status'] }) {
  return (
    <span className={`audit-dot audit-dot--${status}`} />
  )
}

function RoleBadge({ role, actor }: { role: AuditEvent['actorRole']; actor: string }) {
  return (
    <span className={`audit-role audit-role--${ROLE_COLOR[role]}`}>
      {actor.length > 14 ? actor.slice(0, 8) + '…' + actor.slice(-4) : actor}
    </span>
  )
}

function ScorePill({ score }: { score: number }) {
  const color = score >= 80 ? 'emerald' : score >= 60 ? 'amber' : 'crimson'
  return <span className={`audit-score audit-score--${color}`}>{score}/100</span>
}

function AlgoPill({ amount }: { amount: number }) {
  return <span className="audit-algo">{amount} ◎</span>
}

function EventRow({ event, index }: { event: AuditEvent; index: number }) {
  const [open, setOpen] = useState(false)
  const meta = KIND_META[event.kind]

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`audit-row ${open ? 'audit-row--open' : ''}`}
    >
      {/* Timeline line + dot */}
      <div className="audit-timeline">
        <div className={`audit-timeline-dot audit-timeline-dot--${meta.color}`} />
        {index < EVENTS.length - 1 && <div className="audit-timeline-line" />}
      </div>

      {/* Content */}
      <div className="audit-content" onClick={() => setOpen(!open)}>
        <div className="audit-header">
          <div className="audit-left">
            <span className={`audit-kind audit-kind--${meta.color}`}>
              {meta.icon}
              {meta.label}
            </span>
            <StatusDot status={event.status} />
            <span className="audit-summary">{event.summary}</span>
          </div>
          <div className="audit-right">
            {event.score !== undefined && <ScorePill score={event.score} />}
            {event.algoAmount !== undefined && <AlgoPill amount={event.algoAmount} />}
            <span className="audit-time">{fmtTime(event.timestamp)}</span>
            <RoleBadge role={event.actorRole} actor={event.actor} />
            <motion.span
              animate={{ rotate: open ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className="audit-chevron"
            >
              <ChevronRight size={14} />
            </motion.span>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="audit-detail-wrap"
            >
              <div className="audit-detail">
                <p className="audit-detail-text">{event.detail}</p>
                <div className="audit-detail-meta">
                  {event.txId && (
                    <span className="audit-meta-chip audit-meta-chip--cyan">
                      <Hash size={10} />
                      TX: {event.txId}
                    </span>
                  )}
                  {event.blockNumber && (
                    <span className="audit-meta-chip">
                      Block #{event.blockNumber.toLocaleString()}
                    </span>
                  )}
                  <span className="audit-meta-chip">
                    <Clock size={10} />
                    {fmtDate(event.timestamp)} {fmtTime(event.timestamp)}
                  </span>
                  {event.kind === 'ai_eval' && (
                    <span className="audit-meta-chip audit-meta-chip--violet">
                      <Bot size={10} />
                      Source: Gemini 1.5 Flash
                    </span>
                  )}
                  {(event.kind === 'score_post' || event.kind === 'payment_release') && (
                    <span className="audit-meta-chip audit-meta-chip--emerald">
                      <ShieldCheck size={10} />
                      On-chain · Algorand TestNet
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function AuditTrail() {
  const [filter, setFilter] = useState<EventKind | 'all'>('all')

  const visible = filter === 'all'
    ? EVENTS
    : EVENTS.filter(e => e.kind === filter)

  const stats = {
    total: EVENTS.length,
    onChain: EVENTS.filter(e => e.txId).length,
    aiCalls: EVENTS.filter(e => e.kind === 'ai_eval').length,
    algoMoved: EVENTS.filter(e => e.algoAmount).reduce((s, e) => s + (e.algoAmount ?? 0), 0),
  }

  return (
    <div className="audit-page">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="audit-page-header"
      >
        <div className="audit-page-title-wrap">
          <ShieldCheck size={20} className="audit-page-icon" />
          <div>
            <h1 className="audit-page-title">Audit Trail</h1>
            <p className="audit-page-sub">
              Immutable record of every event — on-chain and off-chain
            </p>
          </div>
        </div>
        <div className="audit-header-actions">
          <button className="kyte-btn kyte-btn--ghost kyte-btn--sm">
            <Eye size={14} />
            Explorer
          </button>
          <button className="kyte-btn kyte-btn--ghost kyte-btn--sm">
            <Download size={14} />
            Export
          </button>
        </div>
      </motion.div>

      {/* ── Stats row ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="audit-stats"
      >
        {[
          { label: 'Total events',   value: stats.total,    color: 'cyan'    },
          { label: 'On-chain txns',  value: stats.onChain,  color: 'emerald' },
          { label: 'AI evaluations', value: stats.aiCalls,  color: 'amber'   },
          { label: 'ALGO settled',   value: `${stats.algoMoved} ◎`, color: 'violet' },
        ].map((s) => (
          <div key={s.label} className={`audit-stat audit-stat--${s.color}`}>
            <span className="audit-stat-value">{s.value}</span>
            <span className="audit-stat-label">{s.label}</span>
          </div>
        ))}
      </motion.div>

      {/* ── Filter bar ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="audit-filter-bar"
      >
        <Filter size={13} className="audit-filter-icon" />
        {(['all', 'contract_deploy', 'submission', 'ai_eval', 'score_post', 'payment_release'] as const).map(k => (
          <button
            key={k}
            className={`audit-filter-btn ${filter === k ? 'audit-filter-btn--active' : ''}`}
            onClick={() => setFilter(k)}
          >
            {k === 'all' ? 'All events' : KIND_META[k].label}
          </button>
        ))}
      </motion.div>

      {/* ── Timeline ── */}
      <div className="audit-timeline-container">
        {visible.map((event, i) => (
          <EventRow key={event.id} event={event} index={i} />
        ))}
      </div>
    </div>
  )
}
