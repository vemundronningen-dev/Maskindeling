"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface Request {
  id: number;
  status: "sendt" | "godkjent" | "avslått";
  createdAt: string;
  message: string | null;
  machine: { id: number; name: string; type: string } | null;
  requestedBy: { id: number; name: string; email: string } | null;
  fromDepartmentName: string | null;
  toDepartmentName: string | null;
}

export default function ForesporslerPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [showAll]);

  async function fetchRequests() {
    setLoading(true);
    try {
      const params = showAll ? "" : "?mine=true";
      const res = await fetch(`/api/foresporsler${params}`);
      const data = await res.json();
      setRequests(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("nb-NO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Forespørsler</h1>
          <p className="text-gray-500 text-sm mt-1">
            Oversikt over maskinforespørsler
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={!showAll ? "primary" : "secondary"}
            size="sm"
            onClick={() => setShowAll(false)}
          >
            Mine
          </Button>
          <Button
            variant={showAll ? "primary" : "secondary"}
            size="sm"
            onClick={() => setShowAll(true)}
          >
            Alle
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Laster forespørsler...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <p className="text-gray-500">Ingen forespørsler funnet.</p>
          <Link href="/maskiner" className="text-blue-700 text-sm mt-2 hover:underline block">
            Søk etter maskiner
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-100">
          {requests.map((req) => (
            <div key={req.id} className="px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <Link
                      href={`/maskiner/${req.machine?.id}`}
                      className="font-semibold text-gray-900 hover:text-blue-700"
                    >
                      {req.machine?.name}
                    </Link>
                    <Badge status={req.status} />
                  </div>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">{req.requestedBy?.name}</span>
                    {req.fromDepartmentName && (
                      <span> · {req.fromDepartmentName}</span>
                    )}
                    {req.toDepartmentName && (
                      <span> → {req.toDepartmentName}</span>
                    )}
                  </p>
                  {req.message && (
                    <p className="text-sm text-gray-600 mt-1 italic">
                      &ldquo;{req.message}&rdquo;
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-400">{formatDate(req.createdAt)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
