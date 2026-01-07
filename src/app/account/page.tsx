"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchProfile, ProfileResponse } from "@/lib/api";
import { getSession } from "@/lib/session";

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
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
        setStatus("idle");
      })
      .catch((err) => {
        setMessage(err.message || "No se pudo cargar el perfil");
        setStatus("error");
      });
  }, [router]);

  const renderRows = () => {
    if (!profile) return null;
    if (profile.type === "patient") {
      const p = profile.data;
      return (
        <>
          <Row label="Nombre completo" value={p.fullName} />
          <Row label="DNI" value={p.dni || "N/D"} />
          <Row label="Teléfono" value={p.phone || "N/D"} />
          <Row label="Correo" value={p.email || "N/D"} />
        </>
      );
    }
    const d = profile.data;
    return (
      <>
        <Row label="Matrícula" value={d.license || "N/D"} />
        <Row label="Especialidad" value={d.specialty || "N/D"} />
      </>
    );
  };

  return (
    <section className="auth-hero">
      <div>
        <p className="eyebrow">Mi cuenta</p>
        <h1 className="heading">Datos de perfil</h1>
        <p className="subheading">
          Revisa la información que tenemos asociada a tu usuario.
        </p>
      </div>
      <div className="auth-card">
        {status === "error" && <div className="status error">{message}</div>}
        {status === "loading" && <p className="muted">Cargando perfil...</p>}
        {status === "idle" && profile && (
          <div className="grid" style={{ gap: 10 }}>
            <Row label="Tipo" value={profile.type === "patient" ? "Paciente" : "Dentista/Admin"} />
            {renderRows()}
          </div>
        )}
        <div style={{ marginTop: 14 }}>
          <button className="btn btn-primary" type="button" onClick={() => router.push("/account/configuracion")}>
            Editar datos
          </button>
        </div>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <span className="label">{label}</span>
      <span className="muted">{value}</span>
    </div>
  );
}


