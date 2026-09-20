import { useEffect, useRef, useState } from "react";
import { createDemoRecords, projects, reviewers } from "./data.js";
import {
  assignReviewer,
  changeStatus,
  filterRecords,
  statuses,
  summarize,
  transitions,
} from "./workflow.js";

const paths = {
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  queue: "M8 5h13M8 12h13M8 19h13M3 5h.01M3 12h.01M3 19h.01",
  info: "M12 11v6M12 7h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  search: "m21 21-4.3-4.3M19 10.5a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0",
  arrow: "M5 12h14m-5-5 5 5-5 5",
  check: "m5 12 4 4L19 6",
  clock: "M12 6v6l4 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  close: "m6 6 12 12M6 18 18 6",
  reset: "M3 10a9 9 0 1 1 2 9M3 4v6h6",
  shield: "M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7zM8 12l3 3 5-6",
};
function Icon({ name, size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.grid} />
    </svg>
  );
}
const statusClass = (status) => status.toLowerCase().replaceAll(" ", "-");
function Status({ value }) {
  return (
    <span className={`status ${statusClass(value)}`}>
      <span />
      {value}
    </span>
  );
}
const actionLabels = {
  "In progress": "Start task",
  Submitted: "Mark as submitted",
  "In review": "Start review",
  Accepted: "Accept submission",
  "Changes requested": "Request changes",
};

function RecordDialog({ record, update, onClose }) {
  const ref = useRef(null);
  const [note, setNote] = useState(record.note);
  const [error, setError] = useState("");
  useEffect(() => {
    ref.current.showModal();
  }, []);
  function save(operation) {
    try {
      update(operation());
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <dialog
      ref={ref}
      className="record-dialog"
      onCancel={onClose}
      aria-labelledby="record-title"
    >
      <div className="dialog-top">
        <span className="eyebrow">SUBMISSION DETAILS</span>
        <button
          className="icon-button"
          aria-label="Close submission details"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      <div className="dialog-body">
        <p className="mono muted">
          {record.id} <span className="dot-separator">/</span> {record.project}
        </p>
        <h2 id="record-title">{record.title}</h2>
        <Status value={record.status} />
        <div className="demo-notice compact">
          <Icon name="info" />
          <p>
            Metadata-only demonstration. There is no real media, contributor
            record or automated quality score behind this submission.
          </p>
        </div>
        <dl className="detail-grid">
          <div>
            <dt>Contributor</dt>
            <dd className="mono">{record.contributor}</dd>
          </div>
          <div>
            <dt>Task format</dt>
            <dd>{record.type}</dd>
          </div>
          <div>
            <dt>Illustrative units</dt>
            <dd>{record.units}</dd>
          </div>
          <div>
            <dt>Demo due label</dt>
            <dd>{record.due}</dd>
          </div>
        </dl>
        <div className="form-section">
          <label htmlFor="reviewer">Assigned reviewer</label>
          <p className="field-help">
            Manual routing only; reviewers are fictional IDs.
          </p>
          <select
            id="reviewer"
            value={record.reviewer}
            disabled={record.status === "Accepted"}
            onChange={(event) =>
              save(() => assignReviewer(record, event.target.value))
            }
          >
            <option value="">Unassigned</option>
            {reviewers.map((reviewer) => (
              <option key={reviewer}>{reviewer}</option>
            ))}
          </select>
        </div>
        <div className="form-section">
          <label htmlFor="review-note">
            {record.status === "Accepted" ? "Final review note" : "Review note"}
          </label>
          <p id="note-help" className="field-help">
            Required to accept or request changes. Use fictional, non-sensitive
            notes only.
          </p>
          <textarea
            id="review-note"
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
              setError("");
            }}
            rows="3"
            maxLength="500"
            readOnly={record.status === "Accepted"}
            aria-describedby="note-help"
            placeholder="Example: All described steps are present; labels need clarification."
          />
        </div>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        {record.status === "Accepted" ? (
          <div className="complete-message">
            <Icon name="check" />
            Review completed. This demo record is read-only.
          </div>
        ) : (
          <div className="workflow-actions">
            {transitions[record.status].map((next) => (
              <button
                key={next}
                className={
                  next === "Changes requested"
                    ? "button secondary"
                    : "button primary"
                }
                onClick={() => save(() => changeStatus(record, next, note))}
              >
                {actionLabels[next]}
                <Icon
                  name={next === "Accepted" ? "check" : "arrow"}
                  size={17}
                />
              </button>
            ))}
          </div>
        )}
        <p className="field-help workflow-help">
          These controls change simulated submission status—not contributor
          eligibility or employment decisions. Notes save when a status action
          succeeds.
        </p>
        <div className="activity">
          <h3>Session activity</h3>
          <ol>
            {[...record.history].reverse().map((event, index) => (
              <li key={`${event.label}-${index}`}>
                <span className="activity-dot" />
                <div>
                  <p>{event.label}</p>
                  <small>{event.at}</small>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </dialog>
  );
}

function ResetDialog({ onReset, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="reset-dialog"
      onCancel={onClose}
      aria-labelledby="reset-title"
    >
      <div className="dialog-top">
        <span className="eyebrow">DEMO CONTROLS</span>
        <button
          className="icon-button"
          aria-label="Cancel reset"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      <div className="dialog-body">
        <h2 id="reset-title">Start with a clean queue?</h2>
        <p className="muted">
          This removes your in-memory demo edits and restores the 12 fictional
          sample records. No real records are affected.
        </p>
        <div className="workflow-actions">
          <button className="button secondary" onClick={onClose}>
            Keep exploring
          </button>
          <button className="button primary" onClick={onReset}>
            Reset demo
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default function App() {
  const [records, setRecords] = useState(createDemoRecords);
  const [filters, setFilters] = useState({
    search: "",
    status: "All statuses",
    project: "All projects",
  });
  const [selectedId, setSelectedId] = useState(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const lastFocused = useRef(null);
  const stats = summarize(records);
  const visible = filterRecords(records, filters);
  const selected = records.find((record) => record.id === selectedId);
  const selectFilter = (key, value) =>
    setFilters((current) => ({ ...current, [key]: value }));
  function showStatus(status) {
    setFilters({ search: "", project: "All projects", status });
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    document
      .getElementById("queue")
      .scrollIntoView({ behavior: reduceMotion ? "instant" : "smooth", block: "start" });
  }
  function openRecord(id, target) {
    lastFocused.current = target;
    setSelectedId(id);
  }
  function closeRecord() {
    setSelectedId(null);
    lastFocused.current?.focus();
  }
  function updateRecord(updated) {
    setRecords((current) =>
      current.map((record) => (record.id === updated.id ? updated : record)),
    );
    setAnnouncement(`${updated.id}: ${updated.history.at(-1).label}.`);
  }
  function reset() {
    setRecords(createDemoRecords());
    setFilters({ search: "", status: "All statuses", project: "All projects" });
    setResetOpen(false);
    setAnnouncement(
      "Demo reset. The 12 original fictional records are restored.",
    );
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to workspace
      </a>
      <aside className="sidebar" aria-label="Workspace navigation">
        <a className="brand" href="#main" aria-label="Fieldwork workspace home">
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span>
            fieldwork<span className="brand-period">.</span>
          </span>
        </a>
        <div className="workspace-selector">
          <span className="workspace-monogram">F</span>
          <div>
            <strong>Operations lab</strong>
            <span>Personal portfolio</span>
          </div>
          <span className="workspace-chevron" aria-hidden="true">
            ⌄
          </span>
        </div>
        <p className="sidebar-section-label">WORKSPACE</p>
        <nav>
          <a className="nav-link active" href="#main" aria-current="page">
            <Icon name="grid" />
            Overview
          </a>
          <button className="nav-link" onClick={() => showStatus("Submitted")}>
            <Icon name="queue" />
            Review queue<span className="nav-count">{stats.awaiting}</span>
          </button>
          <a className="nav-link" href="#about">
            <Icon name="info" />
            About this demo
          </a>
        </nav>
        <div className="sidebar-foot">
          <div className="privacy-emblem">
            <Icon name="shield" />
          </div>
          <strong>Built around safe data</strong>
          <p>
            Fictional IDs. No uploads.
            <br />
            Nothing leaves this browser.
          </p>
          <span className="sidebar-version">PORTFOLIO DEMO · V1.0</span>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> <strong>Overview</strong>
          </div>
          <div className="topbar-right">
            <span className="local-status">
              <i />
              Local session
            </span>
            <span className="avatar" aria-label="Demo workspace">
              FW
            </span>
          </div>
        </header>
        <main id="main" tabIndex="-1">
          <div className="page-heading">
            <div>
              <div className="eyebrow heading-label">
                <span className="tiny-line" />
                HUMAN-LED DATA OPERATIONS
              </div>
              <h1>
                Every submission.
                <br className="mobile-break" /> A clear next step.
              </h1>
              <p className="intro">
                A focused workspace for routing tasks, reviewing submissions
                <br className="desktop-break" /> and keeping contributor
                workflows moving.
              </p>
            </div>
            <button
              className="button secondary reset-button"
              onClick={() => setResetOpen(true)}
            >
              <Icon name="reset" size={17} />
              Reset demo
            </button>
          </div>
          <div className="demo-banner">
            <div className="demo-badge">
              <span />
              Synthetic portfolio demo
            </div>
            <p>
              12 fictional records · manual decisions · session-only changes
            </p>
            <a href="#about">
              How it works
              <Icon name="arrow" size={15} />
            </a>
          </div>
          <section className="metrics" aria-label="Workspace summary">
            {[
              [
                "Total submissions",
                stats.total,
                "Across 3 sample projects",
                "grid",
                "All statuses",
              ],
              [
                "Awaiting review",
                stats.awaiting,
                "Submitted and ready to route",
                "clock",
                "Submitted",
              ],
              [
                "In review",
                stats.reviewing,
                "Assigned to a human reviewer",
                "queue",
                "In review",
              ],
              [
                "Accepted",
                stats.accepted,
                "Review complete",
                "check",
                "Accepted",
              ],
            ].map(([title, count, detail, icon, status], index) => (
              <button
                className={`metric metric-${index}`}
                key={title}
                onClick={() => showStatus(status)}
                aria-label={`Show ${title.toLowerCase()}: ${count}`}
              >
                <div className="metric-top">
                  <span>{title}</span>
                  <span className="metric-icon">
                    <Icon name={icon} size={18} />
                  </span>
                </div>
                <div className="metric-number">
                  {String(count).padStart(2, "0")}
                  <span className="metric-arrow">
                    <Icon name="arrow" size={18} />
                  </span>
                </div>
                <p>{detail}</p>
              </button>
            ))}
          </section>
          <section
            className="queue-panel"
            id="queue"
            aria-labelledby="queue-title"
          >
            <div className="queue-heading">
              <div>
                <h2 id="queue-title">
                  Submission queue{" "}
                  <span className="count-chip">{records.length}</span>
                </h2>
                <p>
                  Assign a reviewer. Record a decision. Keep the next step
                  visible.
                </p>
              </div>
              <span className="updated-label">
                <span />
                Interactive demo
              </span>
            </div>
            <div className="filter-bar">
              <div className="search-field">
                <Icon name="search" size={18} />
                <label className="sr-only" htmlFor="search">
                  Search submissions, contributor IDs or reviewers
                </label>
                <input
                  id="search"
                  type="search"
                  placeholder="Search tasks or contributor IDs…"
                  value={filters.search}
                  onChange={(event) =>
                    selectFilter("search", event.target.value)
                  }
                />
              </div>
              <div className="select-wrap">
                <label className="sr-only" htmlFor="project-filter">
                  Filter by project
                </label>
                <select
                  id="project-filter"
                  value={filters.project}
                  onChange={(event) =>
                    selectFilter("project", event.target.value)
                  }
                >
                  <option>All projects</option>
                  {projects.map((project) => (
                    <option key={project}>{project}</option>
                  ))}
                </select>
              </div>
              <div className="select-wrap status-filter">
                <label className="sr-only" htmlFor="status-filter">
                  Filter by status
                </label>
                <select
                  id="status-filter"
                  value={filters.status}
                  onChange={(event) =>
                    selectFilter("status", event.target.value)
                  }
                >
                  <option>All statuses</option>
                  {statuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
            <div
              className="table-region"
              role="region"
              aria-label="Submission queue table, scroll horizontally on smaller screens"
              tabIndex="0"
            >
              <table>
                <thead>
                  <tr>
                    <th scope="col">Submission / task</th>
                    <th scope="col">Contributor</th>
                    <th scope="col">Status</th>
                    <th scope="col">Reviewer</th>
                    <th scope="col">Demo due</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((record) => (
                    <tr key={record.id}>
                      <td>
                        <button
                          className="task-link"
                          onClick={(event) =>
                            openRecord(record.id, event.currentTarget)
                          }
                        >
                          <span className="task-symbol" aria-hidden="true">
                            {record.type === "Video sequence" ? "▣" : "≋"}
                          </span>
                          <span>
                            <strong>{record.title}</strong>
                            <small>
                              <span className="mono">{record.id}</span>
                              <span className="dot-separator">·</span>
                              {record.project}
                            </small>
                          </span>
                        </button>
                      </td>
                      <td>
                        <span className="mono contributor-id">
                          {record.contributor}
                        </span>
                      </td>
                      <td>
                        <Status value={record.status} />
                      </td>
                      <td>
                        {record.reviewer ? (
                          <span className="reviewer">
                            <i>{record.reviewer.slice(-2)}</i>
                            <span className="mono">{record.reviewer}</span>
                          </span>
                        ) : (
                          <span className="unassigned">Unassigned</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={
                            record.due === "Today" ? "due-today" : "due-label"
                          }
                        >
                          {record.due}
                        </span>
                      </td>
                      <td>
                        <button
                          className="row-open"
                          aria-label={`View ${record.id}: ${record.title}`}
                          onClick={(event) =>
                            openRecord(record.id, event.currentTarget)
                          }
                        >
                          <Icon name="arrow" size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {visible.length === 0 && (
              <div className="empty-state">
                <div>
                  <Icon name="search" size={26} />
                </div>
                <h3>No submissions match</h3>
                <p>
                  Try another task, contributor ID or filter. The demo includes
                  12 fictional records.
                </p>
                <button
                  className="button secondary"
                  onClick={() =>
                    setFilters({
                      search: "",
                      status: "All statuses",
                      project: "All projects",
                    })
                  }
                >
                  Clear filters
                </button>
              </div>
            )}
            <div className="queue-footer">
              <span role="status">
                Showing <strong>{visible.length}</strong> of {records.length}{" "}
                submissions
              </span>
              <span>No live contributor data</span>
            </div>
          </section>
          <section
            className="bottom-grid"
            id="about"
            aria-label="About this portfolio demo"
          >
            <div className="workflow-card">
              <span className="eyebrow">A DELIBERATE WORKFLOW</span>
              <h2>From a task to a reviewed submission.</h2>
              <div className="workflow-track">
                <span>Ready</span>
                <Icon name="arrow" size={14} />
                <span>In progress</span>
                <Icon name="arrow" size={14} />
                <span>Submitted</span>
                <Icon name="arrow" size={14} />
                <span>In review</span>
                <Icon name="arrow" size={14} />
                <span className="workflow-final">Accepted</span>
              </div>
              <p>
                A reviewer can request changes; the next submission returns to
                the review queue. Acceptance requires a written review note.
              </p>
            </div>
            <div className="boundaries-card">
              <Icon name="shield" size={24} />
              <div>
                <h2>A demonstration, not a production system.</h2>
                <p>
                  No uploads, accounts, payments, analytics or external
                  services. Edits live in browser memory and reset on refresh.
                  All decisions are manual and apply to submissions—not hiring.
                </p>
              </div>
            </div>
          </section>
          <footer className="page-footer">
            <span>
              FIELDWORK <span> / </span> An original portfolio project
            </span>
            <span>Designed for clear handoffs.</span>
          </footer>
        </main>
      </div>
      <div className="sr-only" aria-live="polite">
        {announcement}
      </div>
      {selected && (
        <RecordDialog
          key={selected.id}
          record={selected}
          update={updateRecord}
          onClose={closeRecord}
        />
      )}
      {resetOpen && (
        <ResetDialog onReset={reset} onClose={() => setResetOpen(false)} />
      )}
    </div>
  );
}
