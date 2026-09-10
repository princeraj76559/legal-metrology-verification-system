import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const storage = path.join(root, "storage");
fs.mkdirSync(storage, { recursive: true });
export const uploadDir = path.join(storage, "uploads");
export const certificateDir = path.join(storage, "certificates");
fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(certificateDir, { recursive: true });

export const db = new Database(path.join(storage, "legal-metrology.db"));
db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

/* ─── Schema ─── */

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('APPLICANT','ADMIN','OFFICER','GATC')),
  phone TEXT,
  organization TEXT,
  state TEXT,
  district TEXT,
  area TEXT,
  account_status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(account_status IN ('ACTIVE','INACTIVE')),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS instruments (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT,
  serial_number TEXT NOT NULL,
  capacity TEXT,
  location_address TEXT,
  state TEXT,
  district TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  application_number TEXT UNIQUE NOT NULL,
  applicant_id TEXT NOT NULL REFERENCES users(id),
  instrument_id TEXT NOT NULL REFERENCES instruments(id),
  application_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'SUBMITTED',
  preferred_date TEXT,
  scheduled_date TEXT,
  remarks TEXT,
  assigned_officer_id TEXT REFERENCES users(id),
  state TEXT,
  district TEXT,
  submitted_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inspections (
  id TEXT PRIMARY KEY,
  application_id TEXT UNIQUE NOT NULL REFERENCES applications(id),
  officer_id TEXT NOT NULL REFERENCES users(id),
  observed_reading TEXT,
  standard_reading TEXT,
  result TEXT NOT NULL CHECK(result IN ('PASS','FAIL')),
  remarks TEXT,
  photo_urls TEXT NOT NULL DEFAULT '[]',
  verification_date TEXT NOT NULL,
  valid_until TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  certificate_number TEXT UNIQUE NOT NULL,
  application_id TEXT UNIQUE NOT NULL REFERENCES applications(id),
  qr_token TEXT UNIQUE NOT NULL,
  issued_at TEXT NOT NULL,
  valid_until TEXT NOT NULL,
  certificate_path TEXT
);

CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY,
  application_id TEXT REFERENCES applications(id),
  uploaded_by TEXT NOT NULL REFERENCES users(id),
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  user_id TEXT,
  user_role TEXT,
  details TEXT,
  created_at TEXT NOT NULL
);
`);

/* ─── Helpers ─── */

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();

/* ─── Seed ─── */

export function seed() {
  if (db.prepare("SELECT COUNT(*) AS count FROM users").get().count) return;
  const password = bcrypt.hashSync("Pass@123", 10);

  const addUser = db.prepare(
    "INSERT INTO users VALUES (@id,@name,@email,@password_hash,@role,@phone,@organization,@state,@district,@area,@account_status,@created_at)",
  );

  const users = [
    {
      id: "admin-001",
      name: "System Administrator",
      email: "admin@metrology.gov",
      password_hash: password,
      role: "ADMIN",
      phone: "9000000001",
      organization: "Department of Legal Metrology",
      state: "Delhi",
      district: "Central Delhi",
      area: "Headquarters",
      account_status: "ACTIVE",
      created_at: now(),
    },
    {
      id: "officer-001",
      name: "Amit Kumar",
      email: "officer@metrology.gov",
      password_hash: password,
      role: "OFFICER",
      phone: "9000000002",
      organization: "Legal Metrology Department, Delhi",
      state: "Delhi",
      district: "Central Delhi",
      area: "Zone A",
      account_status: "ACTIVE",
      created_at: now(),
    },
    {
      id: "officer-002",
      name: "Priya Singh",
      email: "officer2@metrology.gov",
      password_hash: password,
      role: "OFFICER",
      phone: "9000000005",
      organization: "Legal Metrology Department, Delhi",
      state: "Delhi",
      district: "South Delhi",
      area: "Zone B",
      account_status: "ACTIVE",
      created_at: now(),
    },
    {
      id: "gatc-001",
      name: "National Test Centre",
      email: "gatc@metrology.gov",
      password_hash: password,
      role: "GATC",
      phone: "9000000004",
      organization: "Government Approved Test Centre #1",
      state: "Delhi",
      district: "Central Delhi",
      area: "Zone A",
      account_status: "ACTIVE",
      created_at: now(),
    },
    {
      id: "applicant-001",
      name: "Rahul Sharma",
      email: "applicant@example.com",
      password_hash: password,
      role: "APPLICANT",
      phone: "9000000003",
      organization: "Sharma Traders",
      state: "Delhi",
      district: "Central Delhi",
      area: null,
      account_status: "ACTIVE",
      created_at: now(),
    },
  ];

  users.forEach((u) => addUser.run(u));

  db.prepare(
    "INSERT INTO instruments VALUES (@id,@owner_id,@type,@brand,@model,@serial_number,@capacity,@location_address,@state,@district,@created_at)",
  ).run({
    id: "instrument-001",
    owner_id: "applicant-001",
    type: "Electronic Weighing Scale",
    brand: "Essae",
    model: "XYZ-10",
    serial_number: "ES-10001",
    capacity: "10 kg",
    location_address: "Shop 12, Main Market, Delhi",
    state: "Delhi",
    district: "Central Delhi",
    created_at: now(),
  });

  db.prepare(
    "INSERT INTO applications VALUES (@id,@application_number,@applicant_id,@instrument_id,@application_type,@status,@preferred_date,@scheduled_date,@remarks,@assigned_officer_id,@state,@district,@submitted_at)",
  ).run({
    id: "application-001",
    application_number: "VER-2026-0001",
    applicant_id: "applicant-001",
    instrument_id: "instrument-001",
    application_type: "NEW_VERIFICATION",
    status: "SUBMITTED",
    preferred_date: "2026-09-12",
    scheduled_date: null,
    remarks: "Demo application",
    assigned_officer_id: null,
    state: "Delhi",
    district: "Central Delhi",
    submitted_at: now(),
  });

  // Seed audit log entry
  db.prepare(
    "INSERT INTO audit_log VALUES (@id,@action,@entity_type,@entity_id,@user_id,@user_role,@details,@created_at)",
  ).run({
    id: id(),
    action: "SYSTEM_SEEDED",
    entity_type: "SYSTEM",
    entity_id: null,
    user_id: null,
    user_role: null,
    details: "Database seeded with demo data",
    created_at: now(),
  });
}

export const makeId = id;
export const makeNow = now;
