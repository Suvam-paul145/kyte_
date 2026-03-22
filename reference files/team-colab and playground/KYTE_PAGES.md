# Kyte — New Pages Documentation

> Extension of the Luminal Frontier UI · Production-grade · Hackathon-aligned

---

## Design Consistency Map

The entire extension inherits from `src/styles/tokens.css` — the single source of truth.

| Token category | Kyte existing | This extension |
|---|---|---|
| Background depths | `--void` `--abyss` `--depth-1/2/3` | Identical |
| Accent spectrum | `--cyan` `--violet` `--emerald` `--amber` `--crimson` | Identical |
| Typography | `--font-display` (Space Grotesk) · `--font-mono` (JetBrains Mono) | Identical |
| Motion | Framer Motion · `--ease-snap` | Identical |
| Border system | `--rim-faint/soft/mid/bright` | Identical |
| Corner radii | `--r-sm/md/lg/xl/pill` | Identical |

---

## New Pages Overview

### 1. AuditTrail (`/audit`)
**Purpose:** Immutable chronological record of every project event — on-chain and off-chain in one unified view.

**Sections:**
- Stats row: total events, on-chain txns, AI evals, ALGO settled
- Filter bar: filter by event kind
- Animated timeline: expandable event rows with full detail, tx IDs, block numbers

**Key components:**
- `EventRow` — collapsible timeline card with Framer expand animation
- `StatusDot` — animated presence indicator (success / warning / pending)
- `ScorePill` / `AlgoPill` — consistent data badges
- `RoleBadge` — actor identification with role colour

**Data shape:** `AuditEvent[]` — fetched from `GET /project/:id/audit`

---

### 2. AIInsightPanel (`/project/:id/ai`)
**Purpose:** Deep-dive into AI evaluation results with per-requirement breakdown, score arc, gap analysis, and iteration comparison.

**Sections:**
- Score arc SVG with animated stroke-dashoffset
- AI verdict chip (passed / failed)
- Gap report card with actionable developer advice
- Score diff visualiser (iteration 1 → 2)
- Per-requirement expandable cards with evidence and fix-time estimate

**Key components:**
- `ScoreArc` — animated SVG radial progress
- `ReqCard` — expandable requirement result with code evidence
- `ScoreDiff` — side-by-side animated progress bars
- Iteration toggle — switches between evaluation runs

**Data shape:** `EvalResult` — fetched from `GET /project/:id/report`

---

### 3. TeamCollaboration (`/team`)
**Purpose:** On-chain reputation-backed team view. Members, PR reviews, and live activity feed.

**Sections:**
- Summary stat cards (team size, avg reputation, projects, ALGO earned)
- Tab navigation: Members | PR Reviews | Activity
- Member grid: reputation bars, avg score, ALGO earned
- PR review list: AI score per PR, requirement coverage, review status
- Activity feed: real-time stream of team actions

**Key components:**
- `MemberCard` — reputation bar, stats grid, avatar with online indicator
- `PRRow` — PR status with AI score overlay and requirement fraction
- `ActivityRow` — action feed with colour-coded event dots

**Data shape:** `TeamMember[]` / `PRReview[]` / `Activity[]`

---

## File / Folder Structure

```
src/
├── styles/
│   └── tokens.css                    ← SHARED design tokens (extend, never duplicate)
│
├── pages/
│   ├── AuditTrail/
│   │   ├── AuditTrail.tsx
│   │   ├── AuditTrail.css
│   │   └── index.ts                  ← re-export
│   │
│   ├── AIInsightPanel/
│   │   ├── AIInsightPanel.tsx
│   │   ├── AIInsightPanel.css
│   │   └── index.ts
│   │
│   ├── TeamCollaboration/
│   │   ├── TeamCollaboration.tsx
│   │   ├── TeamCollaboration.css
│   │   └── index.ts
│   │
│   └── [existing pages...]
│
├── components/
│   └── shared/
│       ├── KyteButton/               ← .kyte-btn class extracted to component
│       ├── ScorePill/
│       ├── StatusBadge/
│       └── AlgoAmount/
│
└── router/
    └── routes.tsx                    ← add new routes here
```

---

## Route Registration

Add to your existing `router/routes.tsx` (or equivalent):

```tsx
import AuditTrail       from '@/pages/AuditTrail'
import AIInsightPanel   from '@/pages/AIInsightPanel'
import TeamCollaboration from '@/pages/TeamCollaboration'

// Inside your router:
{ path: '/project/:id/audit',   element: <AuditTrail /> },
{ path: '/project/:id/ai',      element: <AIInsightPanel /> },
{ path: '/team',                element: <TeamCollaboration /> },
```

---

## Component Reuse Strategy

| Component | Reused from | Notes |
|---|---|---|
| `.kyte-btn` | Existing button class | All variants maintained |
| Framer Motion | Already in `dependencies` | `motion.div` + `AnimatePresence` |
| Lucide icons | Already in `dependencies` | Zero new icon library |
| `--font-mono` | Token system | JetBrains Mono for all data values |
| Color tokens | Token system | Never hardcode hex — always use `var()` |
| `zustand` | Already in `dependencies` | Replace mock data with store slices |

---

## Connecting to Real Data

Replace mock arrays with API calls. Suggested store slices:

```ts
// store/auditStore.ts
interface AuditStore {
  events: AuditEvent[]
  loading: boolean
  fetchAudit: (projectId: string) => Promise<void>
}

// store/evalStore.ts
interface EvalStore {
  results: EvalResult[]
  current: EvalResult | null
  fetchResults: (projectId: string) => Promise<void>
}

// store/teamStore.ts
interface TeamStore {
  members: TeamMember[]
  prs: PRReview[]
  activity: Activity[]
  fetchTeam: () => Promise<void>
}
```

API endpoints to wire:
- `GET /project/:id/audit` → AuditTrail events
- `GET /project/:id/report` → AIInsightPanel eval results
- `GET /team/members` → TeamCollaboration members
- `GET /team/prs` → PR reviews
- `GET /team/activity` → Activity feed

---

## MVP Prioritisation

| Page | Demo impact | Build time | Priority |
|---|---|---|---|
| AIInsightPanel | Extreme — shows AI scores visually | 2h | P0 |
| AuditTrail | High — proves on-chain immutability | 2h | P0 |
| TeamCollaboration | Medium — shows scale potential | 3h | P1 |

Build AIInsightPanel first. It directly supports the core hackathon demo narrative.
