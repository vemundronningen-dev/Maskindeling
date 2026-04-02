"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  availableFrom: string | null;
  availableTo: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  notes: string | null;
  createdAt: string;
  organization: { id: number; name: string } | null;
  department: { id: number; name: string } | null;
}

export default function MachineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/maskiner/${id}`)
      .then((r) => r.json())
      .then(setMachine)
      .catch(() => setError("Kunne ikke laste maskin"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/foresporsler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ machineId: id, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Kunne ikke sende forespørsel");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("En feil oppstod. Prøv igjen.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-gray-400">
        Laster maskin...
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">Maskin ikke funnet.</p>
        <Link href="/maskiner" className="text-blue-700 text-sm mt-2 hover:underline block">
          Tilbake til maskiner
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <Link
        href="/maskiner"
        className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-flex items-center gap-1"
      >
        ← Tilbake til maskiner
      </Link>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm mt-4">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{machine.name}</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {machine.brand} {machine.model}
            </p>
          </div>
          <Badge status={machine.status} />
        </div>

        {/* Details */}
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DetailRow label="Type" value={machine.type} />
          {machine.organization && (
            <DetailRow label="Organisasjon" value={machine.organization.name} />
          )}
          {machine.department && (
            <DetailRow label="Avdeling" value={machine.department.name} />
          )}
          {machine.location && (
            <DetailRow label="Plassering" value={machine.location} />
          )}
          {machine.availableFrom && (
            <DetailRow label="Tilgjengelig fra" value={machine.availableFrom} />
          )}
          {machine.availableTo && (
            <DetailRow label="Tilgjengelig til" value={machine.availableTo} />
          )}
        </div>

        {/* Contact */}
        {(machine.contactName || machine.contactEmail || machine.contactPhone) && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Kontaktperson</h3>
            <div className="space-y-1">
              {machine.contactName && (
                <p className="text-sm text-gray-600">{machine.contactName}</p>
              )}
              {machine.contactEmail && (
                <a
                  href={`mailto:${machine.contactEmail}`}
                  className="text-sm text-blue-700 hover:underline block"
                >
                  {machine.contactEmail}
                </a>
              )}
              {machine.contactPhone && (
                <p className="text-sm text-gray-600">{machine.contactPhone}</p>
              )}
            </div>
          </div>
        )}

        {machine.notes && (
          <div className="px-6 py-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Merknader</h3>
            <p className="text-sm text-gray-600">{machine.notes}</p>
          </div>
        )}
      </div>

      {/* Request form */}
      {machine.status === "tilgjengelig" && !submitted && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm mt-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Send forespørsel</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Be om å låne denne maskinen fra {machine.department?.name}
            </p>
          </div>
          <form onSubmit={handleRequest} className="px-6 py-5 space-y-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="message" className="text-sm font-medium text-gray-700">
                Melding <span className="text-gray-400 font-normal">(valgfritt)</span>
              </label>
              <textarea
                id="message"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Forklar kort behovet, ønsket periode osv."
                className="block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Sender..." : "Send forespørsel"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
              >
                Avbryt
              </Button>
            </div>
          </form>
        </div>
      )}

      {submitted && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-5 mt-6">
          <h3 className="font-semibold text-green-800">Forespørsel sendt!</h3>
          <p className="text-sm text-green-700 mt-1">
            Forespørselen din er registrert og vil bli behandlet av ansvarlig
            avdeling.
          </p>
          <div className="mt-3 flex gap-3">
            <Link href="/foresporsler">
              <Button size="sm" variant="secondary">
                Se mine forespørsler
              </Button>
            </Link>
            <Link href="/maskiner">
              <Button size="sm" variant="ghost">
                Tilbake til maskiner
              </Button>
            </Link>
          </div>
        </div>
      )}

      {machine.status !== "tilgjengelig" && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mt-6">
          <p className="text-sm text-gray-600">
            Denne maskinen er for øyeblikket ikke tilgjengelig for forespørsler.
          </p>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}
