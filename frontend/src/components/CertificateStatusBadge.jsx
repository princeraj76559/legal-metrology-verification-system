import React from "react";

export function CertificateStatusBadge({ status, validUntil }) {
  // Compute status if not provided
  let computed = status;
  if (!computed && validUntil) {
    const today = new Date().toISOString().slice(0, 10);
    if (validUntil < today) computed = "EXPIRED";
    else {
      const daysLeft = Math.ceil((new Date(validUntil) - new Date(today)) / 86400000);
      computed = daysLeft <= 30 ? "EXPIRING_SOON" : "ACTIVE";
    }
  }

  const labels = {
    ACTIVE: "Active",
    EXPIRING_SOON: "Expiring Soon",
    EXPIRED: "Expired",
    REVOKED: "Revoked",
  };

  return (
    <span className={`cert-status cert-status--${computed || "ACTIVE"}`}>
      {labels[computed] || computed}
    </span>
  );
}
