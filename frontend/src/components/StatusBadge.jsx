import React from "react";

const labels = {
  SUBMITTED: "Submitted",
  ASSIGNED: "Assigned",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
};
export function StatusBadge({ status }) {
  return (
    <span className={`status status--${status}`}>
      {labels[status] ?? status}
    </span>
  );
}
