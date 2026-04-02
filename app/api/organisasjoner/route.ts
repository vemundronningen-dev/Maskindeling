import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizations, departments } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
  }

  const orgs = await db.select().from(organizations);
  const depts = await db.select().from(departments);

  const result = orgs.map((org) => ({
    ...org,
    departments: depts.filter((d) => d.organizationId === org.id),
  }));

  return NextResponse.json(result);
}
