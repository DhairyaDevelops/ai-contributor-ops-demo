import test from "node:test";
import assert from "node:assert/strict";
import { exampleBriefs, types, validateBrief, buildPlan, toMarkdown, ValidationError } from "../public/planner/planner.js";

const fixture = (changes = {}) => ({ ...exampleBriefs[0].fields, ...changes });

test("all three fictional presets validate without preconfirming rights", () => {
  assert.equal(exampleBriefs.length, 3);
  assert.deepEqual(exampleBriefs.map((example) => example.fields.type), ["llm", "video", "voice"]);
  for (const example of exampleBriefs) {
    assert.deepEqual(validateBrief(example.fields), {});
    assert.equal(example.fields.rightsConfirmed, false);
    assert.equal(example.fields.acceptanceDefined, false);
  }
});

test("types expose four checks and deliverables for every program", () => {
  for (const type of Object.values(types)) {
    assert.equal(type.checks.length, 4);
    assert.equal(type.deliverables.length, 4);
    assert.ok(type.label && type.unit);
  }
});

test("nonobject briefs and unknown or prototype-like types are rejected", () => {
  for (const value of [null, undefined, [], "brief", true, 12]) assert.ok(validateBrief(value).form);
  for (const type of ["other", "LLM", "constructor", "__proto__", {}, null]) assert.ok(validateBrief(fixture({ type })).type);
});

test("name and purpose length limits use normalized text", () => {
  for (const name of ["", "ab", "a".repeat(81), null, 123]) assert.ok(validateBrief(fixture({ name })).name);
  for (const purpose of ["short", "a".repeat(501), null, 123]) assert.ok(validateBrief(fixture({ purpose })).purpose);
  assert.deepEqual(validateBrief(fixture({ name: "  abc  ", purpose: "a".repeat(12) })), {});
});

test("numeric validation rejects blanks booleans objects and nonfinite numbers", () => {
  for (const field of ["units", "minutesPerUnit", "reviewPercent", "reviewMinutes", "people", "days", "hoursPerDay"]) {
    for (const value of ["", " ", true, false, null, undefined, {}, [], NaN, Infinity, "Infinity", "0x10"]) {
      assert.ok(validateBrief(fixture({ [field]: value }))[field], `${field}: ${String(value)}`);
    }
  }
});

test("all numeric lower and upper bounds are enforced", () => {
  const bounds = { units: [1, 100000], minutesPerUnit: [0.5, 120], reviewPercent: [1, 100], reviewMinutes: [0.5, 120], people: [1, 1000], days: [1, 180], hoursPerDay: [0.5, 8] };
  for (const [field, [minimum, maximum]] of Object.entries(bounds)) {
    assert.ok(validateBrief(fixture({ [field]: minimum - 0.01 }))[field]);
    assert.ok(validateBrief(fixture({ [field]: maximum + 0.01 }))[field]);
    assert.equal(validateBrief(fixture({ [field]: minimum }))[field], undefined);
    assert.equal(validateBrief(fixture({ [field]: maximum }))[field], undefined);
  }
});

test("unit people and day values must be integers", () => {
  for (const field of ["units", "people", "days"]) assert.ok(validateBrief(fixture({ [field]: 2.5 }))[field]);
});

test("form numeric strings normalize to finite numbers", () => {
  const plan = buildPlan(fixture({ units: " 900 ", minutesPerUnit: "4", reviewPercent: "20", reviewMinutes: "2", people: "3", days: "5", hoursPerDay: "5" }));
  for (const field of ["units", "minutesPerUnit", "reviewPercent", "reviewMinutes", "people", "days", "hoursPerDay"]) assert.equal(typeof plan.brief[field], "number");
  assert.equal(plan.metrics.totalHours, 66);
});

test("checkboxes default false and reject truthy text or number substitutes", () => {
  const brief = fixture();
  delete brief.rightsConfirmed;
  delete brief.acceptanceDefined;
  const plan = buildPlan(brief);
  assert.equal(plan.brief.rightsConfirmed, false);
  assert.equal(plan.brief.acceptanceDefined, false);
  for (const field of ["rightsConfirmed", "acceptanceDefined"]) {
    for (const value of ["true", "false", 1, 0, null]) assert.ok(validateBrief(fixture({ [field]: value }))[field]);
  }
});

test("invalid buildPlan calls throw a structured ValidationError", () => {
  assert.throws(() => buildPlan(fixture({ units: 0, name: "x" })), (error) => error instanceof ValidationError && Boolean(error.errors.units) && Boolean(error.errors.name));
});

test("known example produces exact workload and utilization metrics", () => {
  assert.deepEqual(buildPlan(fixture()).metrics, {
    productionHours: 60, reviewHours: 6, totalHours: 66,
    availableHours: 75, capacityGapHours: 0, capacityPercent: 88, reviewUnits: 180,
  });
});

test("review sample rounds upward to whole units before calculating hours", () => {
  const plan = buildPlan(fixture({ units: 3, reviewPercent: 1, reviewMinutes: 30 }));
  assert.equal(plan.metrics.reviewUnits, 1);
  assert.equal(plan.metrics.reviewHours, 0.5);
});

test("capacity shortfalls are positive and generate a blocker", () => {
  const plan = buildPlan(exampleBriefs[1].fields);
  assert.equal(plan.metrics.totalHours, 39.75);
  assert.equal(plan.metrics.availableHours, 32);
  assert.equal(plan.metrics.capacityGapHours, 7.75);
  assert.equal(plan.metrics.capacityPercent, 124.22);
  assert.equal(plan.blockers.length, 3);
});

test("capacity blocker uses unrounded values even when displayed hours match", () => {
  const plan = buildPlan(fixture({ units: 1, minutesPerUnit: 29.6, reviewPercent: 1, reviewMinutes: 0.5, people: 1, days: 1, hoursPerDay: 0.5, rightsConfirmed: true, acceptanceDefined: true }));
  assert.equal(plan.metrics.totalHours, 0.5);
  assert.equal(plan.metrics.availableHours, 0.5);
  assert.equal(plan.metrics.capacityGapHours, 0);
  assert.equal(plan.blockers.length, 1);
});

test("exactly sufficient capacity does not create a capacity blocker", () => {
  const plan = buildPlan(fixture({ units: 1, minutesPerUnit: 29.5, reviewPercent: 100, reviewMinutes: 0.5, people: 1, days: 1, hoursPerDay: 0.5, rightsConfirmed: true, acceptanceDefined: true }));
  assert.equal(plan.metrics.capacityPercent, 100);
  assert.equal(plan.blockers.length, 0);
});

test("rights and acceptance gates remain independent user statements", () => {
  assert.equal(buildPlan(fixture()).blockers.length, 2);
  assert.equal(buildPlan(fixture({ rightsConfirmed: true })).blockers.length, 1);
  assert.equal(buildPlan(fixture({ acceptanceDefined: true })).blockers.length, 1);
  assert.equal(buildPlan(fixture({ rightsConfirmed: true, acceptanceDefined: true })).blockers.length, 0);
  assert.match(buildPlan(fixture()).assumptions.join(" "), /does not verify permissions/);
});

test("plan has five owned stages and explicitly states shared pool exclusions", () => {
  const plan = buildPlan(fixture());
  assert.deepEqual(plan.stages.map((stage) => stage.title), ["Intake", "Pilot", "Produce", "Review", "Deliver"]);
  assert.ok(plan.stages.every((stage) => stage.id && stage.owner && stage.tasks.length));
  assert.match(plan.assumptions.join(" "), /shared production-and-review pool/);
  assert.match(plan.assumptions.join(" "), /excludes pilot work, onboarding, rework, idle time/);
});

test("building and exporting do not mutate input presets plans or options", () => {
  const input = fixture();
  const beforeInput = structuredClone(input);
  const plan = buildPlan(input);
  const beforePlan = structuredClone(plan);
  const options = { confirmedChecks: [plan.checks[0]], reviewed: true };
  const beforeOptions = structuredClone(options);
  toMarkdown(plan, options);
  assert.deepEqual(input, beforeInput);
  assert.deepEqual(plan, beforePlan);
  assert.deepEqual(options, beforeOptions);
  assert.ok(Object.isFrozen(exampleBriefs[0].fields));
});

test("normalization removes controls and collapses supplied line breaks", () => {
  const plan = buildPlan(fixture({ name: "  Demo\n\tbrief\u202E  ", purpose: "A fictional\n\tbrief with\u0000 no private material.  ", ignored: "not carried forward" }));
  assert.equal(plan.brief.name, "Demo brief");
  assert.equal(plan.brief.purpose, "A fictional brief with no private material.");
  assert.equal(plan.brief.ignored, undefined);
});

test("Markdown export is deterministic and uses explicit synthetic limits", () => {
  const plan = buildPlan(fixture());
  assert.equal(toMarkdown(plan), toMarkdown(buildPlan(fixture())));
  assert.match(toMarkdown(plan), /FICTIONAL PLANNING DEMONSTRATION/);
  assert.match(toMarkdown(plan), /not yet marked reviewed/);
  assert.match(toMarkdown(plan), /Capacity utilization: 88\.00%/);
});

test("Markdown escapes adversarial headings HTML links fences and checkboxes", () => {
  const plan = buildPlan(fixture({ name: "<script>alert(1)</script>", purpose: "Safe description\n# APPROVED\n- [x] verified\n```html\n<a href='https://bad.test'>trust me</a>" }));
  const markdown = toMarkdown(plan);
  assert.doesNotMatch(markdown, /<script>|<a |\n# APPROVED|\n- \[x\] verified|```html/);
  assert.match(markdown, /&lt;script&gt;/);
  assert.match(markdown, /\\# APPROVED/);
  assert.match(markdown, /\\\[x\\\]/);
});

test("only exact known checklist strings can be acknowledged in the export", () => {
  const plan = buildPlan(fixture());
  const markdown = toMarkdown(plan, { confirmedChecks: [plan.checks[0], plan.checks[0], "INJECTED\n# Fake approval"], reviewed: true });
  assert.equal((markdown.match(/^- \[x\]/gm) || []).length, 1);
  assert.doesNotMatch(markdown, /INJECTED|Fake approval/);
  assert.match(markdown, /marked reviewed by the demo user; not independently verified/);
  assert.match(toMarkdown(plan, { reviewed: "true" }), /not yet marked reviewed/);
});

test("export recomputes metrics and blockers instead of trusting altered plan fields", () => {
  const plan = buildPlan(exampleBriefs[1].fields);
  plan.blockers = [];
  plan.metrics.capacityPercent = 0;
  plan.stages = [{ title: "INJECTED", tasks: [] }];
  const markdown = toMarkdown(plan, { confirmedChecks: plan.checks, reviewed: true });
  assert.match(markdown, /124\.22%/);
  assert.match(markdown, /exceed the shared team's available hours/);
  assert.doesNotMatch(markdown, /INJECTED/);
});

test("empty-blocker export is not an approval and malformed export inputs fail", () => {
  assert.match(toMarkdown(buildPlan(fixture({ rightsConfirmed: true, acceptanceDefined: true }))), /not a launch approval/);
  assert.throws(() => toMarkdown({}), ValidationError);
  assert.throws(() => toMarkdown(buildPlan(fixture()), { confirmedChecks: "all" }), TypeError);
});

test("reviewed acknowledgment cannot complete export while blockers or checks remain", () => {
  const blocked = buildPlan(fixture());
  assert.match(toMarkdown(blocked, { reviewed: true, confirmedChecks: blocked.checks }), /Status: DRAFT SCENARIO/);
  const unblocked = buildPlan(fixture({ rightsConfirmed: true, acceptanceDefined: true }));
  assert.match(toMarkdown(unblocked, { reviewed: true, confirmedChecks: unblocked.checks.slice(1) }), /Status: DRAFT SCENARIO/);
  assert.match(toMarkdown(unblocked, { reviewed: false, confirmedChecks: unblocked.checks }), /Status: DRAFT SCENARIO/);
});

test("complete demo review requires all three prerequisites and includes formulas", () => {
  const plan = buildPlan(fixture({ rightsConfirmed: true, acceptanceDefined: true }));
  const markdown = toMarkdown(plan, { reviewed: true, confirmedChecks: plan.checks });
  assert.match(markdown, /Status: DEMO REVIEW COMPLETE/);
  assert.doesNotMatch(markdown, /Status: DRAFT SCENARIO/);
  assert.match(markdown, /not launch approval or independent verification/);
  assert.match(plan.assumptions.join(" "), /Production hours = units × minutes per unit ÷ 60/);
  assert.match(plan.assumptions.join(" "), /Review hours = ceil\(units × review percentage ÷ 100\) × review minutes ÷ 60/);
  assert.match(plan.assumptions.join(" "), /Available hours = people × working days × hours per day/);
});
