import React, { useEffect, useState, useCallback } from "react";
import { api, API_ORIGIN } from "./services/api";
import { Button } from "./components/Button";
import { Card } from "./components/Card";
import { PageHeader } from "./components/PageHeader";
import { StatusBadge } from "./components/StatusBadge";
import { StatusTimeline } from "./components/StatusTimeline";
import { PhotoGallery } from "./components/PhotoGallery";
import { SearchBar } from "./components/SearchBar";
import { CertificateStatusBadge } from "./components/CertificateStatusBadge";
import { Modal } from "./components/Modal";
import { Profile } from "./pages/Profile";
import { Icon } from "./components/Icons";

/* ───────────── Constants & helpers ───────────── */

const menus = {
  APPLICANT: ["Dashboard", "My Instruments", "New Application", "My Applications", "Certificates", "Profile"],
  ADMIN: ["Dashboard", "Applications", "User Management", "Certificates", "Audit Log", "Profile"],
  OFFICER: ["Dashboard", "My Jobs", "Inspection History", "Profile"],
  GATC: ["Dashboard", "My Jobs", "Verification History", "Profile"],
};

const dateToday = () => new Date().toISOString().slice(0, 10);

/* ─────────── Custom data-fetching hook ─────────── */

function useData(token, path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    api(path, { token })
      .then((d) => { setData(d); setError(""); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [path, token]);

  useEffect(() => { refresh(); }, [refresh]);

  return { data, error, refresh, loading };
}

/* ─────────── Shared tiny components ─────────── */

function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small className="field-hint">{hint}</small>}
    </label>
  );
}

function Notice({ children, type = "info" }) {
  return <div className={`notice notice--${type}`}>{children}</div>;
}

function Metric({ label, value, icon = "product", visual = "metricInstruments", percentage, percentageLabel = "rate", isPositive = true }) {
  return (
    <Card>
      <div className="metric">
        <div className="metric-top">
          <div className="metric-icon-circle">
            <Icon name={icon} size={22} />
          </div>
          <Icon name={visual} />
        </div>
        <div>
          <div className="metric-label-row">
            <span>{label}</span>
            <span className="metric-info-icon" title="Legal Metrology Metric">ⓘ</span>
          </div>
          <div className="metric-middle">
            <strong className="stat">{value ?? "0"}</strong>
          </div>
          <div className="metric-bottom">
            {percentage !== undefined ? (
              <>
                <span className={`trend-badge ${isPositive ? "trend-badge--up" : "trend-badge--down"}`}>
                  {isPositive ? "↑" : "↓"} {percentage}%
                </span>
                <span className="trend-label">{percentageLabel}</span>
              </>
            ) : (
              <span className="trend-label">Active record</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="loading-state">
      <div className="loading-spinner" />
      <p className="muted">Loading…</p>
    </div>
  );
}

function EmptyState({ message = "No data found.", icon = "applications" }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon name={icon} size={36} /></div>
      <p className="muted">{message}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   AUTH
   ═══════════════════════════════════════════════════ */

function Auth({ onLogin }) {
  const [register, setRegister] = useState(false);
  const [form, setForm] = useState({
    email: "applicant@example.com",
    password: "Pass@123",
    name: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api(register ? "/auth/register" : "/auth/login", {
        method: "POST",
        body: register ? { name: form.name, email: form.email, password: form.password, phone: form.phone } : { email: form.email, password: form.password },
      });
      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <section className="auth__intro">
        <p className="eyebrow">GOVERNMENT SERVICE PORTAL</p>
        <h1>Legal Metrology<br />Verification System</h1>
        <p>
          Online verification, certification and lifecycle management for
          weighing and measuring instruments under the Legal Metrology Act, 2009.
        </p>
        <ul className="auth-features">
          <li><span className="auth-feature-icon"><Icon name="newApplication" size={18} /></span> Digital applications and scheduling</li>
          <li><span className="auth-feature-icon"><Icon name="jobs" size={18} /></span> Mobile field inspection by LMO / GATC</li>
          <li><span className="auth-feature-icon"><Icon name="certificates" size={18} /></span> QR-enabled digital certificates</li>
          <li><span className="auth-feature-icon"><Icon name="check" size={18} /></span> Public real-time verification</li>
        </ul>
      </section>

      <Card className="auth__card">
        <h2>{register ? "Create an account" : "Sign in"}</h2>
        <p className="muted">
          {register
            ? "Register as an applicant or business owner."
            : "Use a demo account or your registered credentials."}
        </p>

        {error && <Notice type="error">{error}</Notice>}

        <form onSubmit={submit}>
          {register && (
            <>
              <Field label="Full name">
                <input required name="name" value={form.name} onChange={change} placeholder="Enter your full name" />
              </Field>
              <Field label="Phone">
                <input name="phone" value={form.phone} onChange={change} placeholder="Mobile number" />
              </Field>
            </>
          )}
          <Field label="Email">
            <input required type="email" name="email" value={form.email} onChange={change} placeholder="you@example.com" />
          </Field>
          <Field label="Password">
            <input required type="password" name="password" value={form.password} onChange={change} placeholder="••••••••" />
          </Field>
          <Button disabled={busy} className="wide">
            {busy ? "Please wait…" : register ? "Register" : "Sign in"}
          </Button>
        </form>

        <button
          className="link-button"
          onClick={() => { setRegister(!register); setError(""); }}
        >
          {register ? "Already have an account? Sign in" : "Need an account? Register"}
        </button>

        <div className="demo">
          <strong>Demo accounts</strong> (Password: <code>Pass@123</code>)
          <div className="demo-accounts">
            <button className="demo-btn" onClick={() => setForm({ ...form, email: "applicant@example.com", password: "Pass@123" })}>
              <span className="demo-role">Applicant</span>
              <span className="demo-email">applicant@example.com</span>
            </button>
            <button className="demo-btn" onClick={() => setForm({ ...form, email: "officer@metrology.gov", password: "Pass@123" })}>
              <span className="demo-role">LMO</span>
              <span className="demo-email">officer@metrology.gov</span>
            </button>
            <button className="demo-btn" onClick={() => setForm({ ...form, email: "gatc@metrology.gov", password: "Pass@123" })}>
              <span className="demo-role">GATC</span>
              <span className="demo-email">gatc@metrology.gov</span>
            </button>
            <button className="demo-btn" onClick={() => setForm({ ...form, email: "admin@metrology.gov", password: "Pass@123" })}>
              <span className="demo-role">Admin</span>
              <span className="demo-email">admin@metrology.gov</span>
            </button>
          </div>
        </div>
      </Card>
    </main>
  );
}

/* ═══════════════════════════════════════════════════
   APP SHELL
   ═══════════════════════════════════════════════════ */

function Shell({ session, onLogout }) {
  const [section, setSection] = useState("Dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const current = menus[session.user.role] || [];

  const roleLabels = { APPLICANT: "APPLICANT PORTAL", ADMIN: "ADMINISTRATOR", OFFICER: "LMO OFFICER", GATC: "GATC LABORATORY" };

  const handleNav = (item) => {
    setSection(item);
    setMobileMenuOpen(false);
  };

  return (
    <div className={`app-shell ${mobileMenuOpen ? "mobile-menu-open" : ""}`}>
      {mobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}
      <aside className={`sidebar ${mobileMenuOpen ? "open" : ""}`}>
        <div className="brand">
          <Icon name="brandLogo" />
          <div className="brand-text">
            <span>Legal Metrology</span>
            <small>National Portal</small>
          </div>
          <button className="mobile-close-btn" type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">✕</button>
        </div>
        <nav>
          {current.map((item) => (
            <button
              key={item}
              className={section === item ? "active" : ""}
              onClick={() => handleNav(item)}
            >
              <span className="nav-icon"><Icon name={navIconName(item)} size={18} /></span>
              <span>{item}</span>
            </button>
          ))}
        </nav>
        <button className="logout" onClick={onLogout}>
          <span className="nav-icon"><Icon name="logout" size={18} /></span>
          <span>Sign out</span>
        </button>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="mobile-menu-toggle" type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
            <span style={{ fontSize: 18, lineHeight: 1 }}>☰</span>
          </button>
          <span className="topbar-role">{roleLabels[session.user.role] || session.user.role}</span>
          <div className="topbar-user">
            <span className="avatar">{session.user.name?.[0]?.toUpperCase() || "U"}</span>
            <span className="topbar-name">{session.user.name}</span>
          </div>
        </header>
        <section className="content">
          {section === "Profile" && <Profile token={session.token} />}
          {section !== "Profile" && session.user.role === "APPLICANT" && (
            <Applicant section={section} token={session.token} user={session.user} />
          )}
          {section !== "Profile" && session.user.role === "ADMIN" && (
            <Admin section={section} token={session.token} user={session.user} />
          )}
          {section !== "Profile" && (session.user.role === "OFFICER" || session.user.role === "GATC") && (
            <Verifier section={section} token={session.token} user={session.user} />
          )}
        </section>
      </main>
    </div>
  );
}

function navIconName(item) {
  const icons = {
    Dashboard: "dashboard", "My Instruments": "instruments", "New Application": "newApplication",
    "My Applications": "applications", Certificates: "certificates", Profile: "profile",
    Applications: "applications", "User Management": "users", "Audit Log": "audit",
    "My Jobs": "jobs", "Inspection History": "history", "Verification History": "history",
  };
  return icons[item] || "dashboard";
}

/* ═══════════════════════════════════════════════════
   APPLICANT VIEWS
   ═══════════════════════════════════════════════════ */

function Applicant({ section, token, user }) {
  if (section === "My Instruments") return <Instruments token={token} />;
  if (section === "New Application") return <NewApplication token={token} />;
  if (section === "My Applications") return <Applications token={token} />;
  if (section === "Certificates") return <Certificates token={token} />;

  const { data, refresh, loading } = useData(token, "/dashboard");

  return (
    <>
      <PageHeader
        title={`Overview`}
        subtitle={`Welcome back, ${user.name?.split(" ")[0]}. Manage your instruments and verification applications.`}
      />
      {loading ? <LoadingState /> : data && (
        <div className="metrics-grid">
          <Metric
            label="Registered Instruments"
            value={data.instruments}
            icon="instruments"
            visual="metricInstruments"
            percentage={data.complianceRate}
            percentageLabel="compliance rate"
            isPositive={true}
          />
          <Metric
            label="Active Applications"
            value={data.activeApplications}
            icon="applications"
            visual="metricApplications"
            percentage={data.activeRate}
            percentageLabel="of total queue"
            isPositive={data.activeApplications > 0}
          />
          <Metric
            label="Valid Certificates"
            value={data.certificates}
            icon="certificates"
            visual="metricCertificates"
            percentage={data.complianceRate}
            percentageLabel="verified rate"
            isPositive={true}
          />
        </div>
      )}
      <Applications token={token} compact />
    </>
  );
}

/* ── Instruments ── */

function Instruments({ token }) {
  const { data, refresh, error, loading } = useData(token, "/instruments");
  const [form, setForm] = useState({
    type: "Electronic Weighing Scale", brand: "", model: "",
    serialNumber: "", capacity: "", locationAddress: "", state: "", district: "",
  });
  const [message, setMessage] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api("/instruments", { token, method: "POST", body: form });
      setMessage("Instrument added successfully.");
      setForm({ type: "Electronic Weighing Scale", brand: "", model: "", serialNumber: "", capacity: "", locationAddress: "", state: form.state, district: form.district });
      refresh();
    } catch (err) { setMessage(err.message); }
  };

  return (
    <>
      <PageHeader title="My Instruments" subtitle="Register instruments before applying for verification." />
      <div className="two-column">
        <Card title="Add Instrument">
          <form onSubmit={submit}>
            <Field label="Instrument type">
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option>Electronic Weighing Scale</option>
                <option>Mechanical Weighing Scale</option>
                <option>Water Meter</option>
                <option>Fuel Dispenser</option>
                <option>Weighbridge</option>
                <option>Taxi Meter</option>
                <option>Auto Fare Meter</option>
              </select>
            </Field>
            <div className="two-input">
              <Field label="Brand"><input required value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="e.g. Essae" /></Field>
              <Field label="Model"><input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="e.g. XYZ-10" /></Field>
            </div>
            <div className="two-input">
              <Field label="Serial number"><input required value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} placeholder="e.g. ES-10001" /></Field>
              <Field label="Capacity / range"><input value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="e.g. 10 kg" /></Field>
            </div>
            <Field label="Location address"><textarea value={form.locationAddress} onChange={(e) => setForm({ ...form, locationAddress: e.target.value })} placeholder="Shop / business address" /></Field>
            <div className="two-input">
              <Field label="State"><input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="e.g. Delhi" /></Field>
              <Field label="District"><input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} placeholder="e.g. Central Delhi" /></Field>
            </div>
            <Button>Add Instrument</Button>
          </form>
          {message && <Notice>{message}</Notice>}
        </Card>

        <Card title="Registered Instruments">
          {loading ? <LoadingState /> : error ? <Notice type="error">{error}</Notice> : data?.length ? (
            <table>
              <thead><tr><th>Instrument</th><th>Serial</th><th>Capacity</th><th>Location</th></tr></thead>
              <tbody>
                {data.map((i) => (
                  <tr key={i.id}>
                    <td><strong>{i.brand} {i.model}</strong><br /><small>{i.type}</small></td>
                    <td>{i.serialNumber}</td>
                    <td>{i.capacity || "—"}</td>
                    <td><small>{i.district}{i.district && i.state ? ", " : ""}{i.state}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <EmptyState message="No instruments registered yet." icon="instruments" />}
        </Card>
      </div>
    </>
  );
}

/* ── New Application ── */

function NewApplication({ token }) {
  const { data: instruments } = useData(token, "/instruments");
  const [form, setForm] = useState({ instrumentId: "", applicationType: "NEW_VERIFICATION", preferredDate: dateToday(), remarks: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (instruments?.[0] && !form.instrumentId) setForm((f) => ({ ...f, instrumentId: instruments[0].id }));
  }, [instruments]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e) => {
    e.preventDefault();
    try {
      const item = await api("/applications", { token, method: "POST", body: form });
      setMessage(`Application ${item.applicationNumber} submitted successfully.`);
    } catch (err) { setMessage(err.message); }
  };

  return (
    <>
      <PageHeader title="New Verification Application" subtitle="Request verification or re-verification for a registered instrument." />
      <Card className="form-card">
        <form onSubmit={submit}>
          <Field label="Instrument">
            <select required value={form.instrumentId} onChange={(e) => setForm({ ...form, instrumentId: e.target.value })}>
              <option value="">Select instrument</option>
              {instruments?.map((i) => (
                <option key={i.id} value={i.id}>{i.brand} {i.model} — {i.serialNumber}</option>
              ))}
            </select>
          </Field>
          <Field label="Application type">
            <select value={form.applicationType} onChange={(e) => setForm({ ...form, applicationType: e.target.value })}>
              <option value="NEW_VERIFICATION">New verification</option>
              <option value="RE_VERIFICATION">Re-verification</option>
            </select>
          </Field>
          <Field label="Preferred date">
            <input type="date" value={form.preferredDate} onChange={(e) => setForm({ ...form, preferredDate: e.target.value })} />
          </Field>
          <Field label="Remarks">
            <textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Optional scheduling note" />
          </Field>
          <Button disabled={!instruments?.length}>Submit Application</Button>
        </form>
        {!instruments?.length && <Notice type="error">Register an instrument first.</Notice>}
        {message && <Notice>{message}</Notice>}
      </Card>
    </>
  );
}

/* ── Applications list ── */

function Applications({ token, compact = false }) {
  const { data, error, refresh, loading } = useData(token, "/applications/my");

  if (compact) {
    return (
      <Card title="Recent Applications">
        {loading ? <LoadingState /> : error ? <Notice type="error">{error}</Notice> : data?.length ? (
          <table>
            <thead><tr><th>Application #</th><th>Instrument</th><th>Status</th><th>Scheduled</th></tr></thead>
            <tbody>
              {data.slice(0, 5).map((a) => (
                <tr key={a.id}>
                  <td><strong>{a.applicationNumber}</strong></td>
                  <td>{a.instrument.brand} <small>{a.instrument.serialNumber}</small></td>
                  <td><StatusBadge status={a.status} /></td>
                  <td>{a.scheduledDate || "Not scheduled"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <EmptyState message="No applications found." icon="applications" />}
        <Button variant="secondary" onClick={refresh} style={{ marginTop: 12 }}>Refresh</Button>
      </Card>
    );
  }

  return (
    <>
      <PageHeader
        title="My Applications"
        subtitle="Track real-time progress and verification stages for each of your applications."
        action={<Button variant="secondary" onClick={refresh}>Refresh</Button>}
      />
      {loading ? <LoadingState /> : error ? <Notice type="error">{error}</Notice> : data?.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {data.map((a) => (
            <Card key={a.id}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <h3 style={{ fontSize: 17, marginBottom: 2 }}>{a.applicationNumber}</h3>
                  <p className="muted" style={{ fontSize: 13 }}>
                    Submitted on {a.submittedAt?.slice(0, 10)} · Scheduled: {a.scheduledDate || "Pending assignment"}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <StatusBadge status={a.status} />
                  {(a.status === "VERIFIED" || a.certificate) && (
                    <a
                      className="button button--secondary"
                      href={a.certificate?.downloadUrl ? `${a.certificate.downloadUrl}?token=${token}` : `/api/v1/certificates/download/${a.certificate?.certificateNumber || a.certificate?.id || a.applicationNumber}?token=${token}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: 12, padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: 6 }}
                    >
                      <Icon name="certificates" size={14} />
                      Download Certificate
                    </a>
                  )}
                </div>
              </div>

              <div className="detail-row" style={{ padding: "8px 0", marginBottom: 12 }}>
                <span className="detail-label">Instrument:</span>
                <span><strong>{a.instrument.brand} {a.instrument.model}</strong> ({a.instrument.type}) · Serial: <code>{a.instrument.serialNumber}</code></span>
              </div>

              {a.assignedOfficer && (
                <div className="detail-row" style={{ padding: "8px 0", marginBottom: 12 }}>
                  <span className="detail-label">Assigned Verifier:</span>
                  <span>{a.assignedOfficer.name} ({a.assignedOfficer.role}) · District: {a.assignedOfficer.district || "Central"}</span>
                </div>
              )}

              <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                <StatusTimeline status={a.status} hasCertificate={!!a.certificate} />
              </div>
            </Card>
          ))}
        </div>
      ) : <Card><EmptyState message="No verification applications submitted yet." icon="applications" /></Card>}
    </>
  );
}

/* ── Certificates ── */

function Certificates({ token }) {
  const { data, error, loading } = useData(token, "/certificates/my");

  return (
    <>
      <PageHeader title="My Certificates" subtitle="Download your QR-enabled digital verification certificates." />
      <Card>
        {loading ? <LoadingState /> : error ? <Notice type="error">{error}</Notice> : data?.length ? (
          <table>
            <thead><tr><th>Certificate</th><th>Instrument</th><th>Valid Until</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.certificateNumber}>
                  <td><strong>{c.certificateNumber}</strong></td>
                  <td>{c.instrumentType}<br /><small>{c.serialNumber}</small></td>
                  <td>{c.validUntil}</td>
                  <td><CertificateStatusBadge status={c.status} validUntil={c.validUntil} /></td>
                  <td>
                    <a className="download" href={`${c.downloadUrl}?token=${token}`} target="_blank" rel="noreferrer">
                      Download PDF
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <EmptyState message="No certificates have been issued yet." icon="📜" />}
      </Card>
    </>
  );
}

/* ═══════════════════════════════════════════════════
   ADMIN
   ═══════════════════════════════════════════════════ */

function Admin({ section, token, user }) {
  if (section === "Applications") return <AdminApplications token={token} />;
  if (section === "User Management") return <UserManagement token={token} currentUser={user} />;
  if (section === "Certificates") return <AdminCertificates token={token} />;
  if (section === "Audit Log") return <AuditLog token={token} />;

  // Dashboard
  const { data: stats, loading } = useData(token, "/admin/dashboard");

  return (
    <>
      <PageHeader title="Admin Dashboard" subtitle="System overview and management controls." />
      {loading ? <LoadingState /> : stats && (
        <>
          <div className="metrics-grid">
            <Metric
              label="Total Applications"
              value={stats.total}
              icon="applications"
              visual="metricApplications"
              percentage={stats.verificationRate}
              percentageLabel="verified rate"
              isPositive={true}
            />
            <Metric
              label="Pending Inspection"
              value={stats.submitted}
              icon="jobs"
              visual="metricJobs"
              percentage={stats.pendingRate}
              percentageLabel="of total queue"
              isPositive={false}
            />
            <Metric
              label="Assigned Verifiers"
              value={stats.assigned}
              icon="users"
              visual="metricUsers"
              percentage={stats.assignedRate}
              percentageLabel="in progress"
              isPositive={true}
            />
            <Metric
              label="Verified & Stamped"
              value={stats.verified}
              icon="certificates"
              visual="metricCompleted"
              percentage={stats.verificationRate}
              percentageLabel="success rate"
              isPositive={true}
            />
          </div>
          <div className="metrics-grid" style={{ marginTop: 0 }}>
            <Metric
              label="Rejected"
              value={stats.rejected}
              icon="history"
              visual="metricAlert"
              percentage={stats.rejectionRate}
              percentageLabel="rejection rate"
              isPositive={false}
            />
            <Metric
              label="Expiring Soon"
              value={stats.expiringSoon}
              icon="audit"
              visual="metricCalendar"
              percentage={stats.total > 0 ? Math.round((stats.expiringSoon / (stats.total || 1)) * 100) : 0}
              percentageLabel="within 30 days"
              isPositive={false}
            />
            <Metric
              label="Expired"
              value={stats.expired}
              icon="certificates"
              visual="metricAlert"
              percentage={stats.total > 0 ? Math.round((stats.expired / (stats.total || 1)) * 100) : 0}
              percentageLabel="overdue rate"
              isPositive={false}
            />
          </div>

          {stats.workload?.length > 0 && (
            <Card title="Verifier Workload">
              <table>
                <thead><tr><th>Name</th><th>Role</th><th>District</th><th>Active</th><th>Completed</th><th>Total</th></tr></thead>
                <tbody>
                  {stats.workload.map((w) => (
                    <tr key={w.id}>
                      <td><strong>{w.name}</strong></td>
                      <td><span className={`status status--${w.role === "OFFICER" ? "ASSIGNED" : "VERIFIED"}`}>{w.role}</span></td>
                      <td>{w.district || "—"}</td>
                      <td><strong>{w.active_jobs}</strong></td>
                      <td>{w.completed_jobs}</td>
                      <td>{w.total_jobs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}
    </>
  );
}

/* ── Admin Applications ── */

function AdminApplications({ token }) {
  const { data: apps, refresh, loading } = useData(token, "/applications");
  const { data: verifiers } = useData(token, "/officers");
  const [selected, setSelected] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [form, setForm] = useState({ officerId: "", scheduledDate: dateToday(), notes: "" });
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const selectApp = async (a) => {
    setSelected(a);
    setForm({ ...form, officerId: a.assignedOfficer?.id || "" });
    try {
      const rec = await api(`/admin/recommend-assignment/${a.id}`, { token });
      setRecommendation(rec);
      if (rec.recommended && !a.assignedOfficer) {
        setForm((f) => ({ ...f, officerId: rec.recommended.id }));
      }
    } catch { setRecommendation(null); }
  };

  async function assign(e) {
    e.preventDefault();
    try {
      await api(`/applications/${selected.id}/assign`, { token, method: "PATCH", body: form });
      setMessage("Verifier assigned successfully.");
      setSelected(null);
      setRecommendation(null);
      refresh();
    } catch (err) { setMessage(err.message); }
  }

  const filtered = apps?.filter((a) => {
    if (statusFilter && a.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return a.applicationNumber.toLowerCase().includes(s) || a.applicant.name.toLowerCase().includes(s) || a.instrument.serialNumber.toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <>
      <PageHeader title="Applications" subtitle="Review, assign, and manage all verification applications." />
      <SearchBar value={search} onChange={setSearch} placeholder="Search by application #, name, or serial…">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="VERIFIED">Verified</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </SearchBar>
      {message && <Notice>{message}</Notice>}
      <Card>
        {loading ? <LoadingState /> : filtered?.length ? (
          <table>
            <thead><tr><th>Number</th><th>Applicant</th><th>Instrument</th><th>District</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td><strong>{a.applicationNumber}</strong></td>
                  <td>{a.applicant.name}</td>
                  <td>{a.instrument.type}<br /><small>{a.instrument.serialNumber}</small></td>
                  <td><small>{a.district || "—"}</small></td>
                  <td><StatusBadge status={a.status} /></td>
                  <td>
                    {!["VERIFIED", "REJECTED"].includes(a.status) && (
                      <Button variant="secondary" onClick={() => selectApp(a)}>
                        {a.assignedOfficer ? "Reassign" : "Assign"}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <EmptyState message="No applications match your filters." />}
      </Card>

      {selected && (
        <Modal title={`Assign verifier — ${selected.applicationNumber}`} onClose={() => { setSelected(null); setRecommendation(null); }}>
          {recommendation?.recommended && (
            <Notice>
              <strong>Recommended:</strong> {recommendation.recommended.name} ({recommendation.recommended.role}) —
              {recommendation.recommended.district || "No district"}, {recommendation.recommended.active_jobs} active jobs
            </Notice>
          )}
          <form onSubmit={assign}>
            <Field label="Verifier (LMO / GATC)">
              <select required value={form.officerId} onChange={(e) => setForm({ ...form, officerId: e.target.value })}>
                <option value="">Select verifier</option>
                {verifiers?.map((o) => (
                  <option key={o.id} value={o.id}>{o.name} ({o.role}) — {o.district || "No district"}</option>
                ))}
              </select>
            </Field>
            <Field label="Scheduled date">
              <input type="date" required value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} />
            </Field>
            <Field label="Note">
              <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional instructions" />
            </Field>
            <div style={{ display: "flex", gap: 10 }}>
              <Button>Confirm Assignment</Button>
              <Button type="button" variant="secondary" onClick={() => { setSelected(null); setRecommendation(null); }}>Cancel</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

/* ── User Management ── */

function UserManagement({ token, currentUser }) {
  const { data: users, refresh, loading } = useData(token, "/admin/users");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", role: "OFFICER", organization: "", state: "", district: "", area: "" });
  const [message, setMessage] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const createUser = async (e) => {
    e.preventDefault();
    try {
      await api("/admin/users", { token, method: "POST", body: form });
      setMessage("User created successfully.");
      setShowCreate(false);
      setForm({ name: "", email: "", password: "", phone: "", role: "OFFICER", organization: "", state: "", district: "", area: "" });
      refresh();
    } catch (err) { setMessage(err.message); }
  };

  const toggleStatus = async (user) => {
    if (user.id === currentUser?.id || user.email === currentUser?.email) {
      setMessage("You cannot deactivate your own admin account.");
      return;
    }
    const newStatus = user.accountStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await api(`/admin/users/${user.id}/status`, { token, method: "PATCH", body: { status: newStatus } });
      refresh();
    } catch (err) { setMessage(err.message); }
  };

  const filtered = users?.filter((u) => !roleFilter || u.role === roleFilter);

  return (
    <>
      <PageHeader
        title="User Management"
        subtitle="Create and manage officer, GATC, and admin accounts."
        action={<Button type="button" onClick={() => setShowCreate(true)}>+ Create User</Button>}
      />
      {message && <Notice>{message}</Notice>}
      <SearchBar value={roleFilter} onChange={() => {}} placeholder="">
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          <option value="OFFICER">Officers</option>
          <option value="GATC">GATC</option>
          <option value="ADMIN">Admin</option>
          <option value="APPLICANT">Applicants</option>
        </select>
      </SearchBar>
      <Card>
        {loading ? <LoadingState /> : filtered?.length ? (
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>District</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {filtered.map((u) => {
                const isSelf = u.id === currentUser?.id || u.email === currentUser?.email;
                return (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.name}</strong>
                      {isSelf && <span style={{ marginLeft: 6, fontSize: 11, color: "var(--accent)", fontWeight: 600 }}>(You)</span>}
                      <br /><small>{u.organization || ""}</small>
                    </td>
                    <td><small>{u.email}</small></td>
                    <td><span className={`status status--${u.role === "ADMIN" ? "SUBMITTED" : u.role === "OFFICER" ? "ASSIGNED" : u.role === "GATC" ? "VERIFIED" : "SUBMITTED"}`}>{u.role}</span></td>
                    <td><small>{u.district || "—"}</small></td>
                    <td><span className={`status status--${u.accountStatus === "ACTIVE" ? "VERIFIED" : "REJECTED"}`}>{u.accountStatus}</span></td>
                    <td>
                      {isSelf ? (
                        <span className="badge badge--INFO" style={{ fontSize: 11, padding: "4px 8px", opacity: 0.85 }}>
                          Current User
                        </span>
                      ) : (
                        <Button variant="secondary" onClick={() => toggleStatus(u)}>
                          {u.accountStatus === "ACTIVE" ? "Deactivate" : "Activate"}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : <EmptyState message="No users found." icon="👥" />}
      </Card>

      {showCreate && (
        <Modal title="Create New User" onClose={() => setShowCreate(false)}>
          <form onSubmit={createUser}>
            <Field label="Full Name"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Officer Name" /></Field>
            <Field label="Email"><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="e.g. officer@metrology.gov.in" /></Field>
            <Field label="Password"><input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Minimum 6 characters" /></Field>
            <Field label="Phone"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. +91 9876543210" /></Field>
            <Field label="Role">
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="OFFICER">Legal Metrology Officer (LMO)</option>
                <option value="GATC">Government Approved Test Centre (GATC)</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </Field>
            <Field label="Organization"><input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} placeholder="e.g. Dept of Legal Metrology" /></Field>
            <div className="two-input">
              <Field label="State"><input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="e.g. Delhi" /></Field>
              <Field label="District"><input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} placeholder="e.g. Central Delhi" /></Field>
            </div>
            <Field label="Area / Zone"><input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="e.g. Zone 1" /></Field>
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <Button>Create User</Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

/* ── Admin Certificates ── */

function AdminCertificates({ token }) {
  const { data, loading } = useData(token, "/certificates/all");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = data?.filter((c) => !statusFilter || c.status === statusFilter);

  return (
    <>
      <PageHeader title="All Certificates" subtitle="Monitor certificate lifecycle across the system." />
      <SearchBar value="" onChange={() => {}} placeholder="">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="EXPIRING_SOON">Expiring Soon</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </SearchBar>
      <Card>
        {loading ? <LoadingState /> : filtered?.length ? (
          <table>
            <thead><tr><th>Certificate</th><th>Application</th><th>Applicant</th><th>Instrument</th><th>Valid Until</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.certificateNumber}>
                  <td><strong>{c.certificateNumber}</strong></td>
                  <td>{c.applicationNumber}</td>
                  <td>{c.applicantName}</td>
                  <td>{c.instrumentType}<br /><small>{c.serialNumber}</small></td>
                  <td>{c.validUntil}</td>
                  <td><CertificateStatusBadge status={c.status} validUntil={c.validUntil} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <EmptyState message="No certificates found." icon="📜" />}
      </Card>
    </>
  );
}

/* ── Audit Log ── */

function AuditLog({ token }) {
  const { data, loading } = useData(token, "/admin/audit-log");

  return (
    <>
      <PageHeader title="Audit Log" subtitle="View system activity and change history." />
      <Card>
        {loading ? <LoadingState /> : data?.length ? (
          <table>
            <thead><tr><th>Time</th><th>Action</th><th>User</th><th>Details</th></tr></thead>
            <tbody>
              {data.map((log) => (
                <tr key={log.id}>
                  <td><small>{log.created_at?.slice(0, 16).replace("T", " ")}</small></td>
                  <td><span className="status status--ASSIGNED">{log.action}</span></td>
                  <td>{log.user_name || "System"}<br /><small>{log.user_role || ""}</small></td>
                  <td><small>{log.details}</small></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <EmptyState message="No audit entries yet." icon="📒" />}
      </Card>
    </>
  );
}

/* ═══════════════════════════════════════════════════
   VERIFIER (OFFICER + GATC shared views)
   ═══════════════════════════════════════════════════ */

function Verifier({ section, token, user }) {
  const { data: jobs, refresh, loading } = useData(token, "/officer/jobs");
  const { data: dashStats } = useData(token, "/officer/dashboard");
  const [active, setActive] = useState(null);

  // Automatically reset active inspection when user navigates to another sidebar section
  useEffect(() => {
    setActive(null);
  }, [section]);

  if (active) {
    return (
      <Inspection
        token={token}
        job={active}
        onDone={() => { setActive(null); refresh(); }}
      />
    );
  }

  const isHistory = section === "Inspection History" || section === "Verification History";

  // Dashboard view
  if (section === "Dashboard") {
    return (
      <>
        <PageHeader
          title={`${user.role === "GATC" ? "GATC" : "Officer"} Dashboard`}
          subtitle={`Welcome back, ${user.name?.split(" ")[0]}. Here's your overview.`}
        />
        {loading ? <LoadingState /> : dashStats && (
          <>
            <div className="metrics-grid">
              <Metric
                label="Today's Schedule"
                value={dashStats.todayScheduled}
                icon="jobs"
                visual="metricJobs"
                percentage={dashStats.todayRate}
                percentageLabel="of active queue"
                isPositive={true}
              />
              <Metric
                label="Pending Inspection"
                value={dashStats.pending}
                icon="applications"
                visual="metricApplications"
                percentage={dashStats.pendingRate}
                percentageLabel="queue share"
                isPositive={false}
              />
              <Metric
                label="Completed Stamping"
                value={dashStats.completed}
                icon="check"
                visual="metricCompleted"
                percentage={dashStats.completionRate}
                percentageLabel="completion rate"
                isPositive={true}
              />
              <Metric
                label="Total Assigned"
                value={dashStats.totalAssigned}
                icon="instruments"
                visual="metricInstruments"
                percentage={dashStats.completionRate}
                percentageLabel="total resolved"
                isPositive={true}
              />
            </div>

            {dashStats.todayJobs?.length > 0 && (
              <Card title="Today's Inspections">
                {dashStats.todayJobs.map((j) => (
                  <div key={j.id} className="job-card">
                    <div className="job-card-info">
                      <strong>{j.applicationNumber}</strong>
                      <span className="muted"> · {j.instrument.type} · {j.instrument.serialNumber}</span>
                      <br /><small className="muted">{j.applicant.name} · {j.instrument.locationAddress}</small>
                    </div>
                    <Button onClick={() => setActive(j)}>Start Inspection</Button>
                  </div>
                ))}
              </Card>
            )}

            {dashStats.upcomingJobs?.length > 0 && (
              <Card title="Upcoming (Next 7 Days)">
                {dashStats.upcomingJobs.map((j) => (
                  <div key={j.id} className="job-card">
                    <div className="job-card-info">
                      <strong>{j.applicationNumber}</strong>
                      <span className="muted"> · {j.instrument.type}</span>
                      <br /><small className="muted">Scheduled: {j.scheduledDate} · {j.applicant.name}</small>
                    </div>
                    <StatusBadge status={j.status} />
                  </div>
                ))}
              </Card>
            )}

            {(!dashStats.todayJobs?.length && !dashStats.upcomingJobs?.length) && (
              <Card><EmptyState message="No inspections scheduled. You're all caught up!" icon="🎉" /></Card>
            )}
          </>
        )}
      </>
    );
  }

  // My Jobs / History view
  return (
    <>
      <PageHeader
        title={isHistory ? (user.role === "GATC" ? "Verification History" : "Inspection History") : "My Assigned Jobs"}
        subtitle={isHistory ? "View completed verifications and inspection results." : "Open an assigned job and complete the field verification."}
      />
      {loading ? <LoadingState /> : jobs?.filter((j) =>
        isHistory ? ["VERIFIED", "REJECTED"].includes(j.status) : !["VERIFIED", "REJECTED"].includes(j.status)
      ).map((j) => (
        <Card key={j.id}>
          <div className="job-card">
            <div className="job-card-info">
              <strong>{j.applicationNumber}</strong>
              <br />
              <span>{j.instrument.type} · {j.instrument.brand} · {j.instrument.serialNumber}</span>
              <br />
              <small className="muted">
                {j.applicant.name} · {j.instrument.locationAddress}
                <br />Scheduled: {j.scheduledDate || "Not set"}
              </small>
            </div>
            <div className="job-card-actions">
              <StatusBadge status={j.status} />
              {!isHistory && !["VERIFIED", "REJECTED"].includes(j.status) && (
                <Button onClick={() => setActive(j)}>Start Inspection</Button>
              )}
            </div>
          </div>
        </Card>
      ))}
      {jobs && !jobs.filter((j) => isHistory ? ["VERIFIED", "REJECTED"].includes(j.status) : !["VERIFIED", "REJECTED"].includes(j.status)).length && (
        <Card><EmptyState message={isHistory ? "No completed inspections yet." : "No jobs assigned yet."} icon={isHistory ? "📁" : "🗂️"} /></Card>
      )}
    </>
  );
}

/* ── Inspection form ── */

function Inspection({ token, job, onDone }) {
  const [form, setForm] = useState({
    observedReading: "", standardReading: "", result: "PASS", remarks: "",
    photoUrls: [], verificationDate: dateToday(),
    validUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
  });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await api("/uploads", { token, method: "POST", body: fd });
      setForm((f) => ({ ...f, photoUrls: [...f.photoUrls, result.url] }));
    } catch (err) { setMessage(err.message); }
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await api(`/officer/inspection/${job.id}`, { token, method: "POST", body: form });
      setMessage(
        result.certificate
          ? `Inspection submitted. Certificate ${result.certificate.certificateNumber} created.`
          : "Inspection submitted with FAIL result.",
      );
      setTimeout(onDone, 1500);
    } catch (err) { setMessage(err.message); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader
        title="Field Inspection"
        subtitle={`${job.applicationNumber} · ${job.instrument.serialNumber}`}
        action={<Button variant="secondary" onClick={onDone}>← Back to Jobs</Button>}
      />

      <Card title="Application Details" className="form-card">
        <div className="inspection-details">
          <div className="detail-row"><span className="detail-label">Applicant</span><span>{job.applicant.name}</span></div>
          <div className="detail-row"><span className="detail-label">Instrument</span><span>{job.instrument.type} — {job.instrument.brand} {job.instrument.model}</span></div>
          <div className="detail-row"><span className="detail-label">Serial No.</span><span>{job.instrument.serialNumber}</span></div>
          <div className="detail-row"><span className="detail-label">Capacity</span><span>{job.instrument.capacity || "—"}</span></div>
          <div className="detail-row"><span className="detail-label">Location</span><span>{job.instrument.locationAddress}</span></div>
        </div>
      </Card>

      <Card title="Inspection Form" className="form-card">
        <form onSubmit={submit}>
          <div className="two-input">
            <Field label="Observed reading">
              <input required value={form.observedReading} onChange={(e) => setForm({ ...form, observedReading: e.target.value })} placeholder="e.g. 9.99 kg" />
            </Field>
            <Field label="Standard reading">
              <input required value={form.standardReading} onChange={(e) => setForm({ ...form, standardReading: e.target.value })} placeholder="e.g. 10.00 kg" />
            </Field>
          </div>
          <Field label="Result">
            <select value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })}>
              <option value="PASS">✅ PASS — Instrument verified</option>
              <option value="FAIL">❌ FAIL — Instrument rejected</option>
            </select>
          </Field>
          <Field label="Remarks">
            <textarea required value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Observations, seal condition, notes…" />
          </Field>
          <Field label="Evidence Photo">
            <input type="file" accept="image/*" capture="environment" onChange={upload} />
          </Field>
          {form.photoUrls.length > 0 && <PhotoGallery photos={form.photoUrls} />}
          <div className="two-input">
            <Field label="Verification date">
              <input required type="date" value={form.verificationDate} onChange={(e) => setForm({ ...form, verificationDate: e.target.value })} />
            </Field>
            <Field label="Valid until">
              <input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
            </Field>
          </div>
          <Button disabled={busy} className="wide">
            {busy ? "Submitting…" : "Submit Inspection"}
          </Button>
        </form>
        {message && <Notice>{message}</Notice>}
      </Card>
    </>
  );
}

/* ═══════════════════════════════════════════════════
   PUBLIC CERTIFICATE VERIFICATION
   ═══════════════════════════════════════════════════ */

function PublicVerify() {
  const getInitialToken = () => {
    const path = window.location.pathname;
    if (path.startsWith("/verify/")) {
      return decodeURIComponent(path.replace("/verify/", "").split("/")[0]);
    }
    const hash = window.location.hash;
    if (hash.startsWith("#/verify/")) {
      return decodeURIComponent(hash.replace("#/verify/", "").split("/")[0]);
    }
    return "";
  };

  const [token, setToken] = useState(getInitialToken());
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const verify = async (e) => {
    e?.preventDefault();
    if (!token) return;
    try {
      setResult(await api(`/certificates/verify/${token}`));
      setError("");
    } catch (err) { setError(err.message); setResult(null); }
  };

  useEffect(() => { if (token) { void verify(); } }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="verify">
      <Card>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ display: "inline-flex", marginBottom: 12 }}>
            <Icon name="brandLogo" />
          </div>
          <h1 style={{ fontSize: 24, marginBottom: 4 }}>Certificate Verification</h1>
          <p className="muted">Verify the authenticity of a Legal Metrology verification certificate.</p>
        </div>
        <form className="inline-form" onSubmit={verify}>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter Certificate No. (e.g. LMC-2026-0001), Application No., Serial No. or QR Hash"
          />
          <Button>Verify</Button>
        </form>
        <p className="muted" style={{ fontSize: 12, marginTop: 8, textAlign: "center" }}>
          💡 Enter your Certificate Number printed on the PDF (e.g. <code>LMC-2026-0001</code>), Application Number, Instrument Serial Number, or scan the QR Code.
        </p>
        {error && <Notice type="error">{error}</Notice>}
        {result && (
          <div className={`verified ${result.status !== "ACTIVE" && result.status !== "VALID" ? "verified--expired" : ""}`}>
            <h2>
              {result.status === "ACTIVE" || result.status === "VALID" ? "✓ Certificate Valid" :
               result.status === "EXPIRING_SOON" ? "⚠ Certificate Expiring Soon" : "✕ Certificate Expired"}
            </h2>
            <div className="verify-grid">
              <div className="detail-row"><span className="detail-label">Certificate:</span><span>{result.certificateNumber}</span></div>
              <div className="detail-row"><span className="detail-label">Application:</span><span>{result.applicationNumber}</span></div>
              <div className="detail-row"><span className="detail-label">Owner:</span><span>{result.applicantName}</span></div>
              {result.applicantOrganization && <div className="detail-row"><span className="detail-label">Organization:</span><span>{result.applicantOrganization}</span></div>}
              <div className="detail-row"><span className="detail-label">Instrument:</span><span>{result.instrumentType} — {result.brand} {result.model}</span></div>
              <div className="detail-row"><span className="detail-label">Serial No.:</span><span>{result.serialNumber}</span></div>
              {result.capacity && <div className="detail-row"><span className="detail-label">Capacity:</span><span>{result.capacity}</span></div>}
              <div className="detail-row"><span className="detail-label">Verified on:</span><span>{result.verificationDate}</span></div>
              <div className="detail-row"><span className="detail-label">Valid until:</span><span>{result.validUntil}</span></div>
              {result.officerName && <div className="detail-row"><span className="detail-label">Verified by:</span><span>{result.officerName} ({result.officerRole})</span></div>}
            </div>
          </div>
        )}
      </Card>
    </main>
  );
}

/* ═══════════════════════════════════════════════════
   ROOT
   ═══════════════════════════════════════════════════ */

export default function App() {
  const [session, setSession] = useState(() =>
    JSON.parse(localStorage.getItem("lm-session") || "null"),
  );

  const isVerifyRoute = window.location.pathname.startsWith("/verify") || window.location.hash.startsWith("#/verify");
  if (isVerifyRoute) return <PublicVerify />;

  const login = (data) => {
    localStorage.setItem("lm-session", JSON.stringify(data));
    setSession(data);
  };

  const logout = () => {
    localStorage.removeItem("lm-session");
    setSession(null);
  };

  return session ? (
    <Shell session={session} onLogout={logout} />
  ) : (
    <Auth onLogin={login} />
  );
}
