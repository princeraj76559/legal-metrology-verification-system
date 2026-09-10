import React, { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { PageHeader } from "../components/PageHeader";

export function Profile({ token }) {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api("/auth/profile", { token }).then((data) => {
      setProfile(data);
      setForm({ name: data.name, phone: data.phone || "", organization: data.organization || "", state: data.state || "", district: data.district || "" });
    }).catch(() => {});
  }, [token]);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const updated = await api("/auth/profile", { token, method: "PUT", body: form });
      setProfile(updated);
      setEditing(false);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!profile) return <Card><p className="muted">Loading profile…</p></Card>;

  const roleLabels = {
    APPLICANT: "Applicant / Business Owner",
    OFFICER: "Legal Metrology Officer (LMO)",
    GATC: "Government Approved Test Centre (GATC)",
    ADMIN: "System Administrator",
  };

  return (
    <>
      <PageHeader title="My Profile" subtitle="View and manage your account information." />
      <div className="two-column">
        <Card title="Account Information">
          {editing ? (
            <form onSubmit={save}>
              <label className="field"><span>Full Name</span>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label className="field"><span>Phone</span>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </label>
              <label className="field"><span>Organization</span>
                <input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} />
              </label>
              <label className="field"><span>State</span>
                <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              </label>
              <label className="field"><span>District</span>
                <input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
              </label>
              <div style={{ display: "flex", gap: 10 }}>
                <Button disabled={busy}>{busy ? "Saving…" : "Save Changes"}</Button>
                <Button type="button" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
              {message && <div className="notice" style={{ marginTop: 10 }}>{message}</div>}
            </form>
          ) : (
            <>
              <div className="profile-grid">
                <ProfileRow label="Full Name" value={profile.name} />
                <ProfileRow label="Email" value={profile.email} />
                <ProfileRow label="Phone" value={profile.phone || "Not set"} />
                <ProfileRow label="Role" value={roleLabels[profile.role] || profile.role} />
                <ProfileRow label="Organization" value={profile.organization || "Not set"} />
                <ProfileRow label="State" value={profile.state || "Not set"} />
                <ProfileRow label="District" value={profile.district || "Not set"} />
                <ProfileRow label="Area" value={profile.area || "Not set"} />
                <ProfileRow label="Account Status">
                  <span className={`status status--${profile.accountStatus === "ACTIVE" ? "VERIFIED" : "REJECTED"}`}>
                    {profile.accountStatus}
                  </span>
                </ProfileRow>
                <ProfileRow label="Member Since" value={profile.createdAt?.slice(0, 10)} />
              </div>
              <Button onClick={() => setEditing(true)} style={{ marginTop: 16 }}>Edit Profile</Button>
              {message && <div className="notice" style={{ marginTop: 10 }}>{message}</div>}
            </>
          )}
        </Card>

        <Card title="Account Security">
          <div className="profile-grid">
            <ProfileRow label="Account ID" value={profile.id?.slice(0, 8) + "…"} />
            <ProfileRow label="Authentication" value="JWT Token (24h expiry)" />
            <ProfileRow label="Password" value="••••••••" />
          </div>
          <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
            Contact the system administrator to change your password or update restricted fields like email or role.
          </p>
        </Card>
      </div>
    </>
  );
}

function ProfileRow({ label, value, children }) {
  const displayLabel = label.endsWith(":") ? label : `${label}:`;
  return (
    <div className="profile-row">
      <span className="profile-label">{displayLabel}</span>
      {children || <span className="profile-value">{value}</span>}
    </div>
  );
}
