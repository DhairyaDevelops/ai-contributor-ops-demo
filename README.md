# Fieldwork — AI contributor operations demo

An original, responsive React portfolio project showing how a small team can route AI-data tasks and keep submission-review handoffs clear. **All records are fictional.** This is a metadata-only simulation, not company software, a live contributor system, or an AI model.

## What to try

1. Open **Organize a shelf (FW-1041)**, which starts as submitted and unassigned.
2. Try **Start review**. The app asks you to assign a reviewer first.
3. Assign a fictional reviewer, start the review, and add a non-sensitive example note.
4. Request changes, mark the item submitted again, then restart review and accept it.
5. Watch the queue, summary counts and session activity update. Search an ID, combine project/status filters, and use **Reset demo** to restore the original records.

Acceptance is a simulated decision about a submission, **not a judgment about a person or an employment decision**. No automated scoring, candidate ranking or hiring recommendations are implemented.

## Features

- Twelve invented submissions across three fictional video/audio task projects.
- Search by task, contributor ID, project, submission ID or reviewer ID.
- Combined project and status filters, clear empty states, and clickable summary counts.
- Manual reviewer routing and validated submission transitions.
- Required notes for acceptance or change requests; accepted records are read-only.
- A per-record activity history for the current browser session.
- Responsive layout, semantic tables, labeled inputs, a skip link, visible keyboard focus, reduced-motion support and native modal dialogs.
- Reset control and persistent synthetic-data disclosure.

## Run locally

Requires **Node.js 22.12 or newer** and npm. Use the supplied lockfile for repeatable dependency installation.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. The development server binds to `127.0.0.1` by default.

```sh
npm test         # Pure workflow/data tests using Node's built-in test runner
npm run build   # Production bundle in dist/
npm run preview # Preview the production build locally
```

The built `dist/` directory can be served by a static host. There are no client-side routes requiring a server fallback. It is not included in this repository.

## Workflow rules

```text
Ready → In progress → Submitted → In review → Accepted
                           ↑          |
                           └─ Changes requested
```

- Starting review requires an assigned reviewer.
- Acceptance and change requests require a written note.
- Active reviews cannot be left without a reviewer.
- Unsupported transitions are rejected rather than silently applied.
- All operations update records immutably; summary numbers are derived from current records.

## Project structure

```text
src/App.jsx            UI, dialogs and session state
src/styles.css         Responsive visual system
src/data.js            Synthetic seed metadata and reviewer IDs
src/workflow.js        Pure validation, transition, filtering and summary logic
src/main.jsx           React entry point
tests/workflow.test.js  Automated logic tests
```

## Scope and limitations

This project demonstrates operational UI design and workflow reasoning. It does **not** provide authentication, permissions enforcement, a backend, uploads, persistence, media playback, AI evaluation, real contributor management, payments, service integrations or production monitoring. Units and relative due labels are fixed illustrative metadata, not measured outcomes or live dates. Activity times intentionally say “This session” rather than inventing historical timestamps.

All changes live in React's in-memory state and disappear on refresh. Review notes only save when a status action succeeds. Concurrent users, durable audit logs, authentication/authorization, privacy review, consent handling, data retention and secure media processing would need separate design before any real deployment. Accessibility features are intentional but are not a claim of formal accessibility certification or exhaustive device/browser testing.

## Privacy and security

The production application contains **no service API calls, analytics, third-party fonts, external embeds, cookies, local storage or credentials**. It loads its own static files; Vite's development server uses its normal local development connection. Do not type real personal information or confidential material into the demo. No files are uploaded. Reviewer and contributor IDs are invented; the fictional records do not represent actual individuals or clients. User-written notes are rendered as plain React text, not injected HTML.

No company code, assets, model responses, applicant records or paid-client materials are used. Do not add them without the appropriate rights and privacy controls. Do not commit `.env` files, secrets, private exports, dependency folders or build output.

## Provenance

Created as an independent portfolio demonstration for **Dhairya Sharma**, informed by experience with contributor operations and AI data program delivery. Built with AI-assisted implementation support (Codex). That assistance is disclosed; this repository is not evidence that every line was written unaided, nor a claim of company deployment or paid customer usage. The workflow logic has automated tests; see the commands above to reproduce them. Review and test any extension before relying on it.

No open-source license has been selected for this repository. Public visibility alone does not grant reuse rights.
