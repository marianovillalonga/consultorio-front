"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchProfile, updateProfile, ProfileResponse } from "@/lib/api";\nimport { getSession } from "@/lib/session";

type FormState = {
  fullName?: string;
  dni?: string;
  phone?: string;
  email?: string;
  license?: string;
  specialty?: string;
};

export default function AccountSettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [form, setForm] = useState<FormState>({});
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "error" | "success">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = getSession().token;
    if (!token) {
      router.replace("/not-found");
      return;
    }
    setStatus("loading");
    fetchProfile(token)
      .then((data) => {
        setProfile(data);
        if (data.type === "patient") {
          setForm({
            fullName: data.data.fullName || "",
            dni: data.data.dni || "",
            phone: data.data.phone || "",
            email: data.data.email || "",
          });
        } else {
          setForm({
            license: data.data.license || "",
            specialty: data.data.specialty || "",
          });
        }
        setStatus("idle");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.message || "No se pudo cargar el perfil");
      });
  }, [router]);

  const onChange = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getSession().token;
    if (!token) {
      router.replace("/not-found");
      return;
    }
    setStatus("saving");
    setMessage("");
    try {
      const payload: Record<string, string> = {};
      Object.entries(form).forEach(([k, v]) => {
        if (typeof v === "string") payload[k] = v;
      });
      const updated = await updateProfile(token, payload);
      setProfile(updated);
      setStatus("success");
      setMessage("Datos actualizados correctamente.");
    } catch (err) {
      const e = err as Error;
      setStatus("error");
      setMessage(e.message || "No se pudo actualizar");
    }
  };

  const isPatient = profile?.type === "patient";
  const disabled = status === "saving" || status === "loading";

  return (
    <section className="auth-hero">
      <div>
        <p className="eyebrow">Configuración</p>
        <h1 className="heading">Editar mis datos</h1>
        <p className="subheading">Actualiza tu información personal.</p>
      </div>

      <div className="auth-card">
        {status === "error" && <div className="status error">{message}</div>}
        {status === "success" && <div className="status success">{message}</div>}
        {status === "loading" && <p className="muted">Cargando perfil...</p>}

        {profile && status !== "loading" && (
          <form className="form" onSubmit={handleSubmit}>
            {isPatient ? (
              <>
                <Field
                  label="Nombre completo"
                  value={form.fullName || ""}
                  onChange={(v) => onChange("fullName", v)}
                  placeholder="Ej: Ana Perez"
                />
                <Field label="DNI" value={form.dni || ""} onChange={(v) => onChange("dni", v)} placeholder="Documento" />
                <Field
                  label="Teléfono"
                  value={form.phone || ""}
                  onChange={(v) => onChange("phone", v)}
                  placeholder="Teléfono de contacto"
                />
                <Field
                  label="Correo"
                  type="email"
                  value={form.email || ""}
                  onChange={(v) => onChange("email", v)}
                  placeholder="tu@email.com"
                />
              </>
            ) : (
              <>
                <Field
                  label="Matrícula"
                  value={form.license || ""}
                  onChange={(v) => onChange("license", v)}
                  placeholder="Matrícula profesional"
                />
                <Field
                  label="Especialidad"
                  value={form.specialty || ""}
                  onChange={(v) => onChange("specialty", v)}
                  placeholder="Ej: Ortodoncia"
                />
              </>
            )}

            <div className="form-footer">
              <button className="btn btn-primary" type="submit" disabled={disabled}>
                {status === "saving" ? "Guardando..." : "Guardar cambios"}
              </button>
              <button type="button" className="btn ghost" onClick={() => router.push("/dashboard")} disabled={disabled}>
                Volver al dashboard
              </button>
            </div>
          </form>
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

