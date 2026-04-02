/**
 * Kjører SQL-migrasjoner og seed via Neon HTTP API.
 * Bruker fetch direkte mot Neon sin SQL-over-HTTP endpoint.
 */
import * as dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL er ikke satt");
  process.exit(1);
}

// Parse connection string
function parseConnectionUrl(url: string) {
  const u = new URL(url);
  return {
    host: u.hostname,
    user: u.username,
    password: u.password,
    database: u.pathname.slice(1).split("?")[0],
  };
}

const conn = parseConnectionUrl(DATABASE_URL);

// Neon HTTP SQL endpoint
const NEON_API = `https://${conn.host}/sql`;

async function sql(query: string, params: unknown[] = []) {
  const res = await fetch(NEON_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${conn.user}:${conn.password}`).toString("base64")}`,
      "Neon-Connection-String": DATABASE_URL!,
    },
    body: JSON.stringify({ query, params }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SQL feilet (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data;
}

async function migrate() {
  console.log("📦 Kjører migrasjoner via Neon HTTP...\n");

  const statements = [
    `DO $$ BEGIN
       IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'machine_status') THEN
         CREATE TYPE "public"."machine_status" AS ENUM('tilgjengelig','opptatt','på_service','ute_av_drift');
       END IF;
     END $$`,
    `DO $$ BEGIN
       IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status') THEN
         CREATE TYPE "public"."request_status" AS ENUM('sendt','godkjent','avslått');
       END IF;
     END $$`,
    `DO $$ BEGIN
       IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
         CREATE TYPE "public"."user_role" AS ENUM('admin','bruker');
       END IF;
     END $$`,
    `CREATE TABLE IF NOT EXISTS "organizations" (
       "id" serial PRIMARY KEY NOT NULL,
       "name" text NOT NULL,
       "created_at" timestamp DEFAULT now() NOT NULL
     )`,
    `CREATE TABLE IF NOT EXISTS "departments" (
       "id" serial PRIMARY KEY NOT NULL,
       "organization_id" integer NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
       "name" text NOT NULL,
       "created_at" timestamp DEFAULT now() NOT NULL
     )`,
    `CREATE TABLE IF NOT EXISTS "users" (
       "id" serial PRIMARY KEY NOT NULL,
       "name" text NOT NULL,
       "email" text NOT NULL,
       "password_hash" text NOT NULL,
       "role" "user_role" DEFAULT 'bruker' NOT NULL,
       "organization_id" integer REFERENCES "organizations"("id"),
       "department_id" integer REFERENCES "departments"("id"),
       "created_at" timestamp DEFAULT now() NOT NULL,
       CONSTRAINT "users_email_unique" UNIQUE("email")
     )`,
    `CREATE TABLE IF NOT EXISTS "machines" (
       "id" serial PRIMARY KEY NOT NULL,
       "name" text NOT NULL,
       "type" text NOT NULL,
       "brand" text,
       "model" text,
       "organization_id" integer REFERENCES "organizations"("id"),
       "department_id" integer REFERENCES "departments"("id"),
       "location" text,
       "status" "machine_status" DEFAULT 'tilgjengelig' NOT NULL,
       "available_from" text,
       "available_to" text,
       "contact_name" text,
       "contact_email" text,
       "contact_phone" text,
       "notes" text,
       "created_at" timestamp DEFAULT now() NOT NULL
     )`,
    `CREATE TABLE IF NOT EXISTS "machine_requests" (
       "id" serial PRIMARY KEY NOT NULL,
       "machine_id" integer NOT NULL REFERENCES "machines"("id") ON DELETE cascade,
       "requested_by_user_id" integer NOT NULL REFERENCES "users"("id"),
       "from_department_id" integer REFERENCES "departments"("id"),
       "to_department_id" integer REFERENCES "departments"("id"),
       "message" text,
       "status" "request_status" DEFAULT 'sendt' NOT NULL,
       "created_at" timestamp DEFAULT now() NOT NULL
     )`,
  ];

  for (const stmt of statements) {
    process.stdout.write("  → " + stmt.trim().split("\n")[0].slice(0, 60) + "...");
    await sql(stmt);
    console.log(" ✓");
  }
  console.log("\n✅ Migrasjoner kjørt!\n");
}

async function seed() {
  console.log("🌱 Seeder testdata...\n");

  // Check if already seeded
  const existing = await sql(`SELECT count(*) as c FROM organizations`);
  const count = parseInt(existing.rows?.[0]?.c ?? "0");
  if (count > 0) {
    console.log("⚠️  Databasen inneholder allerede data. Hopper over seed.");
    return;
  }

  // Organizations
  const orgRes = await sql(
    `INSERT INTO organizations (name) VALUES ($1) RETURNING id`,
    ["Oslo kommune"]
  );
  const orgId = orgRes.rows[0].id;
  console.log(`  ✓ Organisasjon: Oslo kommune (id=${orgId})`);

  // Departments
  const kfRes = await sql(
    `INSERT INTO departments (organization_id, name) VALUES ($1,$2) RETURNING id`,
    [orgId, "Kirkelig fellesråd"]
  );
  const kfId = kfRes.rows[0].id;

  const vavRes = await sql(
    `INSERT INTO departments (organization_id, name) VALUES ($1,$2) RETURNING id`,
    [orgId, "Vann- og avløpsetaten"]
  );
  const vavId = vavRes.rows[0].id;

  const bmRes = await sql(
    `INSERT INTO departments (organization_id, name) VALUES ($1,$2) RETURNING id`,
    [orgId, "Bymiljøetaten"]
  );
  const bmId = bmRes.rows[0].id;
  console.log(`  ✓ 3 avdelinger opprettet`);

  // Users
  const adminHash = await bcrypt.hash("admin123", 12);
  const brukerHash = await bcrypt.hash("bruker123", 12);

  await sql(
    `INSERT INTO users (name, email, password_hash, role, organization_id) VALUES ($1,$2,$3,$4,$5)`,
    ["Admin Bruker", "admin@oslo.kommune.no", adminHash, "admin", orgId]
  );
  const vavUserRes = await sql(
    `INSERT INTO users (name, email, password_hash, role, organization_id, department_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    ["Ola Nordmann", "bruker@vav.oslo.kommune.no", brukerHash, "bruker", orgId, vavId]
  );
  const vavUserId = vavUserRes.rows[0].id;

  await sql(
    `INSERT INTO users (name, email, password_hash, role, organization_id, department_id) VALUES ($1,$2,$3,$4,$5,$6)`,
    ["Kari Hansen", "bruker@kf.oslo.kommune.no", brukerHash, "bruker", orgId, kfId]
  );
  await sql(
    `INSERT INTO users (name, email, password_hash, role, organization_id, department_id) VALUES ($1,$2,$3,$4,$5,$6)`,
    ["Per Jensen", "bruker@bymiljo.oslo.kommune.no", brukerHash, "bruker", orgId, bmId]
  );
  console.log(`  ✓ 4 brukere opprettet`);

  // Machines
  const m1 = await sql(
    `INSERT INTO machines (name, type, brand, model, organization_id, department_id, location, status, available_from, available_to, contact_name, contact_email, contact_phone, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id`,
    ["Minigraver Kubota U27","minigraver","Kubota","U27",orgId,kfId,"Aker kirkegård, Maridalsveien 220","tilgjengelig","01.04.2025","30.06.2025","Kari Hansen","kari.hansen@kirkelig.oslo.kommune.no","92 34 56 78","Nylig service utført. Henger og driver medfølger."]
  );
  const m1Id = m1.rows[0].id;

  await sql(
    `INSERT INTO machines (name, type, brand, model, organization_id, department_id, location, status, available_from, contact_name, contact_email, contact_phone, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    ["Minigraver Yanmar SV26","minigraver","Yanmar","SV26",orgId,vavId,"Sagene driftsbase, Sandakerveien 64","opptatt","01.07.2025","Ola Nordmann","ola.nordmann@vav.oslo.kommune.no","45 67 89 01","I bruk på Majorstua-prosjektet til og med juni."]
  );

  await sql(
    `INSERT INTO machines (name, type, brand, model, organization_id, department_id, location, status, contact_name, contact_email, contact_phone)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    ["Vibroplate Wacker Neuson","vibroplate","Wacker Neuson","DPU 6555",orgId,bmId,"Ryenkrysset driftsbase","tilgjengelig","Per Jensen","per.jensen@bymiljo.oslo.kommune.no","98 76 54 32"]
  );

  await sql(
    `INSERT INTO machines (name, type, brand, model, organization_id, department_id, location, status, contact_name, contact_email, contact_phone, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    ["Generator Honda EU70is","generator","Honda","EU70is",orgId,kfId,"Gamlebyen kirkegård","tilgjengelig","Kari Hansen","kari.hansen@kirkelig.oslo.kommune.no","92 34 56 78","7 kVA. Kan brukes ved strømutfall og midlertidige installasjoner."]
  );

  await sql(
    `INSERT INTO machines (name, type, brand, model, organization_id, department_id, location, status, contact_name, contact_email, contact_phone, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    ["Hjullaster Volvo L30","hjullaster","Volvo","L30",orgId,bmId,"Alnabru terminal","på_service","Per Jensen","per.jensen@bymiljo.oslo.kommune.no","98 76 54 32","Inne til periodisk service. Estimert ferdig 15. april."]
  );
  console.log(`  ✓ 5 maskiner opprettet`);

  // Sample request
  await sql(
    `INSERT INTO machine_requests (machine_id, requested_by_user_id, from_department_id, to_department_id, message, status)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [m1Id, vavUserId, vavId, kfId, "Vi trenger en minigraver til gravejobb på Adamstuen i uke 20. Grøftegraving ca. 15 meter.", "sendt"]
  );
  console.log(`  ✓ 1 eksempelforespørsel opprettet\n`);

  console.log("✅ Seed fullført!\n");
  console.log("Testkontoer:");
  console.log("  Admin:   admin@oslo.kommune.no / admin123");
  console.log("  VAV:     bruker@vav.oslo.kommune.no / bruker123");
  console.log("  KF:      bruker@kf.oslo.kommune.no / bruker123");
  console.log("  Bymiljø: bruker@bymiljo.oslo.kommune.no / bruker123");
}

async function main() {
  await migrate();
  await seed();
}

main().catch((err) => {
  console.error("\n❌ Feil:", err.message);
  process.exit(1);
});
