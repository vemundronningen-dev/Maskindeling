import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { machines, machineRequests, users, departments } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, count, sql } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
  }

  const [totalMachines] = await db
    .select({ count: count() })
    .from(machines);

  const [availableMachines] = await db
    .select({ count: count() })
    .from(machines)
    .where(eq(machines.status, "tilgjengelig"));

  const [pendingRequests] = await db
    .select({ count: count() })
    .from(machineRequests)
    .where(eq(machineRequests.status, "sendt"));

  const [totalUsers] = await db
    .select({ count: count() })
    .from(users);

  // Status distribution
  const statusDist = await db
    .select({
      status: machines.status,
      count: count(),
    })
    .from(machines)
    .groupBy(machines.status);

  // Recent requests
  const recentRequests = await db
    .select({
      id: machineRequests.id,
      status: machineRequests.status,
      createdAt: machineRequests.createdAt,
      machineName: machines.name,
      requesterName: users.name,
    })
    .from(machineRequests)
    .leftJoin(machines, eq(machineRequests.machineId, machines.id))
    .leftJoin(users, eq(machineRequests.requestedByUserId, users.id))
    .orderBy(sql`${machineRequests.createdAt} desc`)
    .limit(5);

  return NextResponse.json({
    stats: {
      totalMachines: totalMachines.count,
      availableMachines: availableMachines.count,
      pendingRequests: pendingRequests.count,
      totalUsers: totalUsers.count,
    },
    statusDistribution: statusDist,
    recentRequests,
  });
}
