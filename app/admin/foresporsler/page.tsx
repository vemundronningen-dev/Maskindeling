"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

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

export default function AdminForesporslerPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    setLoading(true);
    const res = await fetch("/api/foresporsler");
    const data = await res.json();
    setRequests(data);
    setLoading(false);
  }

  async function updateStatus(id: number, status: "godkjent" | "avslått") {
    setUpdating(id);
    try {
      const res = await fetch(`/api/foresporsler/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status } : r))
        );
      }
    } finally {
      setUpdating(null);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("nb-NO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const pending = requests.filter((r) => r.status === "sendt");
  const handled = requests.filter((r) => r.status !== "sendt");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Forespørsler</h1>
        <p className="text-gray-500 text-sm mt-1">Behandle innkommende maskinforespørsler</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Laster forespørsler...</div>
      ) : (
        <>
          {/* Pending */}
          <div className="mb-8">
            <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              Venter behandling
              {pending.length > 0 && (
                <span className="bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  {pending.length}
                </span>
              )}
            </h2>
            {pending.length === 0 ? (
              <p className="text-sm text-gray-400 bg-white border border-gray-200 rounded-lg px-6 py-4">
                Ingen ventende forespørsler.
              </p>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-100">
                {pending.map((req) => (
                  <div key={req.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Link
                            href={`/maskiner/${req.machine?.id}`}
                            className="font-semibold text-gray-900 hover:text-blue-700"
                          >
                            {req.machine?.name}
                          </Link>
                          <span className="text-xs text-gray-400">#{req.id}</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">{req.requestedBy?.name}</span>
                          <span className="text-gray-400"> ({req.requestedBy?.email})</span>
                        </p>
                        {req.fromDepartmentName && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            Fra: {req.fromDepartmentName}
                            {req.toDepartmentName && ` → ${req.toDepartmentName}`}
                          </p>
                        )}
                        {req.message && (
                          <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded px-3 py-2 italic">
                            &ldquo;{req.message}&rdquo;
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">{formatDate(req.createdAt)}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={updating === req.id}
                          onClick={() => updateStatus(req.id, "godkjent")}
                        >
                          Godkjenn
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={updating === req.id}
                          onClick={() => updateStatus(req.id, "avslått")}
                        >
                          Avslå
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Handled */}
          {handled.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-700 mb-3">Tidligere behandlet</h2>
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-100">
                {handled.map((req) => (
                  <div key={req.id} className="px-6 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{req.machine?.name}</p>
                      <p className="text-xs text-gray-500">{req.requestedBy?.name} · {formatDate(req.createdAt)}</p>
                    </div>
                    <Badge status={req.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
