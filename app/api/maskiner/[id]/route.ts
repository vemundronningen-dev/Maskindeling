import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { machines, organizations, departments } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
  }

  const { id } = await params;
  const machineId = parseInt(id);

  const [result] = await db
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
    .where(eq(machines.id, machineId))
    .limit(1);

  if (!result) {
    return NextResponse.json({ error: "Maskin ikke funnet" }, { status: 404 });
  }

  return NextResponse.json(result);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 403 });
  }

  const { id } = await params;
  const machineId = parseInt(id);

  try {
    const body = await request.json();

    const [updated] = await db
      .update(machines)
      .set({
        name: body.name,
        type: body.type,
        brand: body.brand,
        model: body.model,
        organizationId: body.organizationId ? parseInt(body.organizationId) : null,
        departmentId: body.departmentId ? parseInt(body.departmentId) : null,
        location: body.location,
        status: body.status,
        availableFrom: body.availableFrom,
        availableTo: body.availableTo,
        contactName: body.contactName,
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone,
        notes: body.notes,
      })
      .where(eq(machines.id, machineId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Maskin ikke funnet" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update machine error:", error);
    return NextResponse.json(
      { error: "Kunne ikke oppdatere maskin" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 403 });
  }

  const { id } = await params;
  const machineId = parseInt(id);

  await db.delete(machines).where(eq(machines.id, machineId));

  return NextResponse.json({ success: true });
}
