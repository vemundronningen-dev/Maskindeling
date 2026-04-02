"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SessionUser } from "@/lib/auth";

interface NavbarProps {
  user: SessionUser;
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/logg-inn");
    router.refresh();
  }

  return (
    <header className="bg-blue-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                <span className="text-blue-800 font-bold text-sm">M</span>
              </div>
              <span className="font-semibold text-lg hidden sm:block">
                Maskindeling
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-blue-100 hover:text-white text-sm font-medium transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/maskiner"
                className="text-blue-100 hover:text-white text-sm font-medium transition-colors"
              >
                Maskiner
              </Link>
              <Link
                href="/foresporsler"
                className="text-blue-100 hover:text-white text-sm font-medium transition-colors"
              >
                Forespørsler
              </Link>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="text-blue-100 hover:text-white text-sm font-medium transition-colors"
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-blue-200">{user.departmentName || user.organizationName}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-blue-200 hover:text-white text-sm transition-colors"
            >
              Logg ut
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
