"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface Machine {
  id: number;
  name: string;
  type: string;
  brand: string | null;
  model: string | null;
  location: string | null;
  status: "tilgjengelig" | "opptatt" | "på_service" | "ute_av_drift";
  contactName: string | null;
  organization: { id: number; name: string } | null;
  department: { id: number; name: string } | null;
}

const statusOptions = [
  { value: "", label: "Alle statuser" },
  { value: "tilgjengelig", label: "Tilgjengelig" },
  { value: "opptatt", label: "Opptatt" },
  { value: "på_service", label: "På service" },
  { value: "ute_av_drift", label: "Ute av drift" },
];

const typeOptions = [
  { value: "", label: "Alle typer" },
  { value: "minigraver", label: "Minigraver" },
  { value: "graver", label: "Graver" },
  { value: "vibroplate", label: "Vibroplate" },
  { value: "generator", label: "Generator" },
  { value: "hjullaster", label: "Hjullaster" },
  { value: "traktor", label: "Traktor" },
  { value: "kran", label: "Kran" },
];

export default function MaskinerPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const fetchMachines = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      if (type) params.set("type", type);

      const res = await fetch(`/api/maskiner?${params}`);
      const data = await res.json();
      setMachines(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [search, status, type]);

  useEffect(() => {
    fetchMachines();
  }, [fetchMachines]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
  }

  function handleReset() {
    setSearchInput("");
    setSearch("");
    setStatus("");
    setType("");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Maskiner</h1>
        <p className="text-gray-500 text-sm mt-1">
          Søk etter og send forespørsel om maskiner
        </p>
      </div>

      {/* Filter panel */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Søk etter maskin, type, merke..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-44">
            <Select
              options={typeOptions}
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="Alle typer"
            />
          </div>
          <div className="w-full sm:w-44">
            <Select
              options={statusOptions}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              placeholder="Alle statuser"
            />
          </div>
          <Button type="submit" variant="primary">
            Søk
          </Button>
          {(search || status || type) && (
            <Button type="button" variant="ghost" onClick={handleReset}>
              Nullstill
            </Button>
          )}
        </form>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Laster maskiner...</div>
      ) : machines.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <p className="text-gray-500">Ingen maskiner funnet.</p>
          {(search || status || type) && (
            <button
              onClick={handleReset}
              className="text-blue-700 text-sm mt-2 hover:underline"
            >
              Fjern filtre
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-3">
            {machines.length} maskin{machines.length !== 1 ? "er" : ""} funnet
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {machines.map((machine) => (
              <Link
                key={machine.id}
                href={`/maskiner/${machine.id}`}
                className="bg-white border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-sm transition-all block"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{machine.name}</h3>
                    <p className="text-sm text-gray-500">
                      {machine.brand} {machine.model}
                    </p>
                  </div>
                  <Badge status={machine.status} />
                </div>

                <div className="space-y-1.5 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Type:</span>
                    <span className="capitalize">{machine.type}</span>
                  </div>
                  {machine.department && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Avdeling:</span>
                      <span>{machine.department.name}</span>
                    </div>
                  )}
                  {machine.location && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Plassering:</span>
                      <span>{machine.location}</span>
                    </div>
                  )}
                </div>

                {machine.status === "tilgjengelig" && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className="text-sm text-blue-700 font-medium">
                      Send forespørsel →
                    </span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
