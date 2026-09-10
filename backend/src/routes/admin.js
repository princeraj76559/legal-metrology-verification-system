import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, makeId, makeNow } from "../db.js";
import { logAudit } from "../middleware/audit.js";

export default function adminRoutes({ auth, ok, fail, userPublic }) {
  const router = Router();

  /* ── Create OFFICER / GATC / ADMIN accounts ── */
  router.post("/users", auth(["ADMIN"]), (req, res) => {
    const { name, email, password, phone, role, organization, state, district, area } = req.body;

    if (!name || !email || !password || !role)
      return fail(res, "Name, email, password and role are required");
    if (!["OFFICER", "GATC", "ADMIN"].includes(role))
      return fail(res, "Invalid role. Admin can create OFFICER, GATC, or ADMIN accounts.");
    if (password.length < 6)
      return fail(res, "Password must be at least 6 characters");
    if (db.prepare("SELECT id FROM users WHERE email=?").get(email.toLowerCase()))
      return fail(res, "Email is already registered", { email: "Already registered" });

    const user = {
      id: makeId(),
      name,
      email: email.toLowerCase(),
      password_hash: bcrypt.hashSync(password, 10),
      role,
      phone: phone || null,
      organization: organization || null,
      state: state || null,
      district: district || null,
      area: area || null,
      account_status: "ACTIVE",
      created_at: makeNow(),
    };
    db.prepare(
      "INSERT INTO users VALUES (@id,@name,@email,@password_hash,@role,@phone,@organization,@state,@district,@area,@account_status,@created_at)",
    ).run(user);

    logAudit("USER_CREATED_BY_ADMIN", "USER", user.id, req.user, `Admin created ${role} account: ${name}`);

    ok(res, userPublic(user), "User created successfully", 201);
  });

  /* ── List users (with optional role filter) ── */
  router.get("/users", auth(["ADMIN"]), (req, res) => {
    const { role, status, district, search } = req.query;
    let sql = "SELECT id, name, email, role, phone, organization, state, district, area, account_status, created_at FROM users WHERE 1=1";
    const params = [];

    if (role) { sql += " AND role=?"; params.push(role); }
    if (status) { sql += " AND account_status=?"; params.push(status); }
    if (district) { sql += " AND district=?"; params.push(district); }
    if (search) {
      sql += " AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)";
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    sql += " ORDER BY created_at DESC";

    const rows = db.prepare(sql).all(...params).map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone,
      organization: u.organization,
      state: u.state,
      district: u.district,
      area: u.area,
      accountStatus: u.account_status,
      createdAt: u.created_at,
    }));
    ok(res, rows);
  });

  /* ── Activate / Deactivate user ── */
  router.patch("/users/:id/status", auth(["ADMIN"]), (req, res) => {
    const { status } = req.body;
    if (!["ACTIVE", "INACTIVE"].includes(status))
      return fail(res, "Status must be ACTIVE or INACTIVE");
    const user = db.prepare("SELECT * FROM users WHERE id=?").get(req.params.id);
    if (!user) return fail(res, "User not found", {}, 404);
    if (user.id === req.user.id) return fail(res, "Cannot change your own account status");

    db.prepare("UPDATE users SET account_status=? WHERE id=?").run(status, user.id);
    logAudit("USER_STATUS_CHANGED", "USER", user.id, req.user, `Status changed to ${status}`);
    ok(res, { id: user.id, accountStatus: status }, "User status updated");
  });

  /* ── Enhanced Admin Dashboard Stats ── */
  router.get("/dashboard", auth(["ADMIN"]), (req, res) => {
    const total = db.prepare("SELECT COUNT(*) n FROM applications").get().n;
    const by = (s) => db.prepare("SELECT COUNT(*) n FROM applications WHERE status=?").get(s).n;

    // Area-wise breakdown
    const areaStats = db.prepare(
      `SELECT COALESCE(district,'Unassigned') as district, status, COUNT(*) as count
       FROM applications GROUP BY district, status ORDER BY district`,
    ).all();

    // Officer/GATC workload
    const workload = db.prepare(
      `SELECT u.id, u.name, u.role, u.district, u.area,
              COUNT(CASE WHEN a.status NOT IN ('VERIFIED','REJECTED') THEN 1 END) as active_jobs,
              COUNT(CASE WHEN a.status IN ('VERIFIED','REJECTED') THEN 1 END) as completed_jobs,
              COUNT(a.id) as total_jobs
       FROM users u
       LEFT JOIN applications a ON a.assigned_officer_id = u.id
       WHERE u.role IN ('OFFICER','GATC') AND u.account_status = 'ACTIVE'
       GROUP BY u.id ORDER BY u.name`,
    ).all();

    // Expiring certificates
    const expiringSoon = db.prepare(
      "SELECT COUNT(*) n FROM certificates WHERE valid_until BETWEEN date('now') AND date('now','+30 days')",
    ).get().n;
    const expired = db.prepare(
      "SELECT COUNT(*) n FROM certificates WHERE valid_until < date('now')",
    ).get().n;

    const submitted = by("SUBMITTED");
    const assigned = by("ASSIGNED");
    const verified = by("VERIFIED");
    const rejected = by("REJECTED");

    ok(res, {
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
      areaStats,
      workload,
    });
  });

  /* ── Workload & smart assignment recommendation ── */
  router.get("/workload", auth(["ADMIN"]), (req, res) => {
    const { district, state } = req.query;
    let sql = `SELECT u.id, u.name, u.role, u.email, u.phone, u.district, u.area, u.state,
                      COUNT(CASE WHEN a.status NOT IN ('VERIFIED','REJECTED') THEN 1 END) as active_jobs,
                      COUNT(CASE WHEN a.id IS NOT NULL AND a.scheduled_date = date('now') THEN 1 END) as today_jobs,
                      COUNT(a.id) as total_jobs
               FROM users u
               LEFT JOIN applications a ON a.assigned_officer_id = u.id
               WHERE u.role IN ('OFFICER','GATC') AND u.account_status = 'ACTIVE'`;
    const params = [];
    if (district) { sql += " AND u.district = ?"; params.push(district); }
    if (state) { sql += " AND u.state = ?"; params.push(state); }
    sql += " GROUP BY u.id ORDER BY active_jobs ASC, u.name";

    ok(res, db.prepare(sql).all(...params));
  });

  /* ── Get assignment recommendation for an application ── */
  router.get("/recommend-assignment/:applicationId", auth(["ADMIN"]), (req, res) => {
    const app = db.prepare("SELECT * FROM applications WHERE id=?").get(req.params.applicationId);
    if (!app) return fail(res, "Application not found", {}, 404);

    // Find eligible verifiers matching the application's district/state
    const candidates = db.prepare(
      `SELECT u.id, u.name, u.role, u.district, u.area,
              COUNT(CASE WHEN a.status NOT IN ('VERIFIED','REJECTED') THEN 1 END) as active_jobs
       FROM users u
       LEFT JOIN applications a ON a.assigned_officer_id = u.id
       WHERE u.role IN ('OFFICER','GATC') AND u.account_status = 'ACTIVE'
         AND (u.district = ? OR u.state = ? OR ? IS NULL)
       GROUP BY u.id
       ORDER BY
         CASE WHEN u.district = ? THEN 0 ELSE 1 END,
         active_jobs ASC,
         u.name`,
    ).all(app.district, app.state, app.district, app.district);

    ok(res, {
      applicationDistrict: app.district,
      applicationState: app.state,
      recommended: candidates[0] || null,
      candidates,
    });
  });

  /* ── List verifiers (officers + GATC) ── */
  router.get("/verifiers", auth(["ADMIN"]), (req, res) => {
    ok(res, db.prepare(
      "SELECT id, name, email, phone, role, district, area, state, organization FROM users WHERE role IN ('OFFICER','GATC') AND account_status='ACTIVE' ORDER BY name",
    ).all());
  });

  /* ── View audit log ── */
  router.get("/audit-log", auth(["ADMIN"]), (req, res) => {
    const { entity_type, entity_id, limit = 100 } = req.query;
    let sql = `SELECT al.*, u.name as user_name
               FROM audit_log al LEFT JOIN users u ON al.user_id = u.id WHERE 1=1`;
    const params = [];
    if (entity_type) { sql += " AND al.entity_type=?"; params.push(entity_type); }
    if (entity_id) { sql += " AND al.entity_id=?"; params.push(entity_id); }
    sql += " ORDER BY al.created_at DESC LIMIT ?";
    params.push(Number(limit));

    ok(res, db.prepare(sql).all(...params));
  });

  /* ── Get available districts ── */
  router.get("/districts", auth(["ADMIN"]), (req, res) => {
    const districts = db.prepare(
      "SELECT DISTINCT district FROM users WHERE district IS NOT NULL UNION SELECT DISTINCT district FROM applications WHERE district IS NOT NULL ORDER BY district",
    ).all().map((r) => r.district);
    ok(res, districts);
  });

  return router;
}
