"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Patient, fetchPatients, createPatient } from "@/lib/api";
import { getSession } from "@/lib/session";

type FormState = {
  fullName: string;
  email: string;
  dni: string;
  phone: string;
  obraSocial: string;
  obraSocialNumero: string;
};

export default function PacientesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [createStatus, setCreateStatus] = useState<"idle" | "saving" | "error" | "success">("idle");
  const [createMessage, setCreateMessage] = useState("");
  const [tab, setTab] = useState<"buscar" | "agregar">("buscar");
  const [form, setForm] = useState<FormState>({
    fullName: "",
    email: "",
    dni: "",
    phone: "",
    obraSocial: "",
    obraSocialNumero: "",
  });

  useEffect(() => {
    const session = getSession();
    const t = session.token;
    if (!t) {
      router.replace("/login");
      return;
    }
    if (session.role !== "ODONTOLOGO" && session.role !== "ADMIN") {
      router.replace("/dashboard");
      return;
    }
    setToken(t);
    loadPatients(t);
  }, [router]);

  useEffect(() => {
    const initialTab = (searchParams.get("tab") as "buscar" | "agregar" | null) || "buscar";
    if (initialTab !== tab) setTab(initialTab);
  }, [searchParams, tab]);

  const changeTab = (next: "buscar" | "agregar") => {
    setTab(next);
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("tab", next);
    router.replace(`/pacientes?${params.toString()}`);
  };

  const loadPatients = async (tkn: string) => {
    setStatus("loading");
    setMessage("");
    try {
      const list = await fetchPatients(tkn);
      setPatients(list);
      setStatus("idle");
    } catch (err) {
      const e = err as Error;
      setStatus("error");
      setMessage(e.message || "No se pudieron cargar los pacientes");
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return patients;
    const q = search.toLowerCase();
    return patients.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.dni && p.dni.toLowerCase().includes(q))
    );
  }, [patients, search]);

  const onChange = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const create = async () => {
    if (!form.fullName.trim()) {
      setCreateStatus("error");
      setCreateMessage("El nombre es obligatorio");
      return;
    }
    setCreateStatus("saving");
    setCreateMessage("");
    try {
      const newPatient = await createPatient(token, {
        fullName: form.fullName,
        email: form.email || undefined,
        dni: form.dni || undefined,
        phone: form.phone || undefined,
        obraSocial: form.obraSocial || undefined,
        obraSocialNumero: form.obraSocialNumero || undefined,
      });
      setPatients((prev) => [...prev, newPatient!].sort((a, b) => a.fullName.localeCompare(b.fullName)));
      setForm({ fullName: "", email: "", dni: "", phone: "", obraSocial: "", obraSocialNumero: "" });
      setCreateStatus("success");
      setCreateMessage("Paciente creado");
    } catch (err) {
      const e = err as Error;
      setCreateStatus("error");
      setCreateMessage(e.message || "No se pudo crear el paciente");
    }
  };

  return (
    <section className="auth-hero" style={{ width: "min(900px, 100%)" }}>
      <div>
        <p className="eyebrow">Pacientes</p>
        <h1 className="heading">Gestión de pacientes</h1>
        <p className="subheading">Abre el submenú para buscar o agregar un paciente.</p>
      </div>

      <div className="auth-card" style={{ marginTop: 10 }}>
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            borderBottom: "1px solid #e6e9f2",
            paddingBottom: 10,
            marginBottom: 12,
          }}
        >
          <p className="label" style={{ margin: 0 }}>
            Pacientes
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              className={`btn ${tab === "buscar" ? "btn-primary" : "ghost"}`}
              type="button"
              onClick={() => changeTab("buscar")}
            >
              Buscar paciente
            </button>
            <button
              className={`btn ${tab === "agregar" ? "btn-primary" : "ghost"}`}
              type="button"
              onClick={() => changeTab("agregar")}
            >
              Agregar paciente
            </button>
          </div>
        </div>

        {tab === "buscar" && (
          <div style={{ display: "grid", gap: 12 }}>
            <div className="form">
              <label className="form-group">
                <span className="label">Buscar</span>
                <input
                  className="input"
                  placeholder="Nombre, correo o DNI"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
            </div>

            {status === "loading" && <p className="muted">Cargando...</p>}
            {message && <div className={`status ${status === "error" ? "error" : "success"}`}>{message}</div>}
            {filtered.length === 0 && status === "idle" && <p className="muted">No hay pacientes para mostrar.</p>}

            {filtered.length > 0 && (
              <div className="grid" style={{ gap: 10 }}>
                {filtered.map((p) => (
                  <button
                    key={p.id}
                    className="menu-item"
                    style={{ background: "#f7f9ff", color: "#0b1d3a", textAlign: "left" }}
                    type="button"
                    onClick={() => router.push(`/pacientes/${p.id}`)}
                  >
                    <div style={{ display: "grid", gap: 4 }}>
                      <span className="label">{p.fullName}</span>
                      <span className="muted">{p.email || "Sin correo"}</span>
                      {p.dni && <span className="muted">DNI: {p.dni}</span>}
                      {typeof p.balance === "number" && (
                        <span className="muted">Balance: {Number(p.balance).toFixed(2)}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "agregar" && (
          <div style={{ display: "grid", gap: 12 }}>
            <div className="form">
              <Field label="Nombre completo" value={form.fullName} onChange={(v) => onChange("fullName", v)} />
              <Field label="Correo" value={form.email} onChange={(v) => onChange("email", v)} type="email" />
              <Field label="DNI" value={form.dni} onChange={(v) => onChange("dni", v)} />
              <Field label="Teléfono" value={form.phone} onChange={(v) => onChange("phone", v)} />
              <Field label="Obra social" value={form.obraSocial} onChange={(v) => onChange("obraSocial", v)} />
              <Field
                label="Número de obra social"
                value={form.obraSocialNumero}
                onChange={(v) => onChange("obraSocialNumero", v)}
              />
            </div>
            {createMessage && (
              <div className={`status ${createStatus === "error" ? "error" : "success"}`}>{createMessage}</div>
            )}
            <button
              className="btn btn-primary"
              type="button"
              onClick={create}
              disabled={createStatus === "saving"}
              style={{ marginTop: 4 }}
            >
              {createStatus === "saving" ? "Guardando..." : "Crear paciente"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="form-group">
      <span className="label">{label}</span>
      <input
        className="input"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
