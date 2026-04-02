"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "bruker";
  createdAt: string;
  organization: { id: number; name: string } | null;
  department: { id: number; name: string } | null;
}

interface OrgWithDepts {
  id: number;
  name: string;
  departments: { id: number; name: string }[];
}

const defaultForm = {
  name: "",
  email: "",
  password: "",
  role: "bruker",
  organizationId: "",
  departmentId: "",
};

export default function AdminBrukerePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [orgs, setOrgs] = useState<OrgWithDepts[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchUsers();
    fetchOrgs();
  }, []);

  async function fetchUsers() {
    const res = await fetch("/api/admin/brukere");
    const data = await res.json();
    setUsers(data);
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
    setSuccess("");

    try {
      const res = await fetch("/api/admin/brukere", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Kunne ikke opprette bruker");
        return;
      }

      setSuccess(`Bruker "${data.name}" opprettet.`);
      setShowForm(false);
      setForm(defaultForm);
      fetchUsers();
    } catch {
      setError("En feil oppstod");
    } finally {
      setSaving(false);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Brukere</h1>
        <Button onClick={() => { setShowForm(!showForm); setError(""); setSuccess(""); }}>
          {showForm ? "Avbryt" : "+ Ny bruker"}
        </Button>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded px-3 py-2 mb-4">
          {success}
        </div>
      )}

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Ny bruker</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Navn *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              label="E-postadresse *"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Input
              label="Passord *"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <Select
              label="Rolle"
              options={[
                { value: "bruker", label: "Bruker" },
                { value: "admin", label: "Administrator" },
              ]}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
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

            {error && (
              <div className="sm:col-span-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2">
                {error}
              </div>
            )}

            <div className="sm:col-span-2 flex gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Oppretter..." : "Opprett bruker"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Avbryt
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bruker</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Avdeling</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rolle</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Opprettet</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900 text-sm">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </td>
                <td className="px-6 py-4 hidden sm:table-cell">
                  <p className="text-sm text-gray-600">{u.department?.name || u.organization?.name || "–"}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    u.role === "admin"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {u.role === "admin" ? "Administrator" : "Bruker"}
                  </span>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <p className="text-sm text-gray-500">{formatDate(u.createdAt)}</p>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-sm">
                  Ingen brukere registrert.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
