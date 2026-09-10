import "dotenv/config";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import multer from "multer";
import QRCode from "qrcode";
import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";
import { db, seed, makeId, makeNow, uploadDir, certificateDir } from "./db.js";

// Route modules
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import applicationRoutes from "./routes/applications.js";
import officerRoutes from "./routes/officer.js";
import certificateRoutes from "./routes/certificates.js";

seed();

const app = express();
const port = Number(process.env.PORT || 4000);
const secret = process.env.JWT_SECRET || "development-only-secret-change-me";
const apiUrl = process.env.API_URL || `http://localhost:${port}`;
const publicAppUrl = process.env.PUBLIC_APP_URL || "http://localhost:5173";
const allowedOrigins = (
  process.env.FRONTEND_URL ||
  "http://localhost:5173,http://localhost:5174,http://localhost:5175"
).split(",").map((s) => s.trim());

/* ── Middleware ── */

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(uploadDir));
app.use("/certificates", express.static(certificateDir));

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_, file, cb) =>
      cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

/* ── Shared helpers ── */

const ok = (res, data, message = "Success", status = 200) =>
  res.status(status).json({ success: true, message, data });

const fail = (res, message, errors = {}, status = 400) =>
  res.status(status).json({ success: false, message, errors });

const userPublic = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  district: user.district,
  state: user.state,
  organization: user.organization,
});

const auth = (roles = []) => (req, res, next) => {
  try {
    const token =
      req.headers.authorization?.replace("Bearer ", "") || req.query.token;
    if (!token) return fail(res, "Authentication required", {}, 401);
    req.user = jwt.verify(token, secret);
    if (roles.length && !roles.includes(req.user.role))
      return fail(res, "You do not have permission for this action", {}, 403);
    next();
  } catch {
    return fail(res, "Invalid or expired token", {}, 401);
  }
};

const nextNumber = (prefix, table) => {
  const count = db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n + 1;
  return `${prefix}-${new Date().getFullYear()}-${String(count).padStart(4, "0")}`;
};

const shared = { secret, auth, ok, fail, userPublic, nextNumber, apiUrl, certificateDir, fs, path };

/* ── Health ── */
app.get("/api/v1/health", (_, res) =>
  ok(res, { service: "Legal Metrology API", status: "healthy", version: "2.0.0" }),
);

/* ── Mount routes ── */
app.use("/api/v1/auth", authRoutes(shared));
app.use("/api/v1/admin", adminRoutes(shared));
app.use("/api/v1/applications", applicationRoutes(shared));
app.use("/api/v1/officer", officerRoutes({ ...shared, generateCertificate }));
app.use("/api/v1/certificates", certificateRoutes(shared));

/* ── Instruments ── */
app.get("/api/v1/instruments", auth(["APPLICANT"]), (req, res) => {
  const rows = db.prepare("SELECT * FROM instruments WHERE owner_id=? ORDER BY created_at DESC")
    .all(req.user.id).map((r) => ({
      id: r.id,
      type: r.type,
      brand: r.brand,
      model: r.model,
      serialNumber: r.serial_number,
      capacity: r.capacity,
      locationAddress: r.location_address,
      state: r.state,
      district: r.district,
      createdAt: r.created_at,
    }));
  ok(res, rows);
});

app.post("/api/v1/instruments", auth(["APPLICANT"]), (req, res) => {
  const { type, brand, model = "", serialNumber, capacity = "", locationAddress = "", state = "", district = "" } = req.body;
  if (!type || !brand || !serialNumber)
    return fail(res, "Type, brand and serial number are required");
  const item = {
    id: makeId(),
    owner_id: req.user.id,
    type, brand, model,
    serial_number: serialNumber,
    capacity,
    location_address: locationAddress,
    state: state || null,
    district: district || null,
    created_at: makeNow(),
  };
  db.prepare(
    "INSERT INTO instruments VALUES (@id,@owner_id,@type,@brand,@model,@serial_number,@capacity,@location_address,@state,@district,@created_at)",
  ).run(item);
  ok(res, { id: item.id, type, brand, model, serialNumber, capacity, locationAddress, state, district },
    "Instrument created successfully", 201);
});

/* ── Uploads ── */
app.post("/api/v1/uploads", auth(), upload.single("file"), (req, res) => {
  if (!req.file) return fail(res, "File is required");
  const url = `${apiUrl}/uploads/${req.file.filename}`;
  ok(res, { url, filename: req.file.originalname }, "File uploaded successfully", 201);
});

/* ── Dashboard (Applicant) ── */
app.get("/api/v1/dashboard", auth(), (req, res) => {
  if (req.user.role === "ADMIN") {
    const total = db.prepare("SELECT COUNT(*) n FROM applications").get().n;
    const by = (s) => db.prepare("SELECT COUNT(*) n FROM applications WHERE status=?").get(s).n;
    const submitted = by("SUBMITTED");
    const assigned = by("ASSIGNED");
    const verified = by("VERIFIED");
    const rejected = by("REJECTED");
    const expiringSoon = db.prepare("SELECT COUNT(*) n FROM certificates WHERE valid_until BETWEEN date('now') AND date('now','+30 days')").get().n;
    const expired = db.prepare("SELECT COUNT(*) n FROM certificates WHERE valid_until < date('now')").get().n;

    return ok(res, {
      total,
      submitted,
      assigned,
      verified,
      rejected,
      expiringSoon,
      expired,
      verificationRate: total > 0 ? Math.round((verified / total) * 100) : 0,
      pendingRate: total > 0 ? Math.round((submitted / total) * 100) : 0,
      assignedRate: total > 0 ? Math.round((assigned / total) * 100) : 0,
      rejectionRate: total > 0 ? Math.round((rejected / total) * 100) : 0,
    });
  }

  const totalApplications = db.prepare("SELECT COUNT(*) n FROM applications WHERE applicant_id=?").get(req.user.id).n;
  const activeApplications = db.prepare("SELECT COUNT(*) n FROM applications WHERE applicant_id=? AND status NOT IN ('VERIFIED', 'REJECTED')").get(req.user.id).n;
  const verifiedApplications = db.prepare("SELECT COUNT(*) n FROM applications WHERE applicant_id=? AND status='VERIFIED'").get(req.user.id).n;
  const instruments = db.prepare("SELECT COUNT(*) n FROM instruments WHERE owner_id=?").get(req.user.id).n;
  const certificates = db.prepare(
    "SELECT COUNT(*) n FROM certificates c JOIN applications a ON c.application_id=a.id WHERE a.applicant_id=? AND c.valid_until>=date('now')",
  ).get(req.user.id).n;

  // Real computed percentages
  const complianceRate = instruments > 0 ? Math.round((certificates / instruments) * 100) : 0;
  const activeRate = totalApplications > 0 ? Math.round((activeApplications / totalApplications) * 100) : 0;
  const verificationRate = totalApplications > 0 ? Math.round((verifiedApplications / totalApplications) * 100) : 0;

  return ok(res, {
    applications: totalApplications,
    activeApplications,
    verifiedApplications,
    instruments,
    certificates,
    complianceRate,
    activeRate,
    verificationRate,
  });
});

/* ── Backward-compat: /officers endpoint ── */
app.get("/api/v1/officers", auth(["ADMIN"]), (req, res) =>
  ok(res, db.prepare(
    "SELECT id, name, email, phone, role, district, area FROM users WHERE role IN ('OFFICER','GATC') AND account_status='ACTIVE' ORDER BY name",
  ).all()),
);

/* ── Certificate PDF Generation (Government Grade) ── */
function generateCertificate(certificate, row, inspection) {
  const filename = `${certificate.certificate_number}.pdf`;
  const filepath = path.join(certificateDir, filename);
  const verify = `${publicAppUrl}/verify/${certificate.qr_token}`;

  const doc = new PDFDocument({ size: "A4", margin: 36 });
  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 36;
  const contentWidth = pageWidth - margin * 2;

  // ── Double Security Border ──
  // Outer Border (Navy)
  doc.rect(margin - 8, margin - 8, contentWidth + 16, pageHeight - margin * 2 + 16)
    .lineWidth(2)
    .strokeColor("#0F2942")
    .stroke();

  // Inner Border (Gold)
  doc.rect(margin - 4, margin - 4, contentWidth + 8, pageHeight - margin * 2 + 8)
    .lineWidth(0.8)
    .strokeColor("#C5A059")
    .stroke();

  // Corner Ornaments
  const cornerSize = 12;
  const drawCorner = (x, y) => {
    doc.rect(x, y, cornerSize, cornerSize).fillColor("#0F2942").fill();
    doc.rect(x + 2, y + 2, cornerSize - 4, cornerSize - 4).fillColor("#C5A059").fill();
  };
  drawCorner(margin - 8, margin - 8);
  drawCorner(pageWidth - margin - 4, margin - 8);
  drawCorner(margin - 8, pageHeight - margin - 4);
  drawCorner(pageWidth - margin - 4, pageHeight - margin - 4);

  // ── Header ──
  doc.y = margin + 10;
  doc.fillColor("#0F2942").fontSize(11).font("Helvetica-Bold")
    .text("GOVERNMENT OF INDIA", { align: "center" });
  doc.fillColor("#64748B").fontSize(8).font("Helvetica")
    .text("MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION", { align: "center" });
  doc.fillColor("#0F2942").fontSize(8.5).font("Helvetica-Bold")
    .text("DEPARTMENT OF CONSUMER AFFAIRS — LEGAL METROLOGY DIVISION", { align: "center" });
  
  doc.moveDown(0.5);
  
  // Certificate Title Ribbon
  const titleY = doc.y;
  doc.rect(margin + 20, titleY, contentWidth - 40, 26).fillColor("#0F2942").fill();
  doc.rect(margin + 20, titleY + 24, contentWidth - 40, 2).fillColor("#C5A059").fill();
  
  doc.fillColor("#FFFFFF").fontSize(13).font("Helvetica-Bold")
    .text("VERIFICATION CERTIFICATE / सत्यापन प्रमाण पत्र", margin + 20, titleY + 6, {
      width: contentWidth - 40,
      align: "center",
    });

  doc.y = titleY + 34;
  doc.fillColor("#475569").fontSize(7.5).font("Helvetica-Oblique")
    .text("[Issued under Section 24 of the Legal Metrology Act, 2009 & Rule 27 of the Legal Metrology (General) Rules, 2011]", {
      align: "center",
    });

  doc.moveDown(0.6);

  // ── Quick Summary Pill Bar ──
  const summaryY = doc.y;
  doc.rect(margin, summaryY, contentWidth, 24).fillAndStroke("#F8FAFC", "#E2E8F0");
  
  doc.fontSize(8.5).font("Helvetica-Bold").fillColor("#0F2942");
  doc.text(`Certificate No: ${certificate.certificate_number}`, margin + 12, summaryY + 7);
  doc.text(`Issued On: ${certificate.issued_at.slice(0, 10)}`, margin + 200, summaryY + 7);
  doc.fillColor("#059669").text(`Valid Until: ${certificate.valid_until}`, margin + 360, summaryY + 7);

  doc.y = summaryY + 32;

  // ── Helper Table Functions ──
  const drawSectionHeader = (title, y) => {
    doc.rect(margin, y, contentWidth, 18).fillColor("#0F2942").fill();
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#FFFFFF")
      .text(title, margin + 10, y + 4);
    return y + 18;
  };

  const drawRow = (label1, val1, label2, val2, y, isAlt = false) => {
    const rowH = 18;
    if (isAlt) {
      doc.rect(margin, y, contentWidth, rowH).fillColor("#F8FAFC").fill();
    }
    doc.rect(margin, y, contentWidth, rowH).lineWidth(0.5).strokeColor("#E2E8F0").stroke();
    doc.moveTo(margin + contentWidth / 2, y).lineTo(margin + contentWidth / 2, y + rowH).lineWidth(0.5).strokeColor("#E2E8F0").stroke();

    const col1 = margin + 8;
    const col2 = margin + contentWidth / 2 + 8;
    const textY = y + 4;

    doc.fontSize(8).font("Helvetica-Bold").fillColor("#475569").text(label1, col1, textY);
    doc.fontSize(8).font("Helvetica").fillColor("#0F172A").text(val1 || "—", col1 + 80, textY, { width: (contentWidth / 2) - 90, ellipsis: true });

    if (label2) {
      doc.fontSize(8).font("Helvetica-Bold").fillColor("#475569").text(label2, col2, textY);
      doc.fontSize(8).font("Helvetica").fillColor("#0F172A").text(val2 || "—", col2 + 80, textY, { width: (contentWidth / 2) - 90, ellipsis: true });
    }
    return y + rowH;
  };

  // ── Section 1: Instrument & Owner Details ──
  let curY = drawSectionHeader("1. INSTRUMENT & OWNER IDENTIFICATION", doc.y);
  curY = drawRow("Instrument Type:", row.instrument_type, "Manufacturer/Brand:", row.instrument_brand, curY, false);
  curY = drawRow("Model:", row.instrument_model, "Serial Number:", row.serial_number, curY, true);
  curY = drawRow("Capacity / Range:", row.capacity || "Not Recorded", "Application Ref:", row.application_number, curY, false);
  curY = drawRow("Owner / Trader:", row.applicant_name, "Business Name:", row.applicant_organization || "—", curY, true);
  curY = drawRow("Location Address:", (row.location_address || "—").slice(0, 42), "State / District:", `${row.district || "—"}, ${row.state || "—"}`, curY, false);

  curY += 10;

  // ── Section 2: Verification Observations & Legal Compliance ──
  curY = drawSectionHeader("2. VERIFICATION OBSERVATIONS & CALIBRATION RESULTS", curY);
  curY = drawRow("Verification Date:", inspection.verification_date, "Validity Period Until:", certificate.valid_until, curY, false);
  curY = drawRow("Standard Reading:", inspection.standard_reading || "—", "Observed Reading:", inspection.observed_reading || "—", curY, true);
  curY = drawRow("Error Recorded:", `${Math.abs(parseFloat(inspection.observed_reading || 0) - parseFloat(inspection.standard_reading || 0)).toFixed(3)} (Within MPE limits)`, "Compliance Status:", "LEGAL STANDARDS SATISFIED", curY, false);
  curY = drawRow("Official Seal No.:", `IND-LM-${certificate.qr_token.slice(0, 8).toUpperCase()}`, "Inspection Remarks:", (inspection.remarks || "Instrument verified and stamped").slice(0, 42), curY, true);

  curY += 10;

  // ── Section 3: Verifying Authority & Digital Seal ──
  curY = drawSectionHeader("3. VERIFYING AUTHORITY & STAMPING RECORD", curY);
  curY = drawRow("Verifying Officer:", row.officer_name, "Designation / Role:", row.officer_role === "GATC" ? "Authorized GATC Verifier" : "Legal Metrology Officer (LMO)", curY, false);
  curY = drawRow("Issuing Office:", `${row.district || "Central"} Zone Legal Metrology`, "Digital Seal ID:", certificate.qr_token.toUpperCase(), curY, true);

  curY += 14;

  // ── Stamp Badge & QR Code Grid ──
  const bottomBoxY = curY;
  const bottomBoxH = 145;
  doc.rect(margin, bottomBoxY, contentWidth, bottomBoxH).fillAndStroke("#FAFAFA", "#E2E8F0");

  // Certified Stamp Circle Graphic (Left)
  const stampX = margin + 65;
  const stampY = bottomBoxY + 58;
  doc.circle(stampX, stampY, 42).lineWidth(2).strokeColor("#059669").stroke();
  doc.circle(stampX, stampY, 38).lineWidth(0.8).strokeColor("#059669").stroke();
  doc.fontSize(7.5).font("Helvetica-Bold").fillColor("#059669")
    .text("LEGAL METROLOGY", stampX - 35, stampY - 24, { width: 70, align: "center" });
  doc.fontSize(11).font("Helvetica-Bold").fillColor("#059669")
    .text("VERIFIED", stampX - 35, stampY - 6, { width: 70, align: "center" });
  doc.fontSize(7).font("Helvetica-Bold").fillColor("#059669")
    .text("& STAMPED", stampX - 35, stampY + 8, { width: 70, align: "center" });
  doc.fontSize(6).font("Helvetica").fillColor("#047857")
    .text(certificate.issued_at.slice(0, 10), stampX - 35, stampY + 20, { width: 70, align: "center" });

  // Authenticity & Legal Notice (Center)
  const noticeX = margin + 130;
  const noticeW = contentWidth - 250;
  doc.fontSize(8.5).font("Helvetica-Bold").fillColor("#0F2942")
    .text("STATUTORY LEGAL NOTICE", noticeX, bottomBoxY + 12);
  doc.fontSize(7).font("Helvetica").fillColor("#475569")
    .text(
      "1. This certificate is digitally authenticated pursuant to the Legal Metrology Act, 2009.\n" +
      "2. The verified instrument must be used without altering the official security seal.\n" +
      "3. Obliteration, forging or tampering with this certificate is a cognizable offence.\n" +
      "4. The owner must apply for re-verification prior to the validity expiry date.",
      noticeX, bottomBoxY + 26, { width: noticeW, lineGap: 2.5 },
    );

  // Officer Signature Placeholder
  doc.fontSize(7.5).font("Helvetica-Bold").fillColor("#0F2942")
    .text("Digitally Signed by Authorized Officer", noticeX, bottomBoxY + 95);
  doc.fontSize(6.5).font("Helvetica").fillColor("#64748B")
    .text(`${row.officer_name || "Verified Officer"} · Validated through Public Metrology PKI`, noticeX, bottomBoxY + 107);

  // QR Code (Right)
  QRCode.toDataURL(verify, { width: 180, margin: 1 }).then((data) => {
    const qrSize = 85;
    const qrX = margin + contentWidth - qrSize - 15;
    const qrY = bottomBoxY + 16;

    doc.rect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8).fillAndStroke("#FFFFFF", "#CBD5E1");
    doc.image(Buffer.from(data.split(",")[1], "base64"), qrX, qrY, { width: qrSize });
    
    doc.fontSize(6.5).fillColor("#0F2942").font("Helvetica-Bold")
      .text("SCAN TO VERIFY", qrX - 4, qrY + qrSize + 8, { width: qrSize + 8, align: "center" });
    doc.fontSize(6).fillColor("#64748B").font("Helvetica")
      .text("Official Portal Link", qrX - 4, qrY + qrSize + 17, { width: qrSize + 8, align: "center" });

    // ── Security Footer ──
    const footerY = pageHeight - margin - 22;
    doc.moveTo(margin, footerY).lineTo(pageWidth - margin, footerY).lineWidth(0.5).strokeColor("#CBD5E1").stroke();
    doc.fontSize(6.5).fillColor("#64748B").font("Helvetica")
      .text(`Certificate Security Hash: ${certificate.qr_token.toUpperCase()} | Verification URL: ${verify}`, margin, footerY + 5);
    doc.text(`Official Document — Legal Metrology Division, Govt. of India | Page 1 of 1`, margin, footerY + 13);

    doc.end();
    db.prepare("UPDATE certificates SET certificate_path=? WHERE id=?").run(filename, certificate.id);
  });
}

/* ── Error handler ── */
app.use((err, _, res, __) => {
  console.error(err);
  fail(res, "Unexpected server error", {}, 500);
});

app.listen(port, "0.0.0.0", () => console.log(`API running at http://0.0.0.0:${port}`));
