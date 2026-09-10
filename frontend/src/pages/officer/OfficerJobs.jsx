import React from "react";
import { Card } from "../../components/Card";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { StatusBadge } from "../../components/StatusBadge";
export function OfficerJobs() {
  return (
    <>
      <PageHeader
        title="My Jobs"
        subtitle="Complete assigned field verifications."
      />
      <Card title="VER-2026-0001">
        <p>
          <b>Rahul Sharma</b> · Electronic Weighing Scale
        </p>
        <p className="muted">
          Shop 12, Main Market, Delhi · Scheduled 11 Sep 2026
        </p>
        <StatusBadge status="ASSIGNED" />
        <p>
          <Button>Start Inspection</Button>
        </p>
      </Card>
    </>
  );
}
