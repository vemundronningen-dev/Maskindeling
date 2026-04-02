import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { machineRequests, machines, users, departments } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mine = searchParams.get("mine") === "true";

  const fromDept = {
    id: departments.id,
    name: departments.name,
  };

  let query = db
    .select({
      id: machineRequests.id,
      message: machineRequests.message,
      status: machineRequests.status,
      createdAt: machineRequests.createdAt,
      machine: { id: machines.id, name: machines.name, type: machines.type },
      requestedBy: { id: users.id, name: users.name, email: users.email },
      fromDepartmentId: machineRequests.fromDepartmentId,
      toDepartmentId: machineRequests.toDepartmentId,
    })
    .from(machineRequests)
    .leftJoin(machines, eq(machineRequests.machineId, machines.id))
    .leftJoin(users, eq(machineRequests.requestedByUserId, users.id))
    .$dynamic();

  if (mine) {
    query = query.where(eq(machineRequests.requestedByUserId, session.id));
  }

  const results = await query.orderBy(desc(machineRequests.createdAt));

  // Fetch department names separately
  const deptIds = new Set<number>();
  results.forEach((r) => {
    if (r.fromDepartmentId) deptIds.add(r.fromDepartmentId);
    if (r.toDepartmentId) deptIds.add(r.toDepartmentId);
  });

  const deptMap = new Map<number, string>();
  if (deptIds.size > 0) {
    const depts = await db.select({ id: departments.id, name: departments.name }).from(departments);
    depts.forEach((d) => deptMap.set(d.id, d.name));
  }

  const enriched = results.map((r) => ({
    ...r,
    fromDepartmentName: r.fromDepartmentId ? deptMap.get(r.fromDepartmentId) : null,
    toDepartmentName: r.toDepartmentId ? deptMap.get(r.toDepartmentId) : null,
  }));

  return NextResponse.json(enriched);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { machineId, message } = body;

    if (!machineId) {
      return NextResponse.json(
        { error: "Maskin-ID er påkrevd" },
        { status: 400 }
      );
    }

    // Get machine to find its department
    const [machine] = await db
      .select()
      .from(machines)
      .where(eq(machines.id, parseInt(machineId)))
      .limit(1);

    if (!machine) {
      return NextResponse.json({ error: "Maskin ikke funnet" }, { status: 404 });
    }

    const [request_] = await db
      .insert(machineRequests)
      .values({
        machineId: parseInt(machineId),
        requestedByUserId: session.id,
        fromDepartmentId: session.departmentId,
        toDepartmentId: machine.departmentId,
        message,
        status: "sendt",
      })
      .returning();

    return NextResponse.json(request_, { status: 201 });
  } catch (error) {
    console.error("Create request error:", error);
    return NextResponse.json(
      { error: "Kunne ikke sende forespørsel" },
      { status: 500 }
    );
  }
}
