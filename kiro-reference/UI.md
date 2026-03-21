# CodePact — UI/UX Specification

> **Version:** 1.0 — MVP
> **Frontend Budget:** 4 hours
> **Framework:** React 18 + Vite + Tailwind CSS
> **Design Principle:** Clarity over decoration. Every element serves the demo narrative.

---

## Table of Contents

1. [Design System](#1-design-system)
2. [Layout & Navigation](#2-layout--navigation)
3. [Page 1 — Client Dashboard](#3-page-1--client-dashboard)
4. [Page 2 — Developer Dashboard](#4-page-2--developer-dashboard)
5. [Page 3 — Project Detail](#5-page-3--project-detail)
6. [Components Library](#6-components-library)
7. [User Flows](#7-user-flows)
8. [States & Interactions](#8-states--interactions)
9. [Responsive Design](#9-responsive-design)
10. [Implementation Notes](#10-implementation-notes)

---

## 1. Design System

### Color Palette

```
─────────────────────────────────────────────────────────────
PRIMARY BRAND
  --brand-900:  #0A1628    Deep navy — headers, heavy text
  --brand-700:  #1A3C5E    Primary blue — section titles
  --brand-500:  #2E86C1    Accent blue — interactive elements
  --brand-100:  #EAF4FB    Light blue — card backgrounds

SEMANTIC COLORS
  --success:    #1E8449    Green — passed requirements, payment released
  --warning:    #D35400    Orange — in-review, code snippets
  --danger:     #C0392B    Red — failed requirements, disputes
  --neutral:    #7F8C8D    Gray — secondary text, pending states

BACKGROUNDS
  --bg-page:    #F4F7FA    Main page background
  --bg-card:    #FFFFFF    Card surfaces
  --bg-dark:    #1E2D3D    Code blocks
  --border:     #D5E8F0    Card borders

TEXT
  --text-primary:   #1A1A2E
  --text-secondary: #5A6475
  --text-muted:     #9AA3AF
─────────────────────────────────────────────────────────────
```

### Typography

```
Font Family:  Inter (Google Fonts) — clean, technical, readable
Monospace:    JetBrains Mono — wallet addresses, scores, code

Scale:
  text-xs    12px  — status badges, metadata
  text-sm    14px  — body secondary, table content
  text-base  16px  — body primary, form labels
  text-lg    18px  — card titles, section headers
  text-xl    20px  — page subheadings
  text-2xl   24px  — page headings
  text-3xl   30px  — dashboard titles
  text-4xl   36px  — score display
  text-6xl   60px  — hero ALGO amount (payment lock screen)
```

### Spacing System (Tailwind)

```
Use Tailwind's default 4px base unit.
Key spacing:
  p-4   (16px) — card internal padding
  p-6   (24px) — page section padding
  gap-4 (16px) — grid gaps
  gap-6 (24px) — page section gaps
  mb-8  (32px) — between major sections
```

### Shadows

```
shadow-sm   — subtle card lift (default)
shadow-md   — hovered card
shadow-lg   — modal/overlay
shadow-none — flat elements (tables, code blocks)
```

### Border Radius

```
rounded     (4px)  — badges, small elements
rounded-lg  (8px)  — cards, inputs
rounded-xl  (12px) — modals, large panels
rounded-full       — avatar, score meter
```

---

## 2. Layout & Navigation

### Global Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  NAVBAR                                                          │
│  [CodePact logo]     [Client / Developer toggle]  [Wallet btn]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PAGE CONTENT (max-w-7xl mx-auto px-6)                          │
│                                                                  │
│  ┌─ SIDEBAR (240px) ──┐  ┌─ MAIN CONTENT (flex-1) ────────┐    │
│  │ Navigation items   │  │ Page-specific content            │    │
│  │ (desktop only)     │  │                                  │    │
│  └────────────────────┘  └──────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Navbar Component

```jsx
// src/components/Navbar.jsx

Layout: h-16 fixed top-0 w-full bg-white border-b border-gray-200 z-50

Left:   CodePact logo (SVG chain link icon + wordmark in brand-700)
Center: Role tabs — [👤 Client] [💻 Developer] — toggle switches active page
Right:  WalletConnect button

WalletConnect states:
  NOT CONNECTED:  "Connect Wallet" — brand-500 bg, white text, rounded-lg
  CONNECTING:     "Connecting..." — disabled, spinner icon
  CONNECTED:      Truncated address ("ALGO...X7F2") — gray bg, green dot indicator
                  Click to disconnect (dropdown with "Disconnect" option)
```

### Sidebar Navigation (Desktop Only)

```
CLIENT SIDEBAR:
  📋  My Projects
  ➕  Create Project
  👤  My Profile

DEVELOPER SIDEBAR:
  🔍  Browse Projects
  📁  My Active Project
  👤  My Profile

Active item: brand-100 bg, brand-700 text, left border brand-500 (3px)
Inactive:    transparent bg, text-secondary
```

---

## 3. Page 1 — Client Dashboard

### URL: `/client`

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ PAGE HEADER                                                      │
│ "Client Dashboard"  [+ New Project button]                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌── PROJECT LIST (left, 55%) ──────────────────────────────┐   │
│  │  Filter tabs: [All] [Open] [In Review] [Completed]        │   │
│  │                                                            │   │
│  │  ┌─ ProjectCard ─────────────────────────────────────┐   │   │
│  │  │  title                        [STATUS BADGE]       │   │   │
│  │  │  description (truncated 2 lines)                   │   │   │
│  │  │  3 requirements · 3.0 ALGO · 2h ago                │   │   │
│  │  │  App ID: 12345678  [Explorer ↗]                    │   │   │
│  │  └────────────────────────────────────────────────────┘   │   │
│  │  (repeat for each project)                                 │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌── NEW PROJECT FORM (right, 40%) ──────────────────────────┐  │
│  │  "Create New Project"                                       │  │
│  │  ─────────────────────────────────────────────────────     │  │
│  │  Title *                                                    │  │
│  │  [____________________________________]                     │  │
│  │                                                             │  │
│  │  Description                                                │  │
│  │  [____________________________________]                     │  │
│  │  [____________________________________]                     │  │
│  │                                                             │  │
│  │  Requirements *                                             │  │
│  │  [req 1____________________________] [✕]                   │  │
│  │  [req 2____________________________] [✕]                   │  │
│  │  [+ Add Requirement]                                        │  │
│  │                                                             │  │
│  │  Payment Amount (ALGO) *                                    │  │
│  │  [  3.0  ] ALGO  ≈ $0.42 USD                               │  │
│  │                                                             │  │
│  │  AI Score Threshold                                         │  │
│  │  [────────────────●──────] 80 / 100                        │  │
│  │                                                             │  │
│  │  [  Create & Lock Payment  ] ← brand-500 bg, full width    │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Create Project — Loading State

```
After clicking "Create & Lock Payment":
  Button becomes: [⟳ Deploying contract to Algorand...] — disabled

Step indicator appears below button:
  [✓] Validating requirements
  [⟳] Deploying smart contract...
  [ ] Locking payment in escrow
  [ ] Saving project data
```

### Create Project — Success State

```
Form replaced with success card:

  ┌──────────────────────────────────────────────────────────────┐
  │  ✓  Project Created Successfully                             │
  │                                                              │
  │  "Build a REST API with JWT auth"                            │
  │                                                              │
  │  Contract App ID                                             │
  │  12345678  [Copy]  [View on Explorer ↗]                     │
  │                                                              │
  │  3.0 ALGO locked in escrow                                   │
  │  3 requirements defined                                      │
  │                                                              │
  │  [Share Project Link]   [Create Another]                     │
  └──────────────────────────────────────────────────────────────┘
```

---

## 4. Page 2 — Developer Dashboard

### URL: `/developer`

### Layout — No Active Project

```
┌─────────────────────────────────────────────────────────────────┐
│ PAGE HEADER                                                      │
│ "Open Projects"  [🔍 search]  [Sort: Newest | Highest Pay]      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PROJECTS GRID (2 columns on desktop, 1 on mobile)              │
│                                                                  │
│  ┌── ProjectMarketplaceCard ─────────────────┐                  │
│  │  🔵 OPEN                    3.0 ALGO      │                  │
│  │  "Build a REST API"                       │                  │
│  │  ──────────────────────────────────────── │                  │
│  │  Requirements (3):                        │                  │
│  │  • Implement JWT auth                     │                  │
│  │  • Expose 3 endpoints                     │                  │
│  │  • Return proper HTTP codes               │                  │
│  │                                           │                  │
│  │  Posted 2h ago  ·  0 submissions          │                  │
│  │  ──────────────────────────────────────── │                  │
│  │  [ Accept This Project ]  ← full width   │                  │
│  └───────────────────────────────────────────┘                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Layout — Active Project (Post-Accept)

```
┌─────────────────────────────────────────────────────────────────┐
│ PAGE HEADER                                                      │
│ "My Active Project"                                              │
├──────────────────────────────────────┬──────────────────────────┤
│                                      │                          │
│  LEFT — PROJECT INFO (40%)           │  RIGHT — SUBMIT (60%)    │
│                                      │                          │
│  📋 "Build a REST API"               │  Submit Your Work        │
│  ─────────────────────               │  ─────────────────────   │
│  Client: ALGO...A2B3                 │                          │
│  Payment: 3.0 ALGO (locked)          │  [GitHub/demo URL input] │
│                                      │  Accepted formats:       │
│  Requirements (3):                   │  github.com · gitlab.com │
│  • Implement JWT auth                │  vercel.app · netlify.app│
│  • Expose 3 endpoints                │                          │
│  • Return proper HTTP codes          │  [ Submit & Evaluate ]   │
│                                      │                          │
│  Status: 🟡 In Review               │  ─────────────────────   │
│  App ID: 12345678 [↗]                │                          │
│                                      │  EVALUATION RESULTS      │
│                                      │  [RequirementsChecklist] │
└──────────────────────────────────────┴──────────────────────────┘
```

### RequirementsChecklist — Component Detail

```
EVALUATION IN PROGRESS:

  ┌────────────────────────────────────────────────────────────────┐
  │  AI Evaluation  ·  Iteration 1  ·  62 / 100                   │
  │                                                                │
  │  ┌─────────────────────────────────────────────────────────┐   │
  │  │  ○  Implement JWT auth middleware          [evaluating] │   │← row 1: gray pulse
  │  └─────────────────────────────────────────────────────────┘   │
  │  ┌─────────────────────────────────────────────────────────┐   │
  │  │  ✗  Expose 3 endpoints                        FAIL  20 │   │← row 2: red, revealed
  │  │     JWT middleware not found. Auth decorator            │   │
  │  │     missing on /todos routes.                           │   │
  │  └─────────────────────────────────────────────────────────┘   │
  │  ┌─────────────────────────────────────────────────────────┐   │
  │  │  ✓  Return proper HTTP status codes           PASS  95 │   │← row 3: green, revealed
  │  │     200, 201, 404 all correctly implemented.            │   │
  │  └─────────────────────────────────────────────────────────┘   │
  │                                                                │
  └────────────────────────────────────────────────────────────────┘

Row height: 48px (collapsed) → auto (expanded with reason text)
Animation: opacity 0→1 + translateY(8px→0) over 300ms
Stagger: 400ms delay between each row reveal
```

### Gap Report Card (Score < 80)

```
┌────────────────────────────────────────────────────────────────┐
│  📋  Gap Report  ·  Score: 62/100                              │
│  ──────────────────────────────────────────────────────────    │
│  2 of 3 requirements need attention before payment is          │
│  released.                                                     │
│                                                                │
│  JWT middleware not implemented. The /todos endpoints exist    │
│  but are completely unprotected — any request without a        │
│  valid token should return 401, but the current code returns   │
│  200 regardless. Also, POST /users is missing entirely.        │
│                                                                │
│  ──────────────────────────────────────────────────────────    │
│  Threshold:  80/100  ·  Current: 62/100  ·  Need: +18 more   │
│                                                                │
│  [    Resubmit With Updated URL    ] ← full width, brand-500  │
└────────────────────────────────────────────────────────────────┘
```

### Payment Released State (Score ≥ 80)

```
┌────────────────────────────────────────────────────────────────┐
│  🎉  Payment Released!                                         │
│  ──────────────────────────────────────────────────────────    │
│  3.0 ALGO has been transferred to your wallet.                 │
│  Score: 91/100  ·  All 3 requirements met                      │
│                                                                │
│  Transaction:  T7F3A...X2B1  [View on Explorer ↗]             │
│                                                                │
│  [ Browse More Projects ]                                      │
└────────────────────────────────────────────────────────────────┘
```

---

## 5. Page 3 — Project Detail

### URL: `/project/:id`

### Accessible to both Client and Developer

```
┌─────────────────────────────────────────────────────────────────┐
│ PAGE HEADER                                                      │
│ ← Back    "Build a REST API with JWT auth"    [🟡 IN REVIEW]   │
│ App ID: 12345678  [Copy]  [View on Algorand Explorer ↗]        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ROW 1 — STATUS CARDS (4 across on desktop)                     │
│                                                                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│  │Contract │ │Payment  │ │Current  │ │Iteration│              │
│  │Status   │ │Status   │ │Score    │ │Count    │              │
│  │         │ │         │ │         │ │         │              │
│  │IN REVIEW│ │ESCROWED │ │  62     │ │   2     │              │
│  │  🟡     │ │  🔒     │ │ /100    │ │ submits │              │
│  │Algorand │ │ 3.0     │ │         │ │         │              │
│  │chain ✓  │ │ ALGO    │ │         │ │         │              │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘              │
│                                                                  │
├──────────────────────────────────────┬──────────────────────────┤
│                                      │                          │
│  LEFT — REQUIREMENTS TABLE (55%)     │  RIGHT — INFO (40%)      │
│                                      │                          │
│  Requirements Status                 │  Contract Parties        │
│  ──────────────────                  │  ──────────────────────  │
│  Req | Status | Score | Reason       │  Client:                 │
│  ────┼────────┼───────┼──────────    │  ALGO...A2B3  [copy]    │
│  JWT │  FAIL  │  20   │ Not impl.    │                          │
│  auth│        │       │              │  Developer:              │
│  ────┼────────┼───────┼──────────    │  ALGO...D4E5  [copy]    │
│  3   │  PASS  │  95   │ Found in     │                          │
│  endp│        │       │ routes.py    │  Threshold: 80/100       │
│  ────┼────────┼───────┼──────────    │                          │
│  HTTP│  PASS  │  90   │ Correct      │  ──────────────────────  │
│  stat│        │       │ codes        │  Source: Algorand Chain  │
│                                      │  🔗 Live Contract State  │
│                                      │  Updated: just now       │
│                                      │                          │
└──────────────────────────────────────┴──────────────────────────┘

│  EVALUATION HISTORY (full width below)                           │
│  ──────────────────────────────────────────────────────────────  │
│                                                                  │
│  Iteration 2  ·  Score: 62  ·  5 minutes ago        [Expand ▼] │
│  Iteration 1  ·  Score: 30  ·  1 hour ago            [Expand ▼] │
│                                                                  │
│  [Expand] shows: submission URL, per-requirement table, gap report│
└─────────────────────────────────────────────────────────────────┘
```

### Contract Source Label

A critical UI detail: the contract state card should always display:

```
┌─────────────────────────────────────────────────────┐
│  🔗  Source: Algorand Blockchain                    │
│      Last read: 3 seconds ago · Auto-refreshes 5s   │
└─────────────────────────────────────────────────────┘
```

This communicates to judges and users that the data is not from a database — it's from the chain.

---

## 6. Components Library

### `WalletConnect` — Auth Entry

```jsx
Props: none (reads from Zustand)

States:
  idle      → Button: "Connect Pera Wallet" [wallet icon]
  loading   → Button: "Connecting..." [spinner], disabled
  connected → Dropdown trigger: "ALGO...X7F2 🟢"
              Dropdown: wallet address (full), [Disconnect]

Usage: <WalletConnect /> in Navbar, also standalone on empty pages
```

### `StatusBadge` — Contract State Indicator

```jsx
Props: status: "open" | "in_review" | "completed" | "disputed"

Renders:
  open       → 🔵 "OPEN"      bg-blue-100   text-blue-700
  in_review  → 🟡 "IN REVIEW" bg-amber-100  text-amber-700
  completed  → 🟢 "COMPLETED" bg-green-100  text-green-700
  disputed   → 🔴 "DISPUTED"  bg-red-100    text-red-700

All: font-medium text-xs uppercase tracking-wide rounded-full px-3 py-1
```

### `PaymentStatus` — Escrow State

```jsx
Props: status: "escrowed" | "released", amount: number, txId?: string

escrowed:
  🔒 "3.0 ALGO in Escrow"
  bg-blue-50, border-blue-200, text-blue-800
  Subtext: "Locked in Algorand smart contract"

released:
  ✅ "3.0 ALGO Released"
  bg-green-50, border-green-200, text-green-800
  Link: "View Transaction →" [opens explorer]
```

### `ScoreMeter` — Circular Progress

```jsx
Props: score: number (0–100), threshold: number (default 80), size: "sm" | "lg"

Renders: SVG circle with stroke-dasharray animation
  0–59:  stroke red    (#C0392B)
  60–79: stroke amber  (#D35400)
  80–100: stroke green (#1E8449)

Center text: score (text-4xl font-mono) / 100
Below: "/ 100" label

sm variant: 80px diameter (used in history rows)
lg variant: 160px diameter (used in main evaluation result)
```

### `RequirementsChecklist` — Animated Eval

```jsx
Props:
  requirements: string[]         // from project (pre-evaluation)
  results?: RequirementResult[]  // from API (post-evaluation, null while running)
  isRunning: boolean

Row component: RequirementRow
  Props: requirement, result?, state: "pending" | "evaluating" | "pass" | "fail"

Row layout:
  [icon 20px] [requirement text flex-1] [score badge 60px]

Icon states:
  pending:    ○ (gray circle outline)
  evaluating: ⟳ (spinning, brand-500)
  pass:       ✓ (green checkmark, filled)
  fail:       ✗ (red X, filled)

Score badge:
  pass: "95" green pill
  fail: "20" red pill

Row bg:
  pending:    bg-gray-50
  evaluating: bg-blue-50 with subtle pulse animation
  pass:       bg-green-50
  fail:       bg-red-50

Reason text (expandable, shows on pass/fail):
  text-sm text-gray-600, italic
  indent matches requirement text (left-pad = icon width + gap)

Animation:
  Each row: opacity: 0 → 1, translateY: 8px → 0, duration: 300ms
  Trigger: staggered setTimeout, 400ms between rows
```

### `GapReport` — Failure Detail

```jsx
Props: gapReport: string, score: number, threshold: number, onResubmit: fn

Layout:
  Warning icon (⚠️) + "Gap Report" header
  Score progress bar: [■■■■■■□□□□] "62 / 80 needed"
  Gap report text (pre-formatted paragraph)
  [Resubmit With Updated URL] button → triggers submission form
```

### `ProjectCard` — List Item

```jsx
Props: project: Project

Layout (compact):
  Top: title (font-semibold) + StatusBadge (right aligned)
  Middle: description (2 lines truncated, text-sm text-gray-600)
  Bottom row: "[N] requirements" · "[X] ALGO" · "[time] ago"
  Footer: App ID (font-mono text-xs) + Explorer link

Hover: shadow-md, border-brand-500 transition-all
Click: navigate to /project/:id
```

### `AlgoAddress` — Wallet Address Display

```jsx
Props: address: string, length?: "short" | "full" (default "short")

short: first 6 chars + "..." + last 4 chars  →  "ALGO3K...X7F2"
full:  full address

Always includes:
  [Copy icon button] → copies full address to clipboard
  On copy: shows "Copied!" tooltip for 2 seconds

Font: JetBrains Mono, text-sm
Color: text-gray-700 bg-gray-100 px-2 py-0.5 rounded
```

---

## 7. User Flows

### Flow 1: Client Creates a Project

```
Landing Page (not logged in)
  └─► [Connect Wallet] → Pera Wallet prompt
      └─► Wallet connected → redirect to /client
          └─► [+ New Project] → form opens (right panel)
              └─► Fill title, description, requirements, ALGO amount
                  └─► [Create & Lock Payment]
                      └─► Loading: "Deploying contract..."
                          └─► Success: App ID displayed + Explorer link
                              └─► Project appears in list (left panel)
                                  └─► [Share Project] → copy link to /project/:id
```

### Flow 2: Developer Accepts and Submits Work

```
/developer (logged in with different wallet)
  └─► Browse open projects grid
      └─► Click project card → requirements expand
          └─► [Accept This Project]
              └─► Transaction signed in Pera Wallet
                  └─► Project moves to "My Active Project"
                      └─► Paste GitHub URL
                          └─► [Submit & Evaluate]
                              └─► Step indicator shows pipeline running
                                  └─► RequirementsChecklist animates row by row
                                      └─► Score < 80: Gap Report card shows
                                          └─► Fix code → [Resubmit]
                                              └─► Re-evaluation runs again
                                                  └─► Score ≥ 80: 🎉 payment released
```

### Flow 3: Both View Project Detail

```
/project/:id (accessible to both parties)
  └─► Status cards: Contract state, Payment, Score, Iteration count
      └─► Requirements table: per-req status + scores
          └─► Contract source label: "From Algorand Chain"
              └─► Evaluation History (collapsed by default)
                  └─► [Expand] → shows submission URL + full report
                      └─► Payment Status: ESCROWED → RELEASED (animated transition)
```

---

## 8. States & Interactions

### Wallet Button States

| State | Appearance | Interaction |
|---|---|---|
| Not connected | "Connect Wallet" — brand-500 filled button | Click → Pera Wallet modal |
| Connecting | Spinner + "Connecting..." — disabled | None |
| Connected | "ALGO...X7F2 🟢" — gray outlined button | Click → dropdown with Disconnect |
| Error | "Connection failed" — red outlined button | Click → retry |

### Form Validation

```
Requirements field:
  - Minimum 1 requirement
  - Each requirement: 10–500 characters
  - Show character count per requirement
  - Error state: red border + "Requirement must be at least 10 characters"

ALGO amount:
  - Minimum: 0.1 ALGO
  - Maximum: 10,000 ALGO (TestNet safety limit)
  - Show USD equivalent (fetch ALGO price from CoinGecko or hardcode for demo)

URL input (submission):
  - Must start with https://
  - Domain must match allowlist: github.com, gitlab.com, vercel.app, netlify.app
  - Real-time validation on input (debounced 300ms)
  - Green tick ✓ when valid, red ✗ with message when invalid
```

### Loading / Empty States

```
Projects list — loading:
  Show 3 skeleton cards (gray animated shimmer rectangles)

Projects list — empty (client):
  "You haven't created any projects yet."
  [Create Your First Project →]

Projects list — empty (developer):
  "No open projects available right now."
  [Refresh] button

Evaluation — no report yet:
  Requirements shown as gray checklist
  "Waiting for developer submission..."

Project Detail — loading:
  Skeleton loaders on all 4 stat cards
  Skeleton rows in requirements table
```

### Micro-interactions

```
Button hover:        brightness-110, translateY(-1px), shadow-md
Button active:       brightness-90, translateY(0)
Card hover:          shadow-md, border-opacity-100 (was 50%)
Copy button:         icon → ✓, tooltip "Copied!" → fade out 2s
Status badge:        subtle pulse animation on "IN REVIEW" state
Score reveal:        counter animation from 0 to final score (1.2s ease-out)
Payment released:    confetti burst (canvas-confetti lib, 0.5s)
Checklist row pass:  green flash (bg transitions green-100 → green-50)
Checklist row fail:  red flash (bg transitions red-100 → red-50)
```

---

## 9. Responsive Design

### Breakpoints (Tailwind)

```
sm:   640px  — mobile landscape
md:   768px  — tablet
lg:   1024px — desktop (primary design target)
xl:   1280px — large desktop
```

### Layout Adaptations

| Element | Mobile (< md) | Desktop (≥ lg) |
|---|---|---|
| Sidebar | Hidden (hamburger menu) | Visible (240px fixed) |
| Client Dashboard | Form below list (full width) | Side by side (55%/40%) |
| Developer Dashboard | Single column | Two columns |
| Project Detail stats | 2×2 grid | 4×1 row |
| Requirements table | Requirement + status only (score/reason hidden) | All columns |
| Navbar | Logo + wallet button only | Full navigation |

### Mobile Navigation

```
Bottom tab bar (mobile only):
  [Projects] [Browse] [Profile]
  
Or hamburger menu → slide-in sidebar (same items as desktop sidebar)
```

---

## 10. Implementation Notes

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          900: "#0A1628",
          700: "#1A3C5E",
          500: "#2E86C1",
          100: "#EAF4FB",
        },
        success: "#1E8449",
        warning: "#D35400",
        danger: "#C0392B",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Courier New", "monospace"],
      },
    }
  }
}
```

### Google Fonts Import (index.html)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
```

### Animation Utilities (global CSS)

```css
@keyframes row-reveal {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-row-reveal {
  animation: row-reveal 300ms ease-out forwards;
}

@keyframes pulse-subtle {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.6; }
}
.animate-pulse-subtle {
  animation: pulse-subtle 1.5s ease-in-out infinite;
}

@keyframes count-up {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```

### 4-Hour Build Priority Order

Given the 4h constraint, build in strict order:

```
H0:30  Scaffold + Tailwind + Router + Zustand store + api.js
H0:30  WalletConnect component + Navbar (auth works)
H1:00  Client Dashboard (form + project list + ProjectCard)
H1:00  Developer Dashboard (marketplace + submission form)
H0:30  RequirementsChecklist animation (THE CENTREPIECE — do not cut)
H0:30  Project Detail page + PaymentStatus component
       ─────────────────────────────────────────────
H0:30  Polish: loading states, empty states, error handling
       ─────────────────────────────────────────────
TOTAL: 4h 00m

If running short → CUT: GapReport detail (show as plain text)
                   CUT: Evaluation History (show only latest)
                   NEVER CUT: RequirementsChecklist animation
                   NEVER CUT: PaymentStatus component
                   NEVER CUT: Wallet connect
```

### NPM Packages Required

```bash
# Core
npm install react-router-dom axios zustand

# Wallet
npm install @perawallet/connect

# Styling
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Utilities
npm install canvas-confetti     # payment release celebration
npm install date-fns             # "2h ago" timestamp formatting

# Total install: ~3 minutes
```

---

> **Design Principle Reminder:** The UI exists to make the demo undeniable.
> Every screen should drive the viewer toward one conclusion:
> *"The contract is real. The AI evaluated real code. The ALGO moved on a real blockchain."*
