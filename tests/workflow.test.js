import test from "node:test";
import assert from "node:assert/strict";
import { createDemoRecords } from "../src/data.js";
import {
  assignReviewer,
  changeStatus,
  filterRecords,
  summarize,
  transitions,
} from "../src/workflow.js";

test("demo factory returns isolated records and history arrays", () => {
  const a = createDemoRecords();
  const b = createDemoRecords();
  a[0].history.push({ label: "Changed" });
  assert.equal(b[0].history.length, 1);
  assert.equal(b.length, 12);
});
test("summary is based on current records", () => {
  assert.deepEqual(summarize(createDemoRecords()), {
    total: 12,
    awaiting: 3,
    reviewing: 2,
    accepted: 2,
    revisions: 2,
    contributors: 12,
  });
});
test("review cannot begin without assigned reviewer", () => {
  assert.throws(
    () => changeStatus(createDemoRecords()[0], "In review"),
    /Assign a reviewer/,
  );
});
test("assignment and workflow changes are immutable and append history", () => {
  const source = createDemoRecords()[0];
  const assigned = assignReviewer(source, "REV-01");
  const reviewed = changeStatus(assigned, "In review");
  assert.equal(source.reviewer, "");
  assert.equal(source.status, "Submitted");
  assert.equal(reviewed.history.length, 3);
  assert.equal(reviewed.status, "In review");
});
test("review decisions require a nonblank explanatory note", () => {
  const item = createDemoRecords()[1];
  for (const decision of ["Accepted", "Changes requested"]) {
    assert.throws(() => changeStatus(item, decision, "   "), /review note/);
    assert.equal(
      changeStatus(item, decision, "  Checked sequence.  ").note,
      "Checked sequence.",
    );
  }
});
test("every undefined transition is rejected", () => {
  for (const from of Object.keys(transitions)) {
    for (const to of Object.keys(transitions)) {
      const item = { ...createDemoRecords()[1], status: from };
      if (!transitions[from].includes(to))
        assert.throws(
          () => changeStatus(item, to, "Review complete."),
          /not allowed/,
        );
    }
  }
});
test("all defined transitions work when preconditions are met", () => {
  for (const [from, targets] of Object.entries(transitions)) {
    for (const to of targets) {
      assert.equal(
        changeStatus(
          { ...createDemoRecords()[1], status: from },
          to,
          "Review complete.",
        ).status,
        to,
      );
    }
  }
});
test("accepted submissions remain read-only", () => {
  const item = createDemoRecords()[5];
  assert.throws(() => assignReviewer(item, "REV-03"), /read-only/);
  assert.throws(() => changeStatus(item, "Submitted"), /not allowed/);
});
test("reviewer values are validated and active review cannot become unassigned", () => {
  assert.throws(
    () => assignReviewer(createDemoRecords()[0], "Unknown"),
    /valid demo reviewer/,
  );
  assert.throws(
    () => assignReviewer(createDemoRecords()[1], ""),
    /Keep a reviewer/,
  );
});
test("combined search and filters are case-insensitive without mutating records", () => {
  const records = createDemoRecords();
  assert.equal(
    filterRecords(records, {
      search: "  ctr-024 ",
      status: "Submitted",
      project: "Everyday actions",
    }).length,
    1,
  );
  assert.equal(
    filterRecords(records, { search: "CTR-024", status: "Accepted" }).length,
    0,
  );
  assert.equal(filterRecords(records, { search: "does-not-exist" }).length, 0);
  assert.equal(records.length, 12);
});
test("acceptance updates summary and completion marker", () => {
  const records = createDemoRecords();
  const accepted = changeStatus(
    records[1],
    "Accepted",
    "Sequence is complete.",
  );
  records[1] = accepted;
  assert.equal(summarize(records).accepted, 3);
  assert.equal(summarize(records).reviewing, 1);
  assert.equal(accepted.due, "Complete");
});
test("empty collections produce safe zero summaries and empty search results", () => {
  assert.equal(summarize([]).total, 0);
  assert.deepEqual(filterRecords([], {}), []);
});
