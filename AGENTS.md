# Agentic Planning & Task Tracking System

> A file-based planning, tracking, and memory structure for AI agent workflows.
> Planner agents generate plans; `agentic-app-implementer` agents consume, execute, and resolve them.

---

## Directory Structure

/plan
├── README.md
├── /feature
│   ├── /[feature-name]
│   │   ├── plan.md
│   │   └── bug.md
│   └── bug.md                  ← global bugs
└── /archive
    └── /[completed-feature-name]
        ├── plan.md
        └── bug.md

---

## Feature Plan Template — plan.md

---
id: feat-[slug]
title: "[Feature Name]"
status: pending | in-progress | blocked | complete
priority: low | medium | high | critical
created: YYYY-MM-DD
updated: YYYY-MM-DD
agent: agentic-app-implementer
docs_ref: /docs/[relevant-doc].md
related_bugs: []
---

## Overview
> Summary of the feature and why it exists.

## Context
- **Docs:** `/docs/[feature-name].md`
- **Affected scripts:** `src/[module].ts`
- **Dependencies:** ...
- **Blockers:** ...

---

## Tasks

Progress: 0 / N tasks complete

### Phase 1: [Name]

1. **Step 1**: Description.
   - [ ] Sub-task A
   - [ ] Sub-task B
   - **Resources:** `/docs/spec.md`, `src/module.ts`
   - **Acceptance:** Testable condition

2. **Step 2**: Description.
   - [ ] Sub-task A
   - **Resources:** ...
   - **Acceptance:** ...

---

## Agent Notes
> agentic-app-implementer appends here. Do not pre-populate.

---

## Completion Checklist
- [ ] All tasks marked complete
- [ ] Bug references resolved or logged in bug.md
- [ ] /docs updated if behaviour changed
- [ ] Feature moved to /plan/archive/ after sign-off

---

## Bug Report Template — bug.md

---
feature: [feature-name] | global
last_updated: YYYY-MM-DD
open_count: 0
resolved_count: 0
---

## Active Bugs
_No active bugs._

---

## Resolved Bugs
_No resolved bugs._

---

## Memory Structure

| Signal         | Where it lives                    | Read by              |
|----------------|-----------------------------------|----------------------|
| Feature intent | plan.md → Overview                | Planner, Implementer |
| Task state     | plan.md → - [x] / - [ ]          | Implementer          |
| Execution log  | plan.md → Agent Notes             | Implementer          |
| Feature status | plan.md → frontmatter status      | Orchestrator         |
| Active bugs    | bug.md → Active Bugs              | Implementer, Planner |
| Resolved bugs  | bug.md → Resolved Bugs            | Planner (history)    |
| Completed work | /archive/ folder                  | Planner (reference)  |
