import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";

export default async function ForesporslerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/logg-inn");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={session} />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <MobileNav user={session} />
    </div>
  );
}
