"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

interface Machine {
  id: number;
  name: string;
  type: string;
  brand: string | null;
  model: string | null;
  location: string | null;
  status: "tilgjengelig" | "opptatt" | "på_service" | "ute_av_drift";
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  notes: string | null;
  availableFrom: string | null;
  availableTo: string | null;
  organization: { id: number; name: string } | null;
  department: { id: number; name: string } | null;
}

interface OrgWithDepts {
  id: number;
  name: string;
  departments: { id: number; name: string }[];
}

const statusOptions = [
  { value: "tilgjengelig", label: "Tilgjengelig" },
  { value: "opptatt", label: "Opptatt" },
  { value: "på_service", label: "På service" },
  { value: "ute_av_drift", label: "Ute av drift" },
];

const defaultForm = {
  name: "",
  type: "",
  brand: "",
  model: "",
  organizationId: "",
  departmentId: "",
  location: "",
  status: "tilgjengelig",
  availableFrom: "",
  availableTo: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  notes: "",
};

export default function AdminMaskinerPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [orgs, setOrgs] = useState<OrgWithDepts[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMachines();
    fetchOrgs();
  }, []);

  async function fetchMachines() {
    const res = await fetch("/api/maskiner");
    const data = await res.json();
    setMachines(data);
  }

  async function fetchOrgs() {
    const res = await fetch("/api/organisasjoner");
    const data = await res.json();
    setOrgs(data);
  }

  const selectedOrg = orgs.find((o) => o.id === parseInt(form.organizationId));
  const deptOptions = selectedOrg
    ? selectedOrg.departments.map((d) => ({ value: String(d.id), label: d.name }))
    : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const url = editId ? `/api/maskiner/${editId}` : "/api/maskiner";
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Kunne ikke lagre maskin");
        return;
      }

      setShowForm(false);
      setForm(defaultForm);
      setEditId(null);
      fetchMachines();
    } catch {
      setError("En feil oppstod");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Er du sikker på at du vil slette denne maskinen?")) return;

    await fetch(`/api/maskiner/${id}`, { method: "DELETE" });
    fetchMachines();
  }

  function handleEdit(machine: Machine) {
    setForm({
      name: machine.name,
      type: machine.type,
      brand: machine.brand || "",
      model: machine.model || "",
      organizationId: machine.organization ? String(machine.organization.id) : "",
      departmentId: machine.department ? String(machine.department.id) : "",
      location: machine.location || "",
      status: machine.status,
      availableFrom: machine.availableFrom || "",
      availableTo: machine.availableTo || "",
      contactName: machine.contactName || "",
      contactEmail: machine.contactEmail || "",
      contactPhone: machine.contactPhone || "",
      notes: machine.notes || "",
    });
    setEditId(machine.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Maskiner</h1>
        <Button onClick={() => { setShowForm(!showForm); setEditId(null); setForm(defaultForm); }}>
          {showForm && !editId ? "Avbryt" : "+ Ny maskin"}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            {editId ? "Rediger maskin" : "Ny maskin"}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Navn *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              label="Type *"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              placeholder="f.eks. minigraver"
              required
            />
            <Input
              label="Merke"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
            />
            <Input
              label="Modell"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
            />
            <Select
              label="Organisasjon"
              options={orgs.map((o) => ({ value: String(o.id), label: o.name }))}
              value={form.organizationId}
              onChange={(e) => setForm({ ...form, organizationId: e.target.value, departmentId: "" })}
              placeholder="Velg organisasjon"
            />
            <Select
              label="Avdeling"
              options={deptOptions}
              value={form.departmentId}
              onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
              placeholder="Velg avdeling"
              disabled={!form.organizationId}
            />
            <Input
              label="Plassering"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
            <Select
              label="Status"
              options={statusOptions}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            />
            <Input
              label="Tilgjengelig fra"
              placeholder="f.eks. 01.06.2025"
              value={form.availableFrom}
              onChange={(e) => setForm({ ...form, availableFrom: e.target.value })}
            />
            <Input
              label="Tilgjengelig til"
              placeholder="f.eks. 30.06.2025"
              value={form.availableTo}
              onChange={(e) => setForm({ ...form, availableTo: e.target.value })}
            />
            <Input
              label="Kontaktperson"
              value={form.contactName}
              onChange={(e) => setForm({ ...form, contactName: e.target.value })}
            />
            <Input
              label="Kontakt e-post"
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            />
            <Input
              label="Kontakt telefon"
              value={form.contactPhone}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
            />
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700 block mb-1">Merknader</label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {error && (
              <div className="sm:col-span-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2">
                {error}
              </div>
            )}

            <div className="sm:col-span-2 flex gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Lagrer..." : editId ? "Lagre endringer" : "Opprett maskin"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setShowForm(false); setEditId(null); setForm(defaultForm); }}
              >
                Avbryt
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Maskin</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Avdeling</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Handlinger</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {machines.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900 text-sm">{m.name}</p>
                  <p className="text-xs text-gray-500">{m.type} · {m.brand} {m.model}</p>
                </td>
                <td className="px-6 py-4 hidden sm:table-cell">
                  <p className="text-sm text-gray-600">{m.department?.name || "–"}</p>
                </td>
                <td className="px-6 py-4">
                  <Badge status={m.status} />
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button size="sm" variant="secondary" onClick={() => handleEdit(m)}>
                      Rediger
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(m.id)}>
                      Slett
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {machines.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-sm">
                  Ingen maskiner registrert.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
