/**
 * POST /api/setup?token=SETUP_SECRET
 *
 * Oppretter tabeller og seeder testdata direkte i Neon-databasen.
 * Kjøres én gang etter første deploy.
 *
 * Sett SETUP_SECRET som miljøvariabel i Vercel for å beskytte endepunktet.
 */
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  const SETUP_SECRET = process.env.SETUP_SECRET;
  if (SETUP_SECRET && token !== SETUP_SECRET) {
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
  }

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    return NextResponse.json(
      { error: "DATABASE_URL er ikke satt" },
      { status: 500 }
    );
  }

  const sql = neon(DATABASE_URL);

  try {
    // 1. Create enums (idempotent)
    await sql`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'machine_status') THEN
        CREATE TYPE "public"."machine_status" AS ENUM('tilgjengelig','opptatt','på_service','ute_av_drift');
      END IF;
    END $$`;

    await sql`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status') THEN
        CREATE TYPE "public"."request_status" AS ENUM('sendt','godkjent','avslått');
      END IF;
    END $$`;

    await sql`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE "public"."user_role" AS ENUM('admin','bruker');
      END IF;
    END $$`;

    // 2. Create tables (idempotent)
    await sql`CREATE TABLE IF NOT EXISTS "organizations" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" text NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL
    )`;

    await sql`CREATE TABLE IF NOT EXISTS "departments" (
      "id" serial PRIMARY KEY NOT NULL,
      "organization_id" integer NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
      "name" text NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL
    )`;

    await sql`CREATE TABLE IF NOT EXISTS "users" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" text NOT NULL,
      "email" text NOT NULL,
      "password_hash" text NOT NULL,
      "role" "user_role" DEFAULT 'bruker' NOT NULL,
      "organization_id" integer REFERENCES "organizations"("id"),
      "department_id" integer REFERENCES "departments"("id"),
      "created_at" timestamp DEFAULT now() NOT NULL,
      CONSTRAINT "users_email_unique" UNIQUE("email")
    )`;

    await sql`CREATE TABLE IF NOT EXISTS "machines" (
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
    )`;

    await sql`CREATE TABLE IF NOT EXISTS "machine_requests" (
      "id" serial PRIMARY KEY NOT NULL,
      "machine_id" integer NOT NULL REFERENCES "machines"("id") ON DELETE cascade,
      "requested_by_user_id" integer NOT NULL REFERENCES "users"("id"),
      "from_department_id" integer REFERENCES "departments"("id"),
      "to_department_id" integer REFERENCES "departments"("id"),
      "message" text,
      "status" "request_status" DEFAULT 'sendt' NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL
    )`;

    // 3. Seed (only if empty)
    const existing = await sql`SELECT count(*) as c FROM organizations`;
    const count = parseInt(String(existing[0]?.c ?? "0"));

    if (count > 0) {
      return NextResponse.json({
        success: true,
        message: "Migrasjoner kjørt. Databasen inneholder allerede data – seed hoppet over.",
        alreadySeeded: true,
      });
    }

    // Organizations
    const [org] = await sql`INSERT INTO organizations (name) VALUES ('Oslo kommune') RETURNING id`;
    const orgId = org.id;

    // Departments
    const [kf] = await sql`INSERT INTO departments (organization_id, name) VALUES (${orgId}, 'Kirkelig fellesråd') RETURNING id`;
    const [vav] = await sql`INSERT INTO departments (organization_id, name) VALUES (${orgId}, 'Vann- og avløpsetaten') RETURNING id`;
    const [bm] = await sql`INSERT INTO departments (organization_id, name) VALUES (${orgId}, 'Bymiljøetaten') RETURNING id`;

    // Users
    const adminHash = await bcrypt.hash("admin123", 12);
    const brukerHash = await bcrypt.hash("bruker123", 12);

    await sql`INSERT INTO users (name, email, password_hash, role, organization_id) VALUES ('Admin Bruker', 'admin@oslo.kommune.no', ${adminHash}, 'admin', ${orgId})`;

    const [vavUser] = await sql`INSERT INTO users (name, email, password_hash, role, organization_id, department_id)
      VALUES ('Ola Nordmann', 'bruker@vav.oslo.kommune.no', ${brukerHash}, 'bruker', ${orgId}, ${vav.id}) RETURNING id`;

    await sql`INSERT INTO users (name, email, password_hash, role, organization_id, department_id)
      VALUES ('Kari Hansen', 'bruker@kf.oslo.kommune.no', ${brukerHash}, 'bruker', ${orgId}, ${kf.id})`;

    await sql`INSERT INTO users (name, email, password_hash, role, organization_id, department_id)
      VALUES ('Per Jensen', 'bruker@bymiljo.oslo.kommune.no', ${brukerHash}, 'bruker', ${orgId}, ${bm.id})`;

    // Machines
    const [m1] = await sql`INSERT INTO machines (name, type, brand, model, organization_id, department_id, location, status, available_from, available_to, contact_name, contact_email, contact_phone, notes)
      VALUES ('Minigraver Kubota U27','minigraver','Kubota','U27',${orgId},${kf.id},'Aker kirkegård, Maridalsveien 220','tilgjengelig','01.04.2025','30.06.2025','Kari Hansen','kari.hansen@kirkelig.oslo.kommune.no','92 34 56 78','Nylig service utført. Henger og driver medfølger.') RETURNING id`;

    await sql`INSERT INTO machines (name, type, brand, model, organization_id, department_id, location, status, available_from, contact_name, contact_email, contact_phone, notes)
      VALUES ('Minigraver Yanmar SV26','minigraver','Yanmar','SV26',${orgId},${vav.id},'Sagene driftsbase, Sandakerveien 64','opptatt','01.07.2025','Ola Nordmann','ola.nordmann@vav.oslo.kommune.no','45 67 89 01','I bruk på Majorstua-prosjektet til og med juni.')`;

    await sql`INSERT INTO machines (name, type, brand, model, organization_id, department_id, location, status, contact_name, contact_email, contact_phone)
      VALUES ('Vibroplate Wacker Neuson','vibroplate','Wacker Neuson','DPU 6555',${orgId},${bm.id},'Ryenkrysset driftsbase','tilgjengelig','Per Jensen','per.jensen@bymiljo.oslo.kommune.no','98 76 54 32')`;

    await sql`INSERT INTO machines (name, type, brand, model, organization_id, department_id, location, status, contact_name, contact_email, contact_phone, notes)
      VALUES ('Generator Honda EU70is','generator','Honda','EU70is',${orgId},${kf.id},'Gamlebyen kirkegård','tilgjengelig','Kari Hansen','kari.hansen@kirkelig.oslo.kommune.no','92 34 56 78','7 kVA. Kan brukes ved strømutfall og midlertidige installasjoner.')`;

    await sql`INSERT INTO machines (name, type, brand, model, organization_id, department_id, location, status, contact_name, contact_email, contact_phone, notes)
      VALUES ('Hjullaster Volvo L30','hjullaster','Volvo','L30',${orgId},${bm.id},'Alnabru terminal','på_service','Per Jensen','per.jensen@bymiljo.oslo.kommune.no','98 76 54 32','Inne til periodisk service. Estimert ferdig 15. april.')`;

    // Sample request
    await sql`INSERT INTO machine_requests (machine_id, requested_by_user_id, from_department_id, to_department_id, message, status)
      VALUES (${m1.id},${vavUser.id},${vav.id},${kf.id},'Vi trenger en minigraver til gravejobb på Adamstuen i uke 20. Grøftegraving ca. 15 meter.','sendt')`;

    return NextResponse.json({
      success: true,
      message: "Database satt opp og seedet med testdata!",
      data: {
        organizations: 1,
        departments: 3,
        users: 4,
        machines: 5,
        requests: 1,
      },
      accounts: [
        { email: "admin@oslo.kommune.no", password: "admin123", role: "admin" },
        { email: "bruker@vav.oslo.kommune.no", password: "bruker123", role: "bruker" },
        { email: "bruker@kf.oslo.kommune.no", password: "bruker123", role: "bruker" },
        { email: "bruker@bymiljo.oslo.kommune.no", password: "bruker123", role: "bruker" },
      ],
    });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: "Setup feilet", details: String(error) },
      { status: 500 }
    );
  }
}
