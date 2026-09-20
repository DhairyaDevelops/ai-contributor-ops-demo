import { exampleBriefs, types, validateBrief, buildPlan, toMarkdown } from './planner.js';

const byId = (id) => document.getElementById(id);
const form = byId('brief-form');
const inputKeys = ['name', 'type', 'purpose', 'units', 'minutesPerUnit', 'reviewPercent', 'reviewMinutes', 'people', 'days', 'hoursPerDay', 'rightsConfirmed', 'acceptanceDefined'];
const checkKeys = ['rightsConfirmed', 'acceptanceDefined'];
let plan = null;
let stale = false;
let confirmed = new Set();
const format = (value) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
const element = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
};

for (const [key, config] of Object.entries(types)) {
  const option = element('option', config.label);
  option.value = key;
  byId('type').append(option);
}
for (const preset of exampleBriefs) {
  const option = element('option', preset.label);
  option.value = preset.key;
  byId('preset').append(option);
}

function readBrief() {
  return Object.fromEntries(inputKeys.map((key) => [key, checkKeys.includes(key) ? byId(key).checked : byId(key).value]));
}

function clearErrors() {
  for (const key of inputKeys) {
    const error = byId(`${key}-error`);
    if (error) error.textContent = '';
    byId(key).removeAttribute('aria-invalid');
  }
  byId('form-status').textContent = '';
}

function reviewState() {
  byId('export-preview').hidden = true;
  byId('markdown-preview').value = '';
  const allChecked = plan && confirmed.size === plan.checks.length;
  const ready = Boolean(plan && !stale && !plan.blockers.length && allChecked && byId('reviewed').checked);
  byId('download-draft').disabled = !plan || stale;
  byId('download-reviewed').disabled = !ready;
  byId('review-count').textContent = `${confirmed.size} / ${plan?.checks.length || 0} CHECKED`;
  byId('plan-state').textContent = stale ? 'REBUILD REQUIRED' : ready ? 'DEMO REVIEW COMPLETE' : 'DRAFT SCENARIO';
  byId('plan-state').classList.toggle('ready', ready);
  byId('reviewed').disabled = stale;
  for (const input of byId('checks').querySelectorAll('input')) input.disabled = stale;
  byId('export-help').textContent = stale
    ? 'Rebuild after editing. Previous review checks have been cleared.'
    : ready
      ? 'All demo gates and manual checks are complete. This is not production approval.'
      : 'Drafts can include open questions. Reviewed export requires zero blockers, every checklist item and your acknowledgement.';
}

function markStale() {
  stale = true;
  confirmed.clear();
  byId('reviewed').checked = false;
  for (const input of byId('checks').querySelectorAll('input')) input.checked = false;
  byId('stale-banner').hidden = false;
  byId('form-status').textContent = 'Brief changed. Build a new plan to update the results.';
  byId('export-status').textContent = '';
  byId('export-preview').hidden = true;
  byId('markdown-preview').value = '';
  reviewState();
}

function renderPlan() {
  const { brief, metrics, blockers, stages, checks, assumptions } = plan;
  stale = false;
  confirmed.clear();
  byId('reviewed').checked = false;
  byId('stale-banner').hidden = true;
  byId('plan-context').textContent = `${brief.name} · ${types[brief.type].label} · ${format(brief.units)} units`;
  byId('total-hours').textContent = `${format(metrics.totalHours)} h`;
  byId('available-hours').textContent = `${format(metrics.availableHours)} h`;
  byId('capacity-percent').textContent = `${format(metrics.capacityPercent)}%`;
  const exactGap = brief.units * brief.minutesPerUnit / 60 + metrics.reviewUnits * brief.reviewMinutes / 60 - brief.people * brief.days * brief.hoursPerDay;
  byId('capacity-detail').textContent = exactGap > 0
    ? `${metrics.capacityGapHours === 0 ? '<0.01' : format(metrics.capacityGapHours)} h above capacity`
    : `${format(Math.max(0, metrics.availableHours - metrics.totalHours))} h remaining before contingency`;
  byId('production-detail').textContent = `Production: ${format(metrics.productionHours)} h`;
  byId('review-detail').textContent = `Review: ${format(metrics.reviewUnits)} units · ${format(metrics.reviewHours)} h`;
  byId('gate-count').textContent = blockers.length ? `${blockers.length} OPEN ${blockers.length === 1 ? 'GATE' : 'GATES'}` : 'NO OPEN GATES';
  byId('blockers').replaceChildren(...(blockers.length
    ? blockers.map((text) => element('li', text))
    : [element('li', 'No blockers under the assumptions entered. A real project still needs independent review.', 'clear')]));
  byId('stages').replaceChildren(...stages.map((stage, index) => {
    const item = element('li', undefined, 'stage');
    item.append(element('span', String(index + 1).padStart(2, '0'), 'step-number'));
    const content = element('div');
    const heading = element('div', undefined, 'step-heading');
    heading.append(element('h4', stage.title), element('span', stage.owner));
    const tasks = element('ul');
    tasks.append(...stage.tasks.map((task) => element('li', task)));
    content.append(heading, tasks);
    item.append(content);
    return item;
  }));
  byId('checks').replaceChildren(...checks.map((check, index) => {
    const label = element('label', undefined, 'check-row');
    const input = element('input');
    input.type = 'checkbox';
    input.id = `review-check-${index}`;
    input.addEventListener('change', () => {
      if (input.checked) confirmed.add(check); else confirmed.delete(check);
      byId('export-status').textContent = '';
      reviewState();
    });
    label.append(input, element('span', check));
    return label;
  }));
  byId('assumptions').replaceChildren(...assumptions.map((text) => element('li', text)));
  byId('export-status').textContent = '';
  byId('export-preview').hidden = true;
  byId('markdown-preview').value = '';
  reviewState();
}

function createPlan(focus = true) {
  clearErrors();
  const input = readBrief();
  const errors = validateBrief(input);
  if (Object.keys(errors).length) {
    markStale();
    for (const [key, message] of Object.entries(errors)) {
      const field = byId(key);
      if (field) field.setAttribute('aria-invalid', 'true');
      const target = byId(`${key}-error`);
      if (target) target.textContent = message;
    }
    byId('form-status').textContent = 'Please correct the highlighted fields. No new plan was created.';
    byId(Object.keys(errors)[0])?.focus();
    return;
  }
  plan = buildPlan(input);
  renderPlan();
  byId('form-status').textContent = 'Plan rebuilt. Review checks start fresh.';
  if (focus) byId('plan-title').focus();
}

function loadPreset() {
  const preset = exampleBriefs.find((item) => item.key === byId('preset').value) || exampleBriefs[0];
  for (const key of inputKeys) {
    if (checkKeys.includes(key)) byId(key).checked = Boolean(preset.fields[key]);
    else byId(key).value = String(preset.fields[key]);
  }
  createPlan(false);
  byId('form-status').textContent = 'Fictional example loaded. Review assumptions before using the plan.';
}

function download(reviewed) {
  if (!plan || stale || (reviewed && byId('download-reviewed').disabled)) return;
  const content = toMarkdown(plan, { confirmedChecks: [...confirmed], reviewed });
  byId('markdown-preview').value = content;
  byId('export-preview').hidden = false;
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = element('a');
  anchor.href = url;
  anchor.download = `fieldwork-${reviewed ? 'reviewed' : 'draft'}-plan.md`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  byId('export-status').textContent = `Prepared ${anchor.download}. Check your browser downloads. No external submission was made.`;
}

form.addEventListener('input', markStale);
form.addEventListener('change', markStale);
form.addEventListener('submit', (event) => { event.preventDefault(); createPlan(); });
byId('load-preset').addEventListener('click', loadPreset);
byId('reviewed').addEventListener('change', () => { byId('export-status').textContent = ''; reviewState(); });
byId('download-draft').addEventListener('click', () => download(false));
byId('download-reviewed').addEventListener('click', () => download(true));
loadPreset();
