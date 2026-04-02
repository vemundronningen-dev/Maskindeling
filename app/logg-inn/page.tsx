"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Innlogging feilet");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("En feil oppstod. Prøv igjen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-700 rounded-lg mb-4">
            <span className="text-white font-bold text-2xl">M</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Maskindeling</h1>
          <p className="text-gray-500 text-sm mt-1">Oslo kommune – internt maskinsystem</p>
        </div>

        {/* Form */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Logg inn</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              label="E-postadresse"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ola.nordmann@oslo.kommune.no"
              required
              autoComplete="email"
            />

            <Input
              id="password"
              label="Passord"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? "Logger inn..." : "Logg inn"}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 font-medium mb-2">Testkontoer:</p>
            <div className="space-y-1">
              <p className="text-xs text-gray-500">
                <span className="font-medium">Admin:</span> admin@oslo.kommune.no / admin123
              </p>
              <p className="text-xs text-gray-500">
                <span className="font-medium">Bruker (VAV):</span> bruker@vav.oslo.kommune.no / bruker123
              </p>
              <p className="text-xs text-gray-500">
                <span className="font-medium">Bruker (KF):</span> bruker@kf.oslo.kommune.no / bruker123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
