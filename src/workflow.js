import { reviewers } from "./data.js";

export const statuses = [
  "Ready",
  "In progress",
  "Submitted",
  "In review",
  "Changes requested",
  "Accepted",
];
export const transitions = Object.freeze({
  Ready: ["In progress"],
  "In progress": ["Submitted"],
  Submitted: ["In review"],
  "In review": ["Accepted", "Changes requested"],
  "Changes requested": ["Submitted"],
  Accepted: [],
});

export function changeStatus(
  record,
  nextStatus,
  note = "",
  at = "This session",
) {
  if (!transitions[record.status]?.includes(nextStatus))
    throw new Error("That workflow transition is not allowed.");
  if (nextStatus === "In review" && !record.reviewer)
    throw new Error("Assign a reviewer before starting the review.");
  if (["Accepted", "Changes requested"].includes(nextStatus) && !note.trim())
    throw new Error("Add a review note before recording this decision.");
  return {
    ...record,
    status: nextStatus,
    note: note.trim() || record.note,
    due: nextStatus === "Accepted" ? "Complete" : record.due,
    history: [
      ...record.history,
      { label: `${record.status} → ${nextStatus}`, at },
    ],
  };
}

export function assignReviewer(record, reviewer, at = "This session") {
  if (reviewer && !reviewers.includes(reviewer))
    throw new Error("Choose a valid demo reviewer.");
  if (record.status === "Accepted")
    throw new Error("Accepted records are read-only in this demo.");
  if (record.status === "In review" && !reviewer)
    throw new Error("Keep a reviewer assigned while a review is in progress.");
  if (record.reviewer === reviewer) return record;
  return {
    ...record,
    reviewer,
    history: [
      ...record.history,
      {
        label: reviewer ? `Assigned to ${reviewer}` : "Reviewer unassigned",
        at,
      },
    ],
  };
}

export function filterRecords(
  records,
  { search = "", status = "All statuses", project = "All projects" },
) {
  const query = search.trim().toLowerCase();
  return records.filter(
    (record) =>
      (status === "All statuses" || record.status === status) &&
      (project === "All projects" || record.project === project) &&
      (!query ||
        [
          record.id,
          record.contributor,
          record.title,
          record.project,
          record.reviewer,
        ].some((value) => value.toLowerCase().includes(query))),
  );
}

export function summarize(records) {
  return {
    total: records.length,
    awaiting: records.filter((r) => r.status === "Submitted").length,
    reviewing: records.filter((r) => r.status === "In review").length,
    accepted: records.filter((r) => r.status === "Accepted").length,
    revisions: records.filter((r) => r.status === "Changes requested").length,
    contributors: new Set(records.map((r) => r.contributor)).size,
  };
}
