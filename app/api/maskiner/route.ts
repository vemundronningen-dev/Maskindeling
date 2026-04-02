import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { machines, organizations, departments } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, ilike, and, or } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const type = searchParams.get("type") || "";
  const departmentId = searchParams.get("department") || "";

  const conditions = [];

  if (search) {
    conditions.push(
      or(
        ilike(machines.name, `%${search}%`),
        ilike(machines.type, `%${search}%`),
        ilike(machines.brand, `%${search}%`),
        ilike(machines.model, `%${search}%`)
      )
    );
  }

  if (status) {
    conditions.push(eq(machines.status, status as "tilgjengelig" | "opptatt" | "på_service" | "ute_av_drift"));
  }

  if (type) {
    conditions.push(ilike(machines.type, `%${type}%`));
  }

  if (departmentId) {
    conditions.push(eq(machines.departmentId, parseInt(departmentId)));
  }

  const query = conditions.length > 0 ? and(...conditions) : undefined;

  const result = await db
    .select({
      id: machines.id,
      name: machines.name,
      type: machines.type,
      brand: machines.brand,
      model: machines.model,
      location: machines.location,
      status: machines.status,
      availableFrom: machines.availableFrom,
      availableTo: machines.availableTo,
      contactName: machines.contactName,
      contactEmail: machines.contactEmail,
      contactPhone: machines.contactPhone,
      notes: machines.notes,
      createdAt: machines.createdAt,
      organization: { id: organizations.id, name: organizations.name },
      department: { id: departments.id, name: departments.name },
    })
    .from(machines)
    .leftJoin(organizations, eq(machines.organizationId, organizations.id))
    .leftJoin(departments, eq(machines.departmentId, departments.id))
    .where(query)
    .orderBy(machines.createdAt);

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      name,
      type,
      brand,
      model,
      organizationId,
      departmentId,
      location,
      status,
      availableFrom,
      availableTo,
      contactName,
      contactEmail,
      contactPhone,
      notes,
    } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: "Navn og type er påkrevd" },
        { status: 400 }
      );
    }

    const [machine] = await db
      .insert(machines)
      .values({
        name,
        type,
        brand,
        model,
        organizationId: organizationId ? parseInt(organizationId) : null,
        departmentId: departmentId ? parseInt(departmentId) : null,
        location,
        status: status || "tilgjengelig",
        availableFrom,
        availableTo,
        contactName,
        contactEmail,
        contactPhone,
        notes,
      })
      .returning();

    return NextResponse.json(machine, { status: 201 });
  } catch (error) {
    console.error("Create machine error:", error);
    return NextResponse.json(
      { error: "Kunne ikke opprette maskin" },
      { status: 500 }
    );
  }
}
