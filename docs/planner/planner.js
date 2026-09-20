/**
 * Local, deterministic planning arithmetic for fictional AI-data briefs.
 * No network, storage, model inference, rights verification or hiring decisions.
 */

const freezeType = (value) => Object.freeze({
  ...value,
  checks: Object.freeze(value.checks),
  deliverables: Object.freeze(value.deliverables),
});

export const types = Object.freeze({
  llm: freezeType({
    label: "LLM response review",
    unit: "responses",
    checks: [
      "The reference material and scoring anchors have been reviewed.",
      "Critical-failure rules and escalation steps are written down.",
      "The pilot uses the same task instructions as the planned production work.",
      "The review sample and disagreement-handling process are defined.",
    ],
    deliverables: [
      "Approved task instructions and review rubric",
      "Response-level review log with human notes",
      "Quality-review summary and unresolved issues",
      "Delivery manifest with version and scope notes",
    ],
  }),
  video: freezeType({
    label: "Physical-AI video program",
    unit: "clips",
    checks: [
      "Participant permission and recording-location requirements are documented.",
      "The recording instructions exclude unsafe tasks and private bystander data.",
      "Clip framing, continuity and file-format acceptance criteria are defined.",
      "The review sample includes the agreed task categories and exception handling.",
    ],
    deliverables: [
      "Approved recording instructions and task list",
      "Clip manifest with agreed non-sensitive metadata",
      "Human quality-review log and exception list",
      "Delivery checklist and versioned handover notes",
    ],
  }),
  voice: freezeType({
    label: "Language and voice program",
    unit: "recordings",
    checks: [
      "Speaker permission and permitted uses of the recordings are documented.",
      "The prompt set, language coverage and pronunciation guidance are reviewed.",
      "Audio format, background-noise and clipping acceptance criteria are defined.",
      "The review sample and escalation route for unclear recordings are defined.",
    ],
    deliverables: [
      "Approved prompt set and recording instructions",
      "Recording manifest with agreed language labels",
      "Human audio-review log and correction requests",
      "Delivery checklist and unresolved-issue summary",
    ],
  }),
});

export const exampleBriefs = Object.freeze([
  {
    key: "support-review",
    label: "Fictional support-response review",
    fields: {
      name: "CedarDesk response-review pilot",
      type: "llm",
      units: 900,
      minutesPerUnit: 4,
      reviewPercent: 20,
      reviewMinutes: 2,
      people: 3,
      days: 5,
      hoursPerDay: 5,
      purpose: "Plan a fictional response-review exercise against a supplied support-policy reference and written scoring rubric.",
      rightsConfirmed: false,
      acceptanceDefined: false,
    },
  },
  {
    key: "everyday-actions",
    label: "Fictional everyday-action video collection",
    fields: {
      name: "Everyday-action clip planning exercise",
      type: "video",
      units: 180,
      minutesPerUnit: 12,
      reviewPercent: 25,
      reviewMinutes: 5,
      people: 2,
      days: 4,
      hoursPerDay: 4,
      purpose: "Plan a fictional collection of safe everyday-action clips with documented participant permission and human quality review.",
      rightsConfirmed: false,
      acceptanceDefined: false,
    },
  },
  {
    key: "language-prompts",
    label: "Fictional language-prompt recording program",
    fields: {
      name: "Language-prompt recording exercise",
      type: "voice",
      units: 1200,
      minutesPerUnit: 2.5,
      reviewPercent: 15,
      reviewMinutes: 1.5,
      people: 4,
      days: 5,
      hoursPerDay: 4,
      purpose: "Plan fictional recordings of approved neutral prompts, with defined language coverage, permitted uses and audio-quality checks.",
      rightsConfirmed: false,
      acceptanceDefined: false,
    },
  },
].map((preset) => Object.freeze({ ...preset, fields: Object.freeze(preset.fields) })));

const numericFields = Object.freeze({
  units: { min: 1, max: 100000, integer: true, label: "Units" },
  minutesPerUnit: { min: 0.5, max: 120, label: "Production minutes per unit" },
  reviewPercent: { min: 1, max: 100, label: "Review percentage" },
  reviewMinutes: { min: 0.5, max: 120, label: "Review minutes per sampled unit" },
  people: { min: 1, max: 1000, integer: true, label: "People" },
  days: { min: 1, max: 180, integer: true, label: "Working days" },
  hoursPerDay: { min: 0.5, max: 8, label: "Available hours per person per day" },
});

// Keep ordinary Unicode text, but remove invisible direction controls and fold
// line breaks so supplied text cannot manufacture Markdown report sections.
function cleanText(value) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069]/g, "")
    .replace(/\s+/gu, " ")
    .trim();
}

function numericValue(value) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return Number.NaN;
  const trimmed = value.trim();
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(trimmed)) return Number.NaN;
  return Number(trimmed);
}

function isBriefObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function validateBrief(input) {
  if (!isBriefObject(input)) return { form: "Enter a valid project brief." };
  const errors = {};
  const name = cleanText(input.name);
  const purpose = cleanText(input.purpose);
  if (name.length < 3 || name.length > 80) errors.name = "Use a project name between 3 and 80 characters.";
  if (typeof input.type !== "string" || !Object.hasOwn(types, input.type)) errors.type = "Choose a supported program type.";
  if (purpose.length < 12 || purpose.length > 500) errors.purpose = "Describe the purpose in 12–500 characters.";
  for (const [field, rule] of Object.entries(numericFields)) {
    const value = numericValue(input[field]);
    if (!Number.isFinite(value) || value < rule.min || value > rule.max || (rule.integer && !Number.isInteger(value))) {
      errors[field] = `${rule.label} must be ${rule.integer ? "a whole number" : "a number"} from ${rule.min} to ${rule.max}.`;
    }
  }
  for (const field of ["rightsConfirmed", "acceptanceDefined"]) {
    if (input[field] !== undefined && typeof input[field] !== "boolean") {
      errors[field] = "Use a true or false confirmation, not text or a number.";
    }
  }
  return errors;
}

export class ValidationError extends Error {
  constructor(errors) {
    super("The brief contains invalid fields.");
    this.name = "ValidationError";
    this.errors = { ...errors };
  }
}

const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

export function buildPlan(input) {
  const errors = validateBrief(input);
  if (Object.keys(errors).length) throw new ValidationError(errors);
  const brief = {
    name: cleanText(input.name),
    type: input.type,
    ...Object.fromEntries(Object.keys(numericFields).map((field) => [field, numericValue(input[field])])),
    purpose: cleanText(input.purpose),
    rightsConfirmed: input.rightsConfirmed ?? false,
    acceptanceDefined: input.acceptanceDefined ?? false,
  };
  const type = types[brief.type];
  const productionHours = brief.units * brief.minutesPerUnit / 60;
  const reviewUnits = Math.ceil(brief.units * brief.reviewPercent / 100);
  const reviewHours = reviewUnits * brief.reviewMinutes / 60;
  const totalHours = productionHours + reviewHours;
  const availableHours = brief.people * brief.days * brief.hoursPerDay;
  const blockers = [];
  if (!brief.rightsConfirmed) blockers.push("Rights and permitted data use have not been confirmed by the planner user. Resolve this before collecting or processing material.");
  if (!brief.acceptanceDefined) blockers.push("Acceptance criteria have not been confirmed as defined. Agree them before the pilot and production work.");
  if (availableHours < totalHours) blockers.push("Estimated production and review hours exceed the shared team's available hours. Reduce scope or revise the time/capacity assumptions.");

  return {
    brief,
    metrics: {
      productionHours: round2(productionHours),
      reviewHours: round2(reviewHours),
      totalHours: round2(totalHours),
      availableHours: round2(availableHours),
      capacityGapHours: round2(Math.max(0, totalHours - availableHours)),
      capacityPercent: round2(totalHours / availableHours * 100),
      reviewUnits,
    },
    stages: [
      { id: "intake", title: "Intake", owner: "Program owner", tasks: [
        "Confirm the intended use, material permissions and allowed processing tools with the project owner.",
        "Agree task instructions, acceptance criteria, escalation contacts and delivery scope.",
        "Use synthetic or properly authorized material; do not enter real personal data into this demo.",
      ] },
      { id: "pilot", title: "Pilot", owner: "Program owner and review lead", tasks: [
        `Run a separately scoped pilot using the ${type.label.toLowerCase()} instructions.`,
        "Check timing assumptions, reviewer consistency and ambiguous instructions before scaling.",
        "Revisit the plan after the pilot; pilot effort and rework are not included in this estimate.",
      ] },
      { id: "produce", title: "Produce", owner: "Contributor team", tasks: [
        `Work through the ${brief.units} planned ${type.unit} using the approved task instructions.`,
        "Track task status and non-sensitive identifiers; escalate exceptions instead of inventing missing information.",
        "Coordinate production and review within the shared staffing pool to avoid double-booking capacity.",
      ] },
      { id: "review", title: "Review", owner: "Human review lead", tasks: [
        `Review ${reviewUnits} ${type.unit} (${brief.reviewPercent}% requested sampling, rounded up to whole units).`,
        "Apply the agreed acceptance rules, record reasons and send unclear or failed work for human follow-up.",
        "Choose the sample deliberately; a sampling percentage alone does not guarantee representative coverage or quality.",
      ] },
      { id: "deliver", title: "Deliver", owner: "Delivery owner", tasks: [
        ...type.deliverables.map((deliverable) => `Prepare: ${deliverable}.`),
        "Confirm authorized recipients and handover requirements; document unresolved issues before release.",
      ] },
    ],
    blockers,
    assumptions: [
      "Production hours = units × minutes per unit ÷ 60. Review hours = ceil(units × review percentage ÷ 100) × review minutes ÷ 60. Available hours = people × working days × hours per day.",
      "All people form one shared production-and-review pool; availability is not a dedicated production team plus an additional review team.",
      "The estimate excludes pilot work, onboarding, rework, idle time, breaks, coordination and handover effort; allow for those separately.",
      "Working days and hours are supplied planning assumptions, not calendar dates, staffing commitments or productivity evidence.",
      "Review units are rounded up to whole units; sample choice, independence and coverage still require human planning.",
      "Capacity percent means required production-plus-review hours divided by available hours; above 100% indicates a capacity shortfall.",
      "Rights and acceptance checkboxes record user statements only. This tool does not verify permissions, consent, actual data or acceptance criteria.",
      "This is a deterministic planning demonstration, not an AI agent, model evaluation, hiring decision or quality guarantee.",
    ],
    checks: [...type.checks],
  };
}

function markdownText(value) {
  return cleanText(String(value))
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/[\\`*_{}\[\]()#+\-.!|:/@]/g, "\\$&");
}

export function toMarkdown(plan, { confirmedChecks = [], reviewed = false } = {}) {
  if (!isBriefObject(plan) || !isBriefObject(plan.brief)) throw new ValidationError({ form: "Export a valid generated plan." });
  if (!Array.isArray(confirmedChecks)) throw new TypeError("confirmedChecks must be an array.");
  // Recompute rather than trusting edited metrics, omitted blockers or injected
  // stage strings. Review acknowledgments never bypass planning blockers.
  const canonical = buildPlan(plan.brief);
  const { brief, metrics } = canonical;
  const type = types[brief.type];
  const knownChecks = new Set(confirmedChecks.filter((check) => canonical.checks.includes(check)));
  const reviewComplete = reviewed === true && canonical.blockers.length === 0 && canonical.checks.every((check) => knownChecks.has(check));
  const lines = [
    "# AI data program planning brief", "",
    "> FICTIONAL PLANNING DEMONSTRATION — estimates and user acknowledgments, not verified data or business results.", "",
    `Status: ${reviewComplete ? "DEMO REVIEW COMPLETE" : "DRAFT SCENARIO"}`, "",
    "Demo review completion records the user's acknowledgments only; it is not launch approval or independent verification.", "",
    `Project: ${markdownText(brief.name)}`, "",
    `Program: ${markdownText(type.label)}`, "",
    `Purpose: ${markdownText(brief.purpose)}`, "",
    `Reviewer acknowledgment: ${reviewed === true ? "marked reviewed by the demo user; not independently verified" : "not yet marked reviewed"}.`, "",
    "## Input assumptions", "",
    `- Planned volume: ${brief.units} ${type.unit}.`,
    `- Production minutes per unit: ${brief.minutesPerUnit}.`,
    `- Review sample: ${brief.reviewPercent}% requested; ${metrics.reviewUnits} whole units.`,
    `- Review minutes per sampled unit: ${brief.reviewMinutes}.`,
    `- Shared capacity: ${brief.people} people × ${brief.days} working days × ${brief.hoursPerDay} hours per day.`,
    `- Rights statement supplied: ${brief.rightsConfirmed ? "yes" : "no"}; not verified by this tool.`,
    `- Acceptance criteria stated as defined: ${brief.acceptanceDefined ? "yes" : "no"}; criteria are not verified by this tool.`, "",
    "## Capacity estimate", "",
    `- Production: ${metrics.productionHours.toFixed(2)} hours.`,
    `- Review: ${metrics.reviewHours.toFixed(2)} hours.`,
    `- Total estimated effort: ${metrics.totalHours.toFixed(2)} hours.`,
    `- Available shared-team capacity: ${metrics.availableHours.toFixed(2)} hours.`,
    `- Capacity utilization: ${metrics.capacityPercent.toFixed(2)}% (required ÷ available).`,
    `- Capacity shortfall: ${metrics.capacityGapHours.toFixed(2)} hours.`,
    "- Figures are rounded for display; capacity blockers use unrounded calculations.", "",
    "## Planning blockers", "",
    ...(canonical.blockers.length
      ? canonical.blockers.map((blocker) => `- ${markdownText(blocker)}`)
      : ["No blockers from these limited inputs. This is not a launch approval, rights verification or delivery guarantee."]), "",
    "## Human-review checklist", "",
    ...canonical.checks.map((check) => `- [${knownChecks.has(check) ? "x" : " "}] ${markdownText(check)}`), "",
    "Checkboxes record user acknowledgments only; they do not validate the underlying material.", "",
    "## Workflow", "",
  ];
  for (const stage of canonical.stages) {
    lines.push(`### ${markdownText(stage.title)}`, "", `Owner: ${markdownText(stage.owner)}`, "");
    lines.push(...stage.tasks.map((task) => `- ${markdownText(task)}`), "");
  }
  lines.push("## Limitations and assumptions", "", ...canonical.assumptions.map((assumption) => `- ${markdownText(assumption)}`), "");
  return lines.join("\n");
}
