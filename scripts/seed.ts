import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../lib/db/schema";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL er ikke satt i .env.local");
  process.exit(1);
}

const client = postgres(connectionString, { ssl: "require", max: 1 });
const db = drizzle(client, { schema });

async function main() {
  console.log("🌱 Starter seed...");

  // Organizations
  console.log("Oppretter organisasjoner...");
  const [oslo] = await db
    .insert(schema.organizations)
    .values({ name: "Oslo kommune" })
    .returning();

  // Departments
  console.log("Oppretter avdelinger...");
  const [kirkelig] = await db
    .insert(schema.departments)
    .values({ organizationId: oslo.id, name: "Kirkelig fellesråd" })
    .returning();

  const [vav] = await db
    .insert(schema.departments)
    .values({ organizationId: oslo.id, name: "Vann- og avløpsetaten" })
    .returning();

  const [bymiljo] = await db
    .insert(schema.departments)
    .values({ organizationId: oslo.id, name: "Bymiljøetaten" })
    .returning();

  // Users
  console.log("Oppretter brukere...");
  const adminHash = await bcrypt.hash("admin123", 12);
  const brukerHash = await bcrypt.hash("bruker123", 12);

  await db.insert(schema.users).values({
    name: "Admin Bruker",
    email: "admin@oslo.kommune.no",
    passwordHash: adminHash,
    role: "admin",
    organizationId: oslo.id,
    departmentId: null,
  });

  const [vavUser] = await db
    .insert(schema.users)
    .values({
      name: "Ola Nordmann",
      email: "bruker@vav.oslo.kommune.no",
      passwordHash: brukerHash,
      role: "bruker",
      organizationId: oslo.id,
      departmentId: vav.id,
    })
    .returning();

  await db.insert(schema.users).values({
    name: "Kari Hansen",
    email: "bruker@kf.oslo.kommune.no",
    passwordHash: brukerHash,
    role: "bruker",
    organizationId: oslo.id,
    departmentId: kirkelig.id,
  });

  await db.insert(schema.users).values({
    name: "Per Jensen",
    email: "bruker@bymiljo.oslo.kommune.no",
    passwordHash: brukerHash,
    role: "bruker",
    organizationId: oslo.id,
    departmentId: bymiljo.id,
  });

  // Machines
  console.log("Oppretter maskiner...");
  const [minigraverKubota] = await db
    .insert(schema.machines)
    .values({
      name: "Minigraver Kubota U27",
      type: "minigraver",
      brand: "Kubota",
      model: "U27",
      organizationId: oslo.id,
      departmentId: kirkelig.id,
      location: "Aker kirkegård, Maridalsveien 220",
      status: "tilgjengelig",
      availableFrom: "01.04.2025",
      availableTo: "30.06.2025",
      contactName: "Kari Hansen",
      contactEmail: "kari.hansen@kirkelig.oslo.kommune.no",
      contactPhone: "92 34 56 78",
      notes: "Nylig service utført. Henger og driver medfølger.",
    })
    .returning();

  await db.insert(schema.machines).values({
    name: "Minigraver Yanmar SV26",
    type: "minigraver",
    brand: "Yanmar",
    model: "SV26",
    organizationId: oslo.id,
    departmentId: vav.id,
    location: "Sagene driftsbase, Sandakerveien 64",
    status: "opptatt",
    availableFrom: "01.07.2025",
    contactName: "Ola Nordmann",
    contactEmail: "ola.nordmann@vav.oslo.kommune.no",
    contactPhone: "45 67 89 01",
    notes: "I bruk på Majorstua-prosjektet til og med juni.",
  });

  await db.insert(schema.machines).values({
    name: "Vibroplate Wacker Neuson",
    type: "vibroplate",
    brand: "Wacker Neuson",
    model: "DPU 6555",
    organizationId: oslo.id,
    departmentId: bymiljo.id,
    location: "Ryenkrysset driftsbase",
    status: "tilgjengelig",
    contactName: "Per Jensen",
    contactEmail: "per.jensen@bymiljo.oslo.kommune.no",
    contactPhone: "98 76 54 32",
  });

  await db.insert(schema.machines).values({
    name: "Generator Honda EU70is",
    type: "generator",
    brand: "Honda",
    model: "EU70is",
    organizationId: oslo.id,
    departmentId: kirkelig.id,
    location: "Gamlebyen kirkegård",
    status: "tilgjengelig",
    contactName: "Kari Hansen",
    contactEmail: "kari.hansen@kirkelig.oslo.kommune.no",
    contactPhone: "92 34 56 78",
    notes: "7 kVA. Kan brukes ved strømutfall og midlertidige installasjoner.",
  });

  await db.insert(schema.machines).values({
    name: "Hjullaster Volvo L30",
    type: "hjullaster",
    brand: "Volvo",
    model: "L30",
    organizationId: oslo.id,
    departmentId: bymiljo.id,
    location: "Alnabru terminal",
    status: "på_service",
    notes: "Inne til periodisk service. Estimert ferdig 15. april.",
    contactName: "Per Jensen",
    contactEmail: "per.jensen@bymiljo.oslo.kommune.no",
    contactPhone: "98 76 54 32",
  });

  // Sample request
  console.log("Oppretter eksempelforespørsel...");
  await db.insert(schema.machineRequests).values({
    machineId: minigraverKubota.id,
    requestedByUserId: vavUser.id,
    fromDepartmentId: vav.id,
    toDepartmentId: kirkelig.id,
    message:
      "Vi trenger en minigraver til gravejobb på Adamstuen i uke 20. Grøftegraving ca. 15 meter.",
    status: "sendt",
  });

  console.log("\n✅ Seed fullført!");
  console.log("\nTestkontoer:");
  console.log("  Admin:   admin@oslo.kommune.no / admin123");
  console.log("  VAV:     bruker@vav.oslo.kommune.no / bruker123");
  console.log("  KF:      bruker@kf.oslo.kommune.no / bruker123");
  console.log("  Bymiljø: bruker@bymiljo.oslo.kommune.no / bruker123");
}

main()
  .catch((err) => {
    console.error("❌ Seed feilet:", err);
    process.exit(1);
  })
  .finally(() => client.end());
