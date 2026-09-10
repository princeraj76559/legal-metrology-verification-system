import { Router } from "express";
import { db } from "../db.js";

export default function certificateRoutes({ auth, ok, fail, apiUrl, certificateDir, fs, path }) {
  const router = Router();

  /* ── My certificates (APPLICANT) ── */
  router.get("/my", auth(["APPLICANT"]), (req, res) =>
    ok(res, db.prepare(
      `SELECT c.*, a.application_number, i.type, i.serial_number, i.brand, i.model
       FROM certificates c
       JOIN applications a ON c.application_id=a.id
       JOIN instruments i ON a.instrument_id=i.id
       WHERE a.applicant_id=? ORDER BY c.issued_at DESC`,
    ).all(req.user.id).map((r) => ({
      certificateNumber: r.certificate_number,
      validUntil: r.valid_until,
      issuedAt: r.issued_at,
      instrumentType: r.type,
      serialNumber: r.serial_number,
      brand: r.brand,
      model: r.model,
      downloadUrl: `${apiUrl}/api/v1/certificates/${r.certificate_number}/download`,
      status: getCertificateStatus(r.valid_until),
    }))),
  );

  /* ── All certificates (ADMIN) ── */
  router.get("/all", auth(["ADMIN"]), (req, res) => {
    const { status: filterStatus } = req.query;
    let rows = db.prepare(
      `SELECT c.*, a.application_number, u.name applicant_name, i.type, i.serial_number
       FROM certificates c
       JOIN applications a ON c.application_id=a.id
       JOIN users u ON a.applicant_id=u.id
       JOIN instruments i ON a.instrument_id=i.id
       ORDER BY c.issued_at DESC`,
    ).all().map((r) => ({
      certificateNumber: r.certificate_number,
      applicationNumber: r.application_number,
      applicantName: r.applicant_name,
      validUntil: r.valid_until,
      issuedAt: r.issued_at,
      instrumentType: r.type,
      serialNumber: r.serial_number,
      downloadUrl: `${apiUrl}/api/v1/certificates/${r.certificate_number}/download`,
      status: getCertificateStatus(r.valid_until),
    }));

    if (filterStatus) {
      rows = rows.filter((r) => r.status === filterStatus);
    }
    ok(res, rows);
  });

  /* ── Download certificate PDF ── */
  const serveDownload = (req, res, certIdentifier) => {
    const cert = db.prepare("SELECT * FROM certificates WHERE certificate_number=? OR id=?")
      .get(certIdentifier, certIdentifier);
    if (!cert) return fail(res, "Certificate not found", {}, 404);
    const file = path.join(certificateDir, cert.certificate_path || "");
    if (!fs.existsSync(file))
      return fail(res, "Certificate is being generated; try again shortly", {}, 404);
    res.download(file, `${cert.certificate_number}.pdf`);
  };

  router.get("/download/:idOrNumber", auth(), (req, res) => {
    serveDownload(req, res, req.params.idOrNumber);
  });

  router.get("/:certificateNumber/download", auth(), (req, res) => {
    serveDownload(req, res, req.params.certificateNumber);
  });

  /* ── Public verification ── */
  router.get("/verify/:qrToken", (req, res) => {
    const r = db.prepare(
      `SELECT c.*, a.application_number, u.name applicant_name, u.organization,
              i.type, i.brand, i.model, i.serial_number, i.capacity, i.location_address,
              ins.verification_date, ins.observed_reading, ins.standard_reading, ins.result,
              o.name officer_name, o.role officer_role, o.organization officer_org
       FROM certificates c
       JOIN applications a ON c.application_id=a.id
       JOIN users u ON a.applicant_id=u.id
       JOIN instruments i ON a.instrument_id=i.id
       JOIN inspections ins ON ins.application_id=a.id
       LEFT JOIN users o ON a.assigned_officer_id=o.id
       WHERE LOWER(c.qr_token) = LOWER(?)
          OR LOWER(c.certificate_number) = LOWER(?)
          OR LOWER(a.application_number) = LOWER(?)
          OR LOWER(i.serial_number) = LOWER(?)`,
    ).get(req.params.qrToken, req.params.qrToken, req.params.qrToken, req.params.qrToken);
    if (!r) return fail(res, "Certificate not found", {}, 404);

    const status = getCertificateStatus(r.valid_until);

    ok(res, {
      certificateNumber: r.certificate_number,
      applicationNumber: r.application_number,
      status,
      applicantName: r.applicant_name,
      applicantOrganization: r.organization,
      instrumentType: r.type,
      brand: r.brand,
      model: r.model,
      serialNumber: r.serial_number,
      capacity: r.capacity,
      locationAddress: r.location_address,
      verificationDate: r.verification_date,
      validUntil: r.valid_until,
      issuedAt: r.issued_at,
      result: r.result,
      officerName: r.officer_name,
      officerRole: r.officer_role,
      officerOrganization: r.officer_org,
    });
  });

  return router;
}

function getCertificateStatus(validUntil) {
  const today = new Date().toISOString().slice(0, 10);
  if (validUntil < today) return "EXPIRED";
  const daysLeft = Math.ceil((new Date(validUntil) - new Date(today)) / 86400000);
  if (daysLeft <= 7) return "EXPIRING_SOON";
  if (daysLeft <= 30) return "EXPIRING_SOON";
  return "ACTIVE";
}
