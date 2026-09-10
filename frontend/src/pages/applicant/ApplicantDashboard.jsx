import React from "react";
import { Card } from "../../components/Card";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { StatusBadge } from "../../components/StatusBadge";
export function ApplicantDashboard() {
  return (
    <>
      <PageHeader
        title="Welcome, Rahul"
        subtitle="Manage instruments and verification requests."
        action={<Button>New Application</Button>}
      />
      <div className="stat-grid">
        <Card>
          <p className="muted">Registered instruments</p>
          <strong className="stat">3</strong>
        </Card>
        <Card>
          <p className="muted">Active applications</p>
          <strong className="stat">1</strong>
        </Card>
        <Card>
          <p className="muted">Valid certificates</p>
          <strong className="stat">2</strong>
        </Card>
      </div>
      <Card title="Latest application">
        <p>
          <b>VER-2026-0001</b> · Electronic Weighing Scale
        </p>
        <StatusBadge status="ASSIGNED" />
      </Card>
    </>
  );
}
