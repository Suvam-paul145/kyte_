import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users, MessageSquare, GitPullRequest, CheckCircle2,
  Clock, Plus, MoreHorizontal, Star, Code2,
  AlertTriangle, Zap, ArrowUpRight
} from 'lucide-react'
import './TeamCollaboration.css'

// ── Types ─────────────────────────────────────────────────────────────────
interface TeamMember {
  id: string
  name: string
  handle: string
  role: 'lead' | 'developer' | 'reviewer'
  avatar: string
  status: 'online' | 'offline' | 'away'
  projectsCompleted: number
  avgScore: number
  algoEarned: number
  reputation: number
}

interface PRReview {
  id: string
  title: string
  author: string
  status: 'pending' | 'approved' | 'changes_requested'
  score?: number
  comments: number
  updatedAt: string
  requirementsMet: number
  totalRequirements: number
}

interface Activity {
  id: string
  memberId: string
  action: string
  target: string
  timestamp: string
  kind: 'submit' | 'review' | 'comment' | 'eval' | 'deploy'
}

// ── Mock ──────────────────────────────────────────────────────────────────
const TEAM: TeamMember[] = [
  { id: 'm1', name: 'Aryan Mehta',    handle: '@aryan',   role: 'lead',      avatar: 'AM', status: 'online',  projectsCompleted: 24, avgScore: 91, algoEarned: 72.5, reputation: 98 },
  { id: 'm2', name: 'Priya Kapoor',   handle: '@priya',   role: 'developer', avatar: 'PK', status: 'online',  projectsCompleted: 18, avgScore: 87, algoEarned: 54.0, reputation: 92 },
  { id: 'm3', name: 'Siddharth Roy',  handle: '@sid',     role: 'developer', avatar: 'SR', status: 'away',    projectsCompleted: 11, avgScore: 78, algoEarned: 33.0, reputation: 81 },
  { id: 'm4', name: 'Kavya Nair',     handle: '@kavya',   role: 'reviewer',  avatar: 'KN', status: 'offline', projectsCompleted: 9,  avgScore: 93, algoEarned: 27.0, reputation: 88 },
]

const PRS: PRReview[] = [
  { id: 'pr1', title: 'feat: add JWT middleware to protected routes', author: '@aryan', status: 'approved', score: 91, comments: 3, updatedAt: '2m ago', requirementsMet: 3, totalRequirements: 3 },
  { id: 'pr2', title: 'fix: POST /users endpoint returning 404', author: '@priya', status: 'pending', comments: 1, updatedAt: '14m ago', requirementsMet: 2, totalRequirements: 3 },
  { id: 'pr3', title: 'chore: add bcrypt password hashing', author: '@sid', status: 'changes_requested', score: 62, comments: 5, updatedAt: '1h ago', requirementsMet: 1, totalRequirements: 3 },
]

const ACTIVITY: Activity[] = [
  { id: 'a1', memberId: 'm1', action: 'submitted work on', target: 'REST API project', timestamp: '5m ago', kind: 'submit' },
  { id: 'a2', memberId: 'm4', action: 'left a review on', target: 'JWT Auth PR',        timestamp: '12m ago', kind: 'review' },
  { id: 'a3', memberId: 'm2', action: 'AI eval passed for', target: 'Payment Gateway', timestamp: '28m ago', kind: 'eval' },
  { id: 'a4', memberId: 'm1', action: 'deployed contract for', target: 'File Upload API', timestamp: '1h ago', kind: 'deploy' },
  { id: 'a5', memberId: 'm3', action: 'opened PR on', target: 'Auth Service',           timestamp: '2h ago', kind: 'submit' },
]

// ── Helpers ───────────────────────────────────────────────────────────────
const STATUS_COLOR = { online: 'emerald', away: 'amber', offline: 'void' } as const
const ROLE_COLOR   = { lead: 'cyan', developer: 'violet', reviewer: 'amber' } as const
const PR_COLOR     = { approved: 'emerald', pending: 'amber', changes_requested: 'crimson' } as const
const PR_LABEL     = { approved: 'Approved', pending: 'Pending review', changes_requested: 'Changes requested' }
const ACT_COLOR    = { submit: 'cyan', review: 'violet', comment: 'amber', eval: 'emerald', deploy: 'amber' } as const

// ── Member card ───────────────────────────────────────────────────────────
function MemberCard({ member, index }: { member: TeamMember; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 * index }}
      className="tc-member-card"
    >
      <div className="tc-member-top">
        <div className="tc-avatar-wrap">
          <div className={`tc-avatar tc-avatar--${ROLE_COLOR[member.role]}`}>
            {member.avatar}
          </div>
          <span className={`tc-status tc-status--${STATUS_COLOR[member.status]}`} />
        </div>
        <div className="tc-member-info">
          <span className="tc-member-name">{member.name}</span>
          <span className="tc-member-handle">{member.handle}</span>
        </div>
        <span className={`tc-role-badge tc-role-badge--${ROLE_COLOR[member.role]}`}>
          {member.role}
        </span>
      </div>
      <div className="tc-member-stats">
        <div className="tc-stat-cell">
          <span className="tc-stat-val">{member.projectsCompleted}</span>
          <span className="tc-stat-lbl">projects</span>
        </div>
        <div className="tc-stat-cell">
          <span className="tc-stat-val" style={{ color: member.avgScore >= 80 ? 'var(--emerald)' : 'var(--amber)' }}>
            {member.avgScore}
          </span>
          <span className="tc-stat-lbl">avg score</span>
        </div>
        <div className="tc-stat-cell">
          <span className="tc-stat-val tc-stat-val--algo">{member.algoEarned} ◎</span>
          <span className="tc-stat-lbl">earned</span>
        </div>
        <div className="tc-stat-cell">
          <div className="tc-rep-bar">
            <motion.div
              className="tc-rep-fill"
              initial={{ width: 0 }}
              animate={{ width: `${member.reputation}%` }}
              transition={{ duration: 0.8, delay: 0.2 + index * 0.06 }}
            />
          </div>
          <span className="tc-stat-lbl">rep {member.reputation}</span>
        </div>
      </div>
    </motion.div>
  )
}

// ── PR row ────────────────────────────────────────────────────────────────
function PRRow({ pr, index }: { pr: PRReview; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.07 }}
      className="tc-pr-row"
    >
      <div className="tc-pr-left">
        <GitPullRequest size={14} className={`tc-pr-icon tc-pr-icon--${PR_COLOR[pr.status]}`} />
        <div>
          <span className="tc-pr-title">{pr.title}</span>
          <div className="tc-pr-meta">
            <span>{pr.author}</span>
            <span className="tc-pr-dot">·</span>
            <span>{pr.updatedAt}</span>
            <span className="tc-pr-dot">·</span>
            <span>{pr.comments} comments</span>
          </div>
        </div>
      </div>
      <div className="tc-pr-right">
        <span className="tc-req-frac">
          {pr.requirementsMet}/{pr.totalRequirements} req
        </span>
        {pr.score !== undefined && (
          <span className={`tc-score-pill tc-score-pill--${pr.score >= 80 ? 'pass' : 'fail'}`}>
            {pr.score}/100
          </span>
        )}
        <span className={`tc-pr-status tc-pr-status--${PR_COLOR[pr.status]}`}>
          {PR_LABEL[pr.status]}
        </span>
        <button className="tc-icon-btn"><MoreHorizontal size={14} /></button>
      </div>
    </motion.div>
  )
}

// ── Activity ──────────────────────────────────────────────────────────────
function ActivityRow({ act, members }: { act: Activity; members: TeamMember[] }) {
  const member = members.find(m => m.id === act.memberId)!
  return (
    <div className="tc-act-row">
      <div className={`tc-act-dot tc-act-dot--${ACT_COLOR[act.kind]}`} />
      <div className={`tc-act-avatar tc-act-avatar--${ROLE_COLOR[member.role]}`}>
        {member.avatar}
      </div>
      <div className="tc-act-text">
        <strong>{member.name}</strong> {act.action}{' '}
        <span className={`tc-act-target tc-act-target--${ACT_COLOR[act.kind]}`}>{act.target}</span>
      </div>
      <span className="tc-act-time">{act.timestamp}</span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function TeamCollaboration() {
  const [activeTab, setActiveTab] = useState<'members' | 'prs' | 'activity'>('members')

  return (
    <div className="tc-page">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="tc-header"
      >
        <div className="tc-title-group">
          <Users size={20} className="tc-header-icon" />
          <div>
            <h1 className="tc-title">Team Collaboration</h1>
            <p className="tc-sub">On-chain reputation · AI-verified performance</p>
          </div>
        </div>
        <button className="kyte-btn kyte-btn--primary kyte-btn--sm">
          <Plus size={14} />
          Invite member
        </button>
      </motion.div>

      {/* Summary stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.08 }}
        className="tc-summary"
      >
        {[
          { icon: <Users size={14} />,         label: 'Team size',      value: TEAM.length,        color: 'cyan'    },
          { icon: <Star size={14} />,           label: 'Avg reputation', value: Math.round(TEAM.reduce((s,m) => s + m.reputation, 0) / TEAM.length), color: 'violet' },
          { icon: <Code2 size={14} />,          label: 'Total projects', value: TEAM.reduce((s,m) => s + m.projectsCompleted, 0), color: 'emerald' },
          { icon: <Zap size={14} />,            label: 'Total earned',   value: `${TEAM.reduce((s,m) => s + m.algoEarned, 0).toFixed(1)} ◎`, color: 'amber' },
        ].map(s => (
          <div key={s.label} className={`tc-sum-card tc-sum-card--${s.color}`}>
            <div className={`tc-sum-icon tc-sum-icon--${s.color}`}>{s.icon}</div>
            <div className="tc-sum-val">{s.value}</div>
            <div className="tc-sum-lbl">{s.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Tabs */}
      <div className="tc-tabs">
        {(['members', 'prs', 'activity'] as const).map(t => (
          <button
            key={t}
            className={`tc-tab ${activeTab === t ? 'tc-tab--active' : ''}`}
            onClick={() => setActiveTab(t)}
          >
            {t === 'members' ? <Users size={13} /> : t === 'prs' ? <GitPullRequest size={13} /> : <Clock size={13} />}
            {t === 'members' ? 'Members' : t === 'prs' ? 'PR Reviews' : 'Activity'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'members' && (
        <div className="tc-members-grid">
          {TEAM.map((m, i) => <MemberCard key={m.id} member={m} index={i} />)}
        </div>
      )}

      {activeTab === 'prs' && (
        <div className="tc-prs-list">
          {PRS.map((pr, i) => <PRRow key={pr.id} pr={pr} index={i} />)}
        </div>
      )}

      {activeTab === 'activity' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tc-activity-list">
          {ACTIVITY.map(a => <ActivityRow key={a.id} act={a} members={TEAM} />)}
        </motion.div>
      )}
    </div>
  )
}
