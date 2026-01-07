"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cancelAppointment, fetchMyAppointments, Appointment } from "@/lib/api";
import { getSession } from "@/lib/session";

export default function MisTurnosPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const session = getSession();
    const t = session.token;
    if (!t) {
      router.replace("/login");
      return;
    }
    if (session.role && session.role !== "PACIENTE") {
      router.replace("/dashboard");
      return;
    }
    setToken(t);
    loadAppointments(t);
  }, [router]);

  const loadAppointments = async (tkn: string) => {
    setStatus("loading");
    setMessage("");
    try {
      const list = await fetchMyAppointments(tkn);
      setAppointments(list);
      setStatus("idle");
    } catch (err) {
      const e = err as Error;
      setStatus("error");
      setMessage(e.message || "No se pudieron cargar tus turnos");
    }
  };

  const cancel = async (id: number) => {
    if (!token) return;
    setStatus("loading");
    setMessage("");
    try {
      await cancelAppointment(token, id);
      await loadAppointments(token);
      setStatus("idle");
      setMessage("Turno cancelado.");
    } catch (err) {
      const e = err as Error;
      setStatus("error");
      setMessage(e.message || "No se pudo cancelar el turno");
    }
  };

  return (
    <section className="auth-hero" style={{ width: "min(640px, 100%)" }}>
      <div>
        <p className="eyebrow">Turnos</p>
        <h1 className="heading">Mis turnos</h1>
        <p className="subheading">Consulta y cancela tus turnos programados.</p>
      </div>

      <div className="auth-card">
        {status === "loading" && <p className="muted">Cargando...</p>}
        {message && <div className={`status ${status === "error" ? "error" : "success"}`}>{message}</div>}
        {appointments.length === 0 && status === "idle" && <p className="muted">No tienes turnos.</p>}

        {appointments.length > 0 && (
          <div className="grid" style={{ gap: 12 }}>
            {appointments.map((appt) => (
              <div key={appt.id} className="menu-item" style={{ background: "#f7f9ff", color: "#0b1d3a" }}>
                <div style={{ display: "grid", gap: 4, flex: 1 }}>
                  <span className="label">{formatDate(appt.startAt)}</span>
                  <span className="muted">
                    {formatTime(appt.startAt)} - {formatTime(appt.endAt)} | {appt.dentist?.user?.email || "Dentista"}
                  </span>
                  <span className="muted">Estado: {appt.status}</span>
                  {appt.reason && <span className="muted">Motivo: {appt.reason}</span>}
                </div>
                {appt.status !== "CANCELADO" && (
                  <button
                    className="btn"
                    style={{ padding: "8px 12px", background: "#fff", color: "#c32031", borderColor: "#f6d4d8" }}
                    type="button"
                    onClick={() => cancel(appt.id)}
                    disabled={status === "loading"}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString();
}
