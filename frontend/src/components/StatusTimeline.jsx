import React from "react";

const STEPS = [
  { key: "SUBMITTED", label: "Submitted" },
  { key: "ASSIGNED", label: "Assigned" },
  { key: "INSPECTION", label: "Inspection" },
  { key: "RESULT", label: "Result" },
  { key: "CERTIFICATE", label: "Certificate" },
];

const statusIndex = {
  SUBMITTED: 0,
  ASSIGNED: 1,
  SCHEDULED: 1,
  INSPECTION: 2,
  INSPECTION_STARTED: 2,
  UNDER_INSPECTION: 2,
  RESULT: 3,
  REJECTED: 3,
  VERIFIED: 4,
};

export function StatusTimeline({ status, hasCertificate = true }) {
  const current = statusIndex[status] ?? 0;

  return (
    <div className="timeline-container">
      <div className="timeline">
        {STEPS.map((step, i) => {
          let state = "pending";
          if (status === "REJECTED") {
            if (i < 3) state = "done";
            else if (i === 3) state = "rejected";
            else state = "pending";
          } else if (status === "VERIFIED") {
            state = "done";
          } else {
            if (i < current) state = "done";
            else if (i === current) state = "active";
            else state = "pending";
          }

          return (
            <div key={step.key} className={`timeline-step ${state}`}>
              <div className="timeline-dot">
                {state === "done" ? "✓" : state === "rejected" ? "✕" : i + 1}
              </div>
              <span className="timeline-label">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
