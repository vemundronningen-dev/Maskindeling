import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/logg-inn");
  if (session.role !== "admin") redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={session} />
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-6 py-2 text-sm">
            <Link
              href="/admin"
              className="text-gray-600 hover:text-blue-700 font-medium py-1"
            >
              Oversikt
            </Link>
            <Link
              href="/admin/maskiner"
              className="text-gray-600 hover:text-blue-700 font-medium py-1"
            >
              Maskiner
            </Link>
            <Link
              href="/admin/brukere"
              className="text-gray-600 hover:text-blue-700 font-medium py-1"
            >
              Brukere
            </Link>
            <Link
              href="/admin/foresporsler"
              className="text-gray-600 hover:text-blue-700 font-medium py-1"
            >
              Forespørsler
            </Link>
          </nav>
        </div>
      </div>
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <MobileNav user={session} />
    </div>
  );
}
