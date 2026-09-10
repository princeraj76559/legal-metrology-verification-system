import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db, makeId, makeNow } from "../db.js";
import { logAudit } from "../middleware/audit.js";

export default function authRoutes({ secret, auth, ok, fail, userPublic }) {
  const router = Router();

  /* ── Register (APPLICANT only) ── */
  router.post("/register", (req, res) => {
    const { name, email, password, phone } = req.body;
    // Force role to APPLICANT — no self-registration as OFFICER/GATC/ADMIN
    const role = "APPLICANT";

    if (!name || !email || !password)
      return fail(res, "Name, email and password are required", {
        name: !name ? "Required" : undefined,
        email: !email ? "Required" : undefined,
        password: !password ? "Required" : undefined,
      });
    if (password.length < 6)
      return fail(res, "Password must be at least 6 characters");
    if (
      db.prepare("SELECT id FROM users WHERE email=?").get(email.toLowerCase())
    )
      return fail(res, "Email is already registered", {
        email: "Already registered",
      });

    const user = {
      id: makeId(),
      name,
      email: email.toLowerCase(),
      password_hash: bcrypt.hashSync(password, 10),
      role,
      phone: phone || null,
      organization: null,
      state: null,
      district: null,
      area: null,
      account_status: "ACTIVE",
      created_at: makeNow(),
    };
    db.prepare(
      "INSERT INTO users VALUES (@id,@name,@email,@password_hash,@role,@phone,@organization,@state,@district,@area,@account_status,@created_at)",
    ).run(user);

    logAudit("USER_REGISTERED", "USER", user.id, user, `${name} registered as ${role}`);

    const token = jwt.sign(userPublic(user), secret, { expiresIn: "24h" });
    return ok(
      res,
      { token, user: userPublic(user) },
      "Registration successful",
      201,
    );
  });

  /* ── Login ── */
  router.post("/login", (req, res) => {
    const { email, password } = req.body;
    const user = db
      .prepare("SELECT * FROM users WHERE email=?")
      .get((email || "").toLowerCase());
    if (!user || !bcrypt.compareSync(password || "", user.password_hash))
      return fail(res, "Invalid email or password", {}, 401);
    if (user.account_status !== "ACTIVE")
      return fail(res, "Your account has been deactivated. Contact administrator.", {}, 403);

    const token = jwt.sign(userPublic(user), secret, { expiresIn: "24h" });
    return ok(res, { token, user: userPublic(user) }, "Login successful");
  });

  /* ── Get current user ── */
  router.get("/me", auth(), (req, res) => {
    const user = db.prepare("SELECT * FROM users WHERE id=?").get(req.user.id);
    if (!user) return fail(res, "User not found", {}, 404);
    ok(res, { user: userPublic(user) });
  });

  /* ── Get own profile (full details) ── */
  router.get("/profile", auth(), (req, res) => {
    const user = db.prepare("SELECT * FROM users WHERE id=?").get(req.user.id);
    if (!user) return fail(res, "User not found", {}, 404);
    ok(res, {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      organization: user.organization,
      state: user.state,
      district: user.district,
      area: user.area,
      accountStatus: user.account_status,
      createdAt: user.created_at,
    });
  });

  /* ── Update own profile (safe fields only) ── */
  router.put("/profile", auth(), (req, res) => {
    const { name, phone, organization, state, district } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE id=?").get(req.user.id);
    if (!user) return fail(res, "User not found", {}, 404);

    db.prepare(
      "UPDATE users SET name=?, phone=?, organization=?, state=?, district=? WHERE id=?",
    ).run(
      name || user.name,
      phone ?? user.phone,
      organization ?? user.organization,
      state ?? user.state,
      district ?? user.district,
      user.id,
    );

    logAudit("PROFILE_UPDATED", "USER", user.id, req.user, "Profile updated");

    const updated = db.prepare("SELECT * FROM users WHERE id=?").get(req.user.id);
    ok(res, {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      phone: updated.phone,
      organization: updated.organization,
      state: updated.state,
      district: updated.district,
      area: updated.area,
      accountStatus: updated.account_status,
      createdAt: updated.created_at,
    }, "Profile updated successfully");
  });

  return router;
}
