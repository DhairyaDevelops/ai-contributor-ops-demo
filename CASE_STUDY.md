# Case study: clear handoffs in contributor operations

**Fieldwork · Independent portfolio project · React and Vite**

## The problem

A submission queue needs more than status labels: it should make ownership, review prerequisites and the next permitted action clear. Fieldwork explores that workflow through 12 invented submissions across three fictional AI-data projects. It contains no real contributors, uploaded media or company records.

## Design choices

The interface separates queue navigation from individual review decisions. Search, project/status filters and derived summary counts help locate work. A detail dialog exposes reviewer assignment, notes and the current session's activity.

Pure functions handle workflow rules independently of the interface. Review cannot start without an assigned reviewer; acceptance and change requests require a note. Unsupported transitions are rejected, and accepted submissions become read-only. Updates are immutable, with summary counts recalculated from current records.

Decisions remain manual and concern simulated submissions—not people's eligibility, hiring or employment. Native dialogs, labeled controls, semantic tables, keyboard-focus styles and reduced-motion handling support the interaction without claiming formal accessibility certification.

## Walk through the demonstration

1. Open **Organize a shelf — FW-1041**, initially submitted and unassigned.
2. Select **Start review**. The prerequisite message explains why the action cannot proceed.
3. Assign `REV-01`, start review and enter a fictional note such as “Clarify the final step.”
4. Request changes, mark the item submitted again, restart review, update the note and accept it.
5. Inspect the updated counts and activity history. Filter for accepted submissions, then use **Reset demo** to restore the original queue.

This walkthrough demonstrates transitions and feedback—not measured time savings, real reviews or production usage.

## Verification

**12 automated workflow/data tests passed.** They cover seed-data isolation, reviewer validation, every allowed and disallowed transition, required notes, immutable updates, accepted-record protection, filtering and derived counts.

```shell
npm ci
npm test
npm run dev
```

These tests verify logic, not exhaustive browser compatibility or accessibility.

## Boundaries and contribution

Built with AI-assisted implementation support, this project demonstrates operational interface design, explicit workflow rules and safe demonstration data. It is not represented as unaided work or deployed company software.

Edits stay in browser memory and disappear on refresh. Notes save only when a status action succeeds. There are no accounts, uploads, payments, analytics, service calls or persistence. Real use would require authentication, authorization, durable audit records, secure data handling and a separate privacy review. Use fictional, non-sensitive notes only.
