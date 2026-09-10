import { Router } from "express";
import { db, makeId, makeNow } from "../db.js";
import { logAudit } from "../middleware/audit.js";

export default function applicationRoutes({ auth, ok, fail, nextNumber, apiUrl }) {
  const router = Router();

  const appRow = `SELECT a.*, u.name applicant_name, u.email applicant_email, u.phone applicant_phone,
    i.type instrument_type, i.brand instrument_brand, i.model instrument_model,
    i.serial_number, i.capacity, i.location_address,
    i.state as instrument_state, i.district as instrument_district,
    o.name officer_name, o.role officer_role,
    c.id as certificate_id, c.certificate_number, c.valid_until as certificate_valid_until, c.issued_at as certificate_issued_at
    FROM applications a
    JOIN users u ON a.applicant_id=u.id
    JOIN instruments i ON a.instrument_id=i.id
    LEFT JOIN users o ON a.assigned_officer_id=o.id
    LEFT JOIN certificates c ON a.id=c.application_id`;

  const serializeApp = (row) =>
    row && {
      id: row.id,
      applicationNumber: row.application_number,
      applicationType: row.application_type,
      status: row.status,
      preferredDate: row.preferred_date,
      scheduledDate: row.scheduled_date,
      remarks: row.remarks,
      submittedAt: row.submitted_at,
      state: row.state,
      district: row.district,
      applicant: {
        id: row.applicant_id,
        name: row.applicant_name,
        email: row.applicant_email,
        phone: row.applicant_phone,
      },
      instrument: {
        id: row.instrument_id,
        type: row.instrument_type,
        brand: row.instrument_brand,
        model: row.instrument_model,
        serialNumber: row.serial_number,
        capacity: row.capacity,
        locationAddress: row.location_address,
      },
      assignedOfficer: row.assigned_officer_id
        ? { id: row.assigned_officer_id, name: row.officer_name, role: row.officer_role }
        : null,
      certificate: row.certificate_id
        ? {
            id: row.certificate_id,
            certificateNumber: row.certificate_number,
            validUntil: row.certificate_valid_until,
            issuedAt: row.certificate_issued_at,
            downloadUrl: `${apiUrl}/api/v1/certificates/${row.certificate_number}/download`,
          }
        : null,
    };

  const getApp = (applicationId) =>
    db.prepare(`${appRow} WHERE a.id=?`).get(applicationId);

  /* ── List all applications (ADMIN) ── */
  router.get("/", auth(["ADMIN"]), (req, res) => {
    const { status, district, search, sort = "submitted_at", order = "DESC" } = req.query;
    let sql = appRow + " WHERE 1=1";
    const params = [];

    if (status) { sql += " AND a.status=?"; params.push(status); }
    if (district) { sql += " AND a.district=?"; params.push(district); }
    if (search) {
      sql += " AND (a.application_number LIKE ? OR u.name LIKE ? OR i.serial_number LIKE ?)";
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    const validSorts = ["submitted_at", "scheduled_date", "application_number", "status"];
    const sortCol = validSorts.includes(sort) ? `a.${sort}` : "a.submitted_at";
    const sortOrder = order === "ASC" ? "ASC" : "DESC";
    sql += ` ORDER BY ${sortCol} ${sortOrder}`;

    ok(res, db.prepare(sql).all(...params).map(serializeApp));
  });

  /* ── My applications (APPLICANT) ── */
  router.get("/my", auth(["APPLICANT"]), (req, res) =>
    ok(res, db.prepare(`${appRow} WHERE a.applicant_id=? ORDER BY a.submitted_at DESC`)
      .all(req.user.id).map(serializeApp)),
  );

  /* ── Get single application with inspection + certificate details ── */
  router.get("/:applicationId", auth(), (req, res) => {
    const row = getApp(req.params.applicationId);
    if (!row) return fail(res, "Application not found", {}, 404);
    if (req.user.role === "APPLICANT" && row.applicant_id !== req.user.id)
      return fail(res, "Forbidden", {}, 403);
    if (["OFFICER", "GATC"].includes(req.user.role) && row.assigned_officer_id !== req.user.id)
      return fail(res, "Forbidden", {}, 403);

    const inspection = db.prepare("SELECT * FROM inspections WHERE application_id=?").get(row.id);
    const certificate = db.prepare("SELECT * FROM certificates WHERE application_id=?").get(row.id);

    // Get audit trail for this application
    const auditTrail = db.prepare(
      "SELECT * FROM audit_log WHERE entity_id=? AND entity_type='APPLICATION' ORDER BY created_at ASC",
    ).all(row.id);

    ok(res, {
      ...serializeApp(row),
      inspection: inspection && {
        id: inspection.id,
        observedReading: inspection.observed_reading,
        standardReading: inspection.standard_reading,
        result: inspection.result,
        remarks: inspection.remarks,
        photoUrls: JSON.parse(inspection.photo_urls),
        verificationDate: inspection.verification_date,
        validUntil: inspection.valid_until,
        createdAt: inspection.created_at,
      },
      certificate: certificate && {
        certificateNumber: certificate.certificate_number,
        qrToken: certificate.qr_token,
        validUntil: certificate.valid_until,
        issuedAt: certificate.issued_at,
        downloadUrl: `${apiUrl}/api/v1/certificates/${certificate.certificate_number}/download`,
        status: getCertificateStatus(certificate.valid_until),
      },
      auditTrail,
    });
  });

  /* ── Submit new application ── */
  router.post("/", auth(["APPLICANT"]), (req, res) => {
    const {
      instrumentId,
      applicationType = "NEW_VERIFICATION",
      preferredDate = null,
      remarks = "",
    } = req.body;

    const instrument = db.prepare("SELECT * FROM instruments WHERE id=? AND owner_id=?")
      .get(instrumentId, req.user.id);
    if (!instrument) return fail(res, "Select an instrument you own");

    const item = {
      id: makeId(),
      application_number: nextNumber("VER", "applications", "application_number"),
      applicant_id: req.user.id,
      instrument_id: instrumentId,
      application_type: applicationType,
      status: "SUBMITTED",
      preferred_date: preferredDate,
      scheduled_date: null,
      remarks,
      assigned_officer_id: null,
      state: instrument.state || null,
      district: instrument.district || null,
      submitted_at: makeNow(),
    };
    db.prepare(
      "INSERT INTO applications VALUES (@id,@application_number,@applicant_id,@instrument_id,@application_type,@status,@preferred_date,@scheduled_date,@remarks,@assigned_officer_id,@state,@district,@submitted_at)",
    ).run(item);

    logAudit("APPLICATION_SUBMITTED", "APPLICATION", item.id, req.user,
      `Application ${item.application_number} submitted for ${instrument.type} (${instrument.serial_number})`);

    ok(res, serializeApp(getApp(item.id)), "Application created successfully", 201);
  });

  /* ── Assign officer/GATC ── */
  router.patch("/:applicationId/assign", auth(["ADMIN"]), (req, res) => {
    const { officerId, scheduledDate, notes = "" } = req.body;
    if (!officerId || !scheduledDate)
      return fail(res, "Verifier and scheduled date are required");

    const verifier = db.prepare("SELECT * FROM users WHERE id=? AND role IN ('OFFICER','GATC') AND account_status='ACTIVE'")
      .get(officerId);
    if (!verifier) return fail(res, "Verifier not found or inactive");

    const row = getApp(req.params.applicationId);
    if (!row) return fail(res, "Application not found", {}, 404);

    const previousOfficer = row.assigned_officer_id;
    db.prepare(
      "UPDATE applications SET assigned_officer_id=?, scheduled_date=?, status='ASSIGNED', remarks=CASE WHEN ? <> '' THEN ? ELSE remarks END WHERE id=?",
    ).run(officerId, scheduledDate, notes, notes, row.id);

    const action = previousOfficer ? "ASSIGNMENT_CHANGED" : "OFFICER_ASSIGNED";
    logAudit(action, "APPLICATION", row.id, req.user,
      `${verifier.role} ${verifier.name} assigned, scheduled for ${scheduledDate}`);

    ok(res, serializeApp(getApp(row.id)), "Verifier assigned successfully");
  });

  return router;
}

function getCertificateStatus(validUntil) {
  const today = new Date().toISOString().slice(0, 10);
  if (validUntil < today) return "EXPIRED";
  const daysLeft = Math.ceil((new Date(validUntil) - new Date(today)) / 86400000);
  if (daysLeft <= 30) return "EXPIRING_SOON";
  return "ACTIVE";
}
