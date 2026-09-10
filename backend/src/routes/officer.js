import { Router } from "express";
import { db, makeId, makeNow } from "../db.js";
import { logAudit } from "../middleware/audit.js";

export default function officerRoutes({ auth, ok, fail, nextNumber, apiUrl, generateCertificate }) {
  const router = Router();

  const appRow = `SELECT a.*, u.name applicant_name, u.email applicant_email, u.phone applicant_phone,
    i.type instrument_type, i.brand instrument_brand, i.model instrument_model,
    i.serial_number, i.capacity, i.location_address,
    o.name officer_name, o.role officer_role
    FROM applications a
    JOIN users u ON a.applicant_id=u.id
    JOIN instruments i ON a.instrument_id=i.id
    LEFT JOIN users o ON a.assigned_officer_id=o.id`;

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
    };

  const getApp = (applicationId) =>
    db.prepare(`${appRow} WHERE a.id=?`).get(applicationId);

  /* ── Officer/GATC Jobs ── */
  router.get("/jobs", auth(["OFFICER", "GATC"]), (req, res) =>
    ok(res, db.prepare(`${appRow} WHERE a.assigned_officer_id=? ORDER BY a.scheduled_date`)
      .all(req.user.id).map(serializeApp)),
  );

  /* ── Officer/GATC Dashboard Stats ── */
  router.get("/dashboard", auth(["OFFICER", "GATC"]), (req, res) => {
    const userId = req.user.id;
    const today = new Date().toISOString().slice(0, 10);

    const totalAssigned = db.prepare(
      "SELECT COUNT(*) n FROM applications WHERE assigned_officer_id=?",
    ).get(userId).n;
    const pending = db.prepare(
      "SELECT COUNT(*) n FROM applications WHERE assigned_officer_id=? AND status NOT IN ('VERIFIED','REJECTED')",
    ).get(userId).n;
    const todayScheduled = db.prepare(
      "SELECT COUNT(*) n FROM applications WHERE assigned_officer_id=? AND scheduled_date=? AND status NOT IN ('VERIFIED','REJECTED')",
    ).get(userId, today).n;
    const completed = db.prepare(
      "SELECT COUNT(*) n FROM applications WHERE assigned_officer_id=? AND status IN ('VERIFIED','REJECTED')",
    ).get(userId).n;
    const verified = db.prepare(
      "SELECT COUNT(*) n FROM applications WHERE assigned_officer_id=? AND status='VERIFIED'",
    ).get(userId).n;
    const rejected = db.prepare(
      "SELECT COUNT(*) n FROM applications WHERE assigned_officer_id=? AND status='REJECTED'",
    ).get(userId).n;

    // Today's jobs detail
    const todayJobs = db.prepare(
      `${appRow} WHERE a.assigned_officer_id=? AND a.scheduled_date=? AND a.status NOT IN ('VERIFIED','REJECTED') ORDER BY a.submitted_at`,
    ).all(userId, today).map(serializeApp);

    // Upcoming jobs (next 7 days)
    const upcomingJobs = db.prepare(
      `${appRow} WHERE a.assigned_officer_id=? AND a.scheduled_date > ? AND a.scheduled_date <= date(?, '+7 days') AND a.status NOT IN ('VERIFIED','REJECTED') ORDER BY a.scheduled_date`,
    ).all(userId, today, today).map(serializeApp);

    ok(res, {
      totalAssigned,
      pending,
      todayScheduled,
      completed,
      verified,
      rejected,
      completionRate: totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0,
      pendingRate: totalAssigned > 0 ? Math.round((pending / totalAssigned) * 100) : 0,
      todayRate: todayScheduled > 0 ? Math.round((todayScheduled / (pending || 1)) * 100) : 0,
      todayJobs,
      upcomingJobs,
    });
  });

  /* ── Submit Inspection ── */
  router.post("/inspection/:applicationId", auth(["OFFICER", "GATC"]), (req, res) => {
    const row = getApp(req.params.applicationId);
    if (!row) return fail(res, "Application not found", {}, 404);
    if (row.assigned_officer_id !== req.user.id)
      return fail(res, "This job is not assigned to you", {}, 403);
    if (["VERIFIED", "REJECTED"].includes(row.status))
      return fail(res, "Inspection has already been completed");

    const {
      observedReading = "",
      standardReading = "",
      result,
      remarks = "",
      photoUrls = [],
      verificationDate,
      validUntil,
    } = req.body;

    if (!["PASS", "FAIL"].includes(result) || !verificationDate)
      return fail(res, "Result and verification date are required");

    const inspection = {
      id: makeId(),
      application_id: row.id,
      officer_id: req.user.id,
      observed_reading: observedReading,
      standard_reading: standardReading,
      result,
      remarks,
      photo_urls: JSON.stringify(photoUrls),
      verification_date: verificationDate,
      valid_until: validUntil || null,
      created_at: makeNow(),
    };

    const tx = db.transaction(() => {
      db.prepare(
        "INSERT INTO inspections VALUES (@id,@application_id,@officer_id,@observed_reading,@standard_reading,@result,@remarks,@photo_urls,@verification_date,@valid_until,@created_at)",
      ).run(inspection);
      db.prepare("UPDATE applications SET status=? WHERE id=?").run(
        result === "PASS" ? "VERIFIED" : "REJECTED",
        row.id,
      );
    });
    tx();

    logAudit("INSPECTION_COMPLETED", "APPLICATION", row.id, req.user,
      `Inspection result: ${result} for ${row.application_number}`);

    let certificate = null;
    if (result === "PASS") {
      const valid = validUntil ||
        new Date(new Date(verificationDate).setFullYear(
          new Date(verificationDate).getFullYear() + 1,
        )).toISOString().slice(0, 10);

      certificate = {
        id: makeId(),
        certificate_number: nextNumber("LMS", "certificates", "certificate_number"),
        application_id: row.id,
        qr_token: makeId(),
        issued_at: makeNow(),
        valid_until: valid,
        certificate_path: null,
      };
      db.prepare(
        "INSERT INTO certificates VALUES (@id,@certificate_number,@application_id,@qr_token,@issued_at,@valid_until,@certificate_path)",
      ).run(certificate);

      logAudit("CERTIFICATE_GENERATED", "CERTIFICATE", certificate.id, req.user,
        `Certificate ${certificate.certificate_number} issued`);

      generateCertificate(certificate, getApp(row.id), inspection);
    }

    ok(res, {
      application: serializeApp(getApp(row.id)),
      certificate: certificate && {
        certificateNumber: certificate.certificate_number,
        qrToken: certificate.qr_token,
        validUntil: certificate.valid_until,
        downloadUrl: `${apiUrl}/api/v1/certificates/${certificate.certificate_number}/download`,
      },
    }, "Inspection submitted successfully");
  });

  return router;
}
