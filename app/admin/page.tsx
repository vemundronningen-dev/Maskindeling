import Link from "next/link";
import { db } from "@/lib/db";
import { machines, users, machineRequests } from "@/lib/db/schema";
import { count, eq } from "drizzle-orm";

export default async function AdminPage() {
  const [totalMachines] = await db.select({ count: count() }).from(machines);
  const [totalUsers] = await db.select({ count: count() }).from(users);
  const [totalRequests] = await db.select({ count: count() }).from(machineRequests);
  const [pendingRequests] = await db
    .select({ count: count() })
    .from(machineRequests)
    .where(eq(machineRequests.status, "sendt"));

  const cards = [
    { label: "Maskiner", value: totalMachines.count, href: "/admin/maskiner" },
    { label: "Brukere", value: totalUsers.count, href: "/admin/brukere" },
    { label: "Forespørsler totalt", value: totalRequests.count, href: "/admin/foresporsler" },
    { label: "Venter behandling", value: pendingRequests.count, href: "/admin/foresporsler" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Administrasjon</h1>
        <p className="text-gray-500 text-sm mt-1">Systemadministrasjon for Maskindeling</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{card.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { title: "Ny maskin", desc: "Registrer en ny maskin i systemet", href: "/admin/maskiner" },
          { title: "Ny bruker", desc: "Legg til en ny bruker", href: "/admin/brukere" },
          { title: "Behandle forespørsler", desc: "Godkjenn eller avslå forespørsler", href: "/admin/foresporsler" },
        ].map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="bg-white border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
          >
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">{item.title} →</h3>
            <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
