"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createAppointment,
  fetchAvailability,
  fetchProfile,
  fetchDentists,
  fetchSpecialties,
  ProfileResponse,
} from "@/lib/api";
import { getSession } from "@/lib/session";

type Slot = {
  startAt: string;
  endAt: string;
  available: boolean;
};

export default function TurnosPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [dentistId, setDentistId] = useState<number | null>(null);
  const [specialty, setSpecialty] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [dentists, setDentists] = useState<
    { id: number; specialty?: string | null; license?: string | null; user?: { email: string } | null }[]
  >([]);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "booking" | "error" | "success">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const session = getSession();
    const t = session.token;
    if (!t) {
      router.replace("/login");
      return;
    }
    // Solo pacientes pueden agendar
    if (session.role && session.role !== "PACIENTE") {
      router.replace("/dashboard");
      return;
    }
    setToken(t);
    fetchProfile(t)
      .then((p) => setProfile(p))
      .catch(() => router.replace("/login"));
    fetchSpecialties()
      .then((s) => setSpecialties(s))
      .catch(() => setSpecialties([]));
  }, [router]);

  const loadSlots = async () => {
    if (!token || !dentistId || !date) return;
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetchAvailability(token, dentistId, date);
      setSlots(res.slots || []);
      setStatus("idle");
    } catch (err) {
      const e = err as Error;
      setStatus("error");
      setMessage(e.message || "No se pudo cargar disponibilidad");
    }
  };

  useEffect(() => {
    if (!specialty) {
      setDentists([]);
      setDentistId(null);
      return;
    }
    setStatus("loading");
    setMessage("");
    fetchDentists(specialty)
      .then((list) => {
        setDentists(list);
        setStatus("idle");
      })
      .catch((err) => {
        const e = err as Error;
        setStatus("error");
        setMessage(e.message || "No se pudo obtener dentistas");
      });
  }, [specialty]);

  const book = async (slot: Slot) => {
    if (!profile || profile.type !== "patient" || !token || !dentistId) return;
    setStatus("booking");
    setMessage("");
    try {
      await createAppointment(token, {
        dentistId,
        patientId: profile.data.id,
        startAt: slot.startAt,
        endAt: slot.endAt,
      });
      setStatus("success");
      setMessage("Turno reservado con éxito.");
    } catch (err) {
      const e = err as Error;
      setStatus("error");
      setMessage(e.message || "No se pudo reservar el turno");
    }
  };

  return (
    <section className="auth-hero">
      <div>
        <p className="eyebrow">Turnos</p>
        <h1 className="heading">Agendar un turno</h1>
        <p className="subheading">
          Selecciona especialidad, elige un profesional y toma un horario de 30 minutos disponible.
        </p>
      </div>

      <div className="auth-card">
        <div className="form" style={{ marginBottom: 12 }}>
          <label className="form-group">
            <span className="label">Especialidad</span>
            <select
              className="input"
              value={specialty}
              onChange={(e) => {
                setSpecialty(e.target.value);
                setDentistId(null);
              }}
            >
              <option value="">Selecciona especialidad</option>
              {specialties.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="form-group">
            <span className="label">Profesional</span>
            <select
              className="input"
              value={dentistId ?? ""}
              onChange={(e) => setDentistId(Number(e.target.value) || null)}
              disabled={!specialty || dentists.length === 0}
            >
              <option value="">{specialty ? "Selecciona un profesional" : "Elige una especialidad"}</option>
              {dentists.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.user?.email || "Dentista"} {d.specialty ? `- ${d.specialty}` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="form-group">
            <span className="label">Fecha</span>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <button
            className="btn btn-primary"
            type="button"
            onClick={loadSlots}
            disabled={!dentistId || !date || status === "loading"}
          >
            {status === "loading" ? "Buscando..." : "Ver turnos disponibles"}
          </button>
        </div>

        {message && <div className={`status ${status === "error" ? "error" : "success"}`}>{message}</div>}

        {slots.length > 0 && (
          <div className="grid" style={{ gap: 10 }}>
            {slots.map((slot) => (
              <button
                key={slot.startAt}
                className="menu-item"
                style={{
                  background: slot.available ? "#f7f9ff" : "rgba(0,0,0,0.05)",
                  color: "#0b1d3a",
                  borderColor: slot.available ? "#d7e4ff" : "transparent",
                  cursor: slot.available ? "pointer" : "not-allowed",
                  opacity: slot.available ? 1 : 0.6,
                }}
                onClick={() => slot.available && book(slot)}
                disabled={!slot.available || status === "booking"}
              >
                {formatTime(slot.startAt)} - {formatTime(slot.endAt)}
              </button>
            ))}
          </div>
        )}

        {slots.length === 0 && status === "idle" && (
          <p className="muted">Selecciona dentista y fecha para ver disponibilidad.</p>
        )}
      </div>
    </section>
  );
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}


