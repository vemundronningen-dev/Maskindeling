import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

async function getDashboardData() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  // Server-side: use db directly
  const { db } = await import("@/lib/db");
  const { machines, machineRequests, users } = await import("@/lib/db/schema");
  const { count, eq, desc, sql } = await import("drizzle-orm");

  const [totalMachines] = await db.select({ count: count() }).from(machines);
  const [available] = await db
    .select({ count: count() })
    .from(machines)
    .where(eq(machines.status, "tilgjengelig"));
  const [pending] = await db
    .select({ count: count() })
    .from(machineRequests)
    .where(eq(machineRequests.status, "sendt"));
  const [totalUsers] = await db.select({ count: count() }).from(users);

  const statusDist = await db
    .select({ status: machines.status, count: count() })
    .from(machines)
    .groupBy(machines.status);

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
    .orderBy(desc(machineRequests.createdAt))
    .limit(5);

  return {
    stats: {
      totalMachines: totalMachines.count,
      availableMachines: available.count,
      pendingRequests: pending.count,
      totalUsers: totalUsers.count,
    },
    statusDistribution: statusDist,
    recentRequests,
  };
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/logg-inn");

  const data = await getDashboardData();

  const statCards = [
    {
      label: "Totalt maskiner",
      value: data.stats.totalMachines,
      color: "text-blue-700",
      bg: "bg-blue-50",
    },
    {
      label: "Tilgjengelige",
      value: data.stats.availableMachines,
      color: "text-green-700",
      bg: "bg-green-50",
    },
    {
      label: "Ventende forespørsler",
      value: data.stats.pendingRequests,
      color: "text-yellow-700",
      bg: "bg-yellow-50",
    },
    {
      label: "Registrerte brukere",
      value: data.stats.totalUsers,
      color: "text-gray-700",
      bg: "bg-gray-100",
    },
  ];

  const statusLabels: Record<string, string> = {
    tilgjengelig: "Tilgjengelig",
    opptatt: "Opptatt",
    på_service: "På service",
    ute_av_drift: "Ute av drift",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Velkommen, {session.name} –{" "}
          {session.departmentName || session.organizationName}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`${card.bg} rounded-lg p-4 border border-transparent`}
          >
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {card.label}
            </p>
            <p className={`text-3xl font-bold mt-1 ${card.color}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status oversikt */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Maskinstatus oversikt</h2>
          </div>
          <div className="px-6 py-4 space-y-3">
            {data.statusDistribution.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <Badge status={item.status as "tilgjengelig" | "opptatt" | "på_service" | "ute_av_drift"} />
                <span className="text-sm font-medium text-gray-700">
                  {item.count} maskin{item.count !== 1 ? "er" : ""}
                </span>
              </div>
            ))}
            {data.statusDistribution.length === 0 && (
              <p className="text-sm text-gray-400">Ingen maskiner registrert ennå.</p>
            )}
          </div>
        </div>

        {/* Siste forespørsler */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Siste forespørsler</h2>
            <Link
              href="/foresporsler"
              className="text-sm text-blue-700 hover:underline"
            >
              Se alle
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {data.recentRequests.map((req) => (
              <div key={req.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {req.machineName}
                  </p>
                  <p className="text-xs text-gray-500">{req.requesterName}</p>
                </div>
                <Badge status={req.status as "sendt" | "godkjent" | "avslått"} />
              </div>
            ))}
            {data.recentRequests.length === 0 && (
              <div className="px-6 py-4">
                <p className="text-sm text-gray-400">Ingen forespørsler ennå.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/maskiner"
          className="bg-white border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
        >
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">
            Søk etter maskiner →
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Se alle tilgjengelige maskiner og send forespørsel
          </p>
        </Link>
        <Link
          href="/foresporsler"
          className="bg-white border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
        >
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">
            Mine forespørsler →
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Følg opp forespørsler du har sendt
          </p>
        </Link>
      </div>
    </div>
  );
}
