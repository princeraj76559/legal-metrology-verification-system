import { db, makeId, makeNow } from "../db.js";

/**
 * Record an audit trail entry.
 *
 * @param {string} action     - e.g. APPLICATION_SUBMITTED, OFFICER_ASSIGNED, INSPECTION_COMPLETED
 * @param {string} entityType - e.g. APPLICATION, INSTRUMENT, CERTIFICATE, USER
 * @param {string} entityId   - ID of the related entity
 * @param {object|null} user  - { id, role } of the acting user (null for system events)
 * @param {string} details    - Human-readable description
 */
export function logAudit(action, entityType, entityId, user, details) {
  db.prepare(
    "INSERT INTO audit_log VALUES (@id,@action,@entity_type,@entity_id,@user_id,@user_role,@details,@created_at)",
  ).run({
    id: makeId(),
    action,
    entity_type: entityType,
    entity_id: entityId,
    user_id: user?.id || null,
    user_role: user?.role || null,
    details: details || "",
    created_at: makeNow(),
  });
}
