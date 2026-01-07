"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Appointment,
  Patient,
  fetchMyAppointments,
  updateAppointmentStatus,
  fetchProfile,
  fetchPatients,
  createAppointment,
  rescheduleAppointment,
  fetchAvailability,
  AvailabilitySlot,
} from "@/lib/api";
import { getSession } from "@/lib/session";

const STATUS_LABEL: Record<string, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADO: "Confirmado",
  CANCELADO: "Cancelado",
  ASISTIO: "Asistio",
  NO_ASISTIO: "No asistio",
};

const FIXED_SLOTS = ["08:30", "09:30", "10:15", "11:15", "16:30", "17:30", "18:15", "19:15"];

// End time helper as fallback
function computeEndTime(start: string, dateISO: string) {
  const idx = FIXED_SLOTS.indexOf(start);
  if (idx >= 0 && idx < FIXED_SLOTS.length - 1) {
    return `${dateISO}T${FIXED_SLOTS[idx + 1]}:00`;
  }
  const [h, m] = start.split(":").map(Number);
  const d = new Date(`${dateISO}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
  d.setMinutes(d.getMinutes() + 45);
  return d.toISOString().slice(0, 19);
}

export default function TurnosDoctorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "creating" | "rescheduling">("idle");
  const [message, setMessage] = useState("");
  const [filterDate, setFilterDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dentistId, setDentistId] = useState<number | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [createForm, setCreateForm] = useState({ patientId: "", date: "", slot: "", reason: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ date: "", start: "", end: "", reason: "" });
  const [tab, setTab] = useState<"buscar" | "agregar">("buscar");
  const [availSlots, setAvailSlots] = useState<AvailabilitySlot[]>([]);
  const [availStatus, setAvailStatus] = useState<"idle" | "loading" | "error">("idle");
  const [availMessage, setAvailMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

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
    setIsAdmin(session.role === "ADMIN");
    setToken(t);
    if (session.role === "ODONTOLOGO") {
      fetchProfile(t)
        .then((profile) => {
          if (profile.type === "dentist") setDentistId(profile.data.id);
        })
        .catch(() => router.replace("/login"));
    }
    loadAppointments(t);
    fetchPatients(t).then(setPatients).catch(() => setPatients([]));
  }, [router]);

  useEffect(() => {
    const initialTab = (searchParams.get("tab") as "buscar" | "agregar" | null) || "buscar";
    if (initialTab !== tab) setTab(initialTab);
  }, [searchParams, tab]);

  const changeTab = (next: "buscar" | "agregar") => {
    setTab(next);
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("tab", next);
    router.replace(`/turnos/doctor?${params.toString()}`);
  };

  useEffect(() => {
    const loadAvail = async () => {
      if (!token || !dentistId || !createForm.date || tab !== "agregar") return;
      setAvailStatus("loading");
      setAvailMessage("");
      try {
        const res = await fetchAvailability(token, dentistId, createForm.date);
        setAvailSlots(res.slots || []);
        setAvailStatus("idle");
        setAvailMessage("");
      } catch (err) {
        const e = err as Error;
        setAvailStatus("error");
        setAvailMessage(e.message || "No se pudo cargar disponibilidad");
        setAvailSlots([]);
      }
    };
    loadAvail();
  }, [token, dentistId, createForm.date, tab]);

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
      setMessage(e.message || "No se pudieron cargar los turnos");
    }
  };

  const updateStatusAction = async (id: number, newStatus: string) => {
    if (!token) return;
    setStatus("loading");
    setMessage("");
    try {
      await updateAppointmentStatus(token, id, newStatus);
      await loadAppointments(token);
      setStatus("idle");
      setMessage("Turno actualizado");
    } catch (err) {
      const e = err as Error;
      setStatus("error");
      setMessage(e.message || "No se pudo actualizar el turno");
    }
  };

  const createManual = async () => {
    if (!token || !dentistId || !createForm.patientId || !createForm.date || !createForm.slot) return;
    setStatus("creating");
    setMessage("");
    try {
      const slot = availSlots.find(
        (s) => s.startAt.slice(0, 10) === createForm.date && s.startAt.slice(11, 16) === createForm.slot
      );
      const startAt = slot ? slot.startAt : `${createForm.date}T${createForm.slot}:00`;
      const endAt = slot ? slot.endAt : computeEndTime(createForm.slot, createForm.date);
      await createAppointment(token, {
        dentistId,
        patientId: Number(createForm.patientId),
        startAt,
        endAt,
        reason: createForm.reason || undefined,
      });
      await loadAppointments(token);
      setCreateForm({ patientId: "", date: "", slot: "", reason: "" });
      setStatus("idle");
      setMessage("Turno creado");
    } catch (err) {
      const e = err as Error;
      setStatus("error");
      setMessage(e.message || "No se pudo crear el turno");
    }
  };

  const openReschedule = (appt: Appointment) => {
    setEditingId(appt.id);
    setEditForm({
      date: appt.startAt.slice(0, 10),
      start: appt.startAt.slice(11, 16),
      end: appt.endAt.slice(11, 16),
      reason: appt.reason || "",
    });
  };

  const reschedule = async (id: number) => {
    if (!token || !editForm.date || !editForm.start || !editForm.end) return;
    setStatus("rescheduling");
    setMessage("");
    try {
      const startAt = `${editForm.date}T${editForm.start}:00`;
      const endAt = `${editForm.date}T${editForm.end}:00`;
      await rescheduleAppointment(token, id, { startAt, endAt, reason: editForm.reason || undefined });
      await loadAppointments(token);
      setEditingId(null);
      setStatus("idle");
      setMessage("Turno reprogramado");
    } catch (err) {
      const e = err as Error;
      setStatus("error");
      setMessage(e.message || "No se pudo reprogramar el turno");
    }
  };

  const filtered = useMemo(() => {
    if (!filterDate) return appointments;
    return appointments.filter((a) => a.startAt.slice(0, 10) === filterDate);
  }, [appointments, filterDate]);

  const loadAvailability = async () => {
    if (!token || !dentistId || !createForm.date) return;
    setAvailStatus("loading");
    setAvailMessage("");
    try {
      const res = await fetchAvailability(token, dentistId, createForm.date);
      setAvailSlots(res.slots || []);
      setAvailStatus("idle");
      setAvailMessage("");
    } catch (err) {
      const e = err as Error;
      setAvailStatus("error");
      setAvailMessage(e.message || "No se pudo cargar disponibilidad");
    }
  };

  return (
    <section className="auth-hero" style={{ width: "min(820px, 100%)" }}>
      <div>
        <p className="eyebrow">Turnos</p>
        <h1 className="heading">Turnos</h1>
        <p className="subheading">Elige ver los turnos del dia o agregar uno nuevo.</p>
      </div>

      <div className="auth-card">
        {isAdmin && (
          <div className="status" style={{ marginBottom: 12 }}>
            Como administrador puedes visualizar todos los turnos. Para crear turnos necesitas un odontologo asignado.
          </div>
        )}
        {tab === "buscar" && (
          <>
            <div className="form" style={{ marginBottom: 12 }}>
              <label className="form-group" style={{ maxWidth: 220 }}>
                <span className="label">Fecha</span>
                <input className="input" type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
              </label>
            </div>

            {status === "loading" && <p className="muted">Cargando...</p>}
            {message && <div className={`status ${status === "error" ? "error" : "success"}`}>{message}</div>}
            {filtered.length === 0 && status === "idle" && <p className="muted">No hay turnos para esta fecha.</p>}

            {filtered.length > 0 && (
              <div className="grid" style={{ gap: 12 }}>
                {filtered.map((appt) => (
                  <div key={appt.id} className="menu-item" style={{ background: "#f7f9ff", color: "#0b1d3a" }}>
                    <div style={{ display: "grid", gap: 4, flex: 1 }}>
                      <span className="label">{formatDate(appt.startAt)}</span>
                      <span className="muted">
                        {formatTime(appt.startAt)} - {formatTime(appt.endAt)}
                      </span>
                      <span className="muted">Paciente: {appt.patient?.fullName || `ID ${appt.patientId}`}</span>
                      <span className="muted">Estado: {STATUS_LABEL[appt.status] || appt.status}</span>
                      {appt.reason && <span className="muted">Motivo: {appt.reason}</span>}
                    </div>
                    <div style={{ display: "grid", gap: 6 }}>
                      {appt.status !== "CONFIRMADO" && appt.status !== "CANCELADO" && (
                        <button
                          className="btn btn-primary"
                          style={{ padding: "8px 12px" }}
                          type="button"
                          onClick={() => updateStatusAction(appt.id, "CONFIRMADO")}
                          disabled={status === "loading" || status === "rescheduling"}
                        >
                          Confirmar
                        </button>
                      )}
                      {appt.status !== "CANCELADO" && (
                        <button
                          className="btn"
                          style={{ padding: "8px 12px", background: "#fff", color: "#c32031", borderColor: "#f6d4d8" }}
                          type="button"
                          onClick={() => updateStatusAction(appt.id, "CANCELADO")}
                          disabled={status === "loading" || status === "rescheduling"}
                        >
                          Cancelar
                        </button>
                      )}
                      {appt.status !== "CANCELADO" && (
                        <div style={{ display: "grid", gap: 4 }}>
                          <button
                            className="btn"
                            style={{ padding: "8px 12px", background: "#e8f6ec", color: "#157347", borderColor: "#d0ebd8" }}
                            type="button"
                            onClick={() => updateStatusAction(appt.id, "ASISTIO")}
                            disabled={status === "loading" || status === "rescheduling"}
                          >
                            Marcar asistio
                          </button>
                          <button
                            className="btn"
                            style={{ padding: "8px 12px", background: "#fff7e6", color: "#b76e00", borderColor: "#ffe5b4" }}
                            type="button"
                            onClick={() => updateStatusAction(appt.id, "NO_ASISTIO")}
                            disabled={status === "loading" || status === "rescheduling"}
                          >
                            Marcar no asistio
                          </button>
                        </div>
                      )}
                      <button
                        className="btn ghost"
                        type="button"
                        onClick={() => (editingId === appt.id ? setEditingId(null) : openReschedule(appt))}
                        disabled={status === "rescheduling"}
                      >
                        {editingId === appt.id ? "Cerrar" : "Reagendar"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "agregar" && (
          <div className="form" style={{ gap: 12 }}>
            <p className="label" style={{ marginBottom: 6 }}>
              Agregar turno
            </p>
            <label className="form-group">
              <span className="label">Paciente</span>
              <select
                className="input"
                value={createForm.patientId}
                onChange={(e) => setCreateForm((f) => ({ ...f, patientId: e.target.value }))}
                disabled={!patients.length}
              >
                <option value="">Selecciona un paciente</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} {p.email ? `- ${p.email}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-group">
              <span className="label">Fecha</span>
              <input
                className="input"
                type="date"
                value={createForm.date}
                onChange={(e) => {
                  const value = e.target.value;
                  setCreateForm((f) => ({
                    ...f,
                    date: value,
                    slot: "",
                  }));
                  setAvailSlots([]);
                  setAvailMessage("");
                }}
              />
            </label>
            <label className="form-group">
              <span className="label">Horario</span>
              <select
                className="input"
                value={createForm.slot}
                onChange={(e) => setCreateForm((f) => ({ ...f, slot: e.target.value }))}
                disabled={availStatus === "loading"}
              >
                <option value="">{availStatus === "loading" ? "Cargando..." : "Selecciona horario"}</option>
                {availSlots
                  .filter((s) => s.available !== false)
                  .map((slot) => (
                    <option key={slot.startAt} value={slot.startAt.slice(11, 16)}>
                      {formatTime(slot.startAt)} - {formatTime(slot.endAt)}
                    </option>
                  ))}
              </select>
            </label>
            <label className="form-group">
              <span className="label">Motivo (opcional)</span>
              <input
                className="input"
                value={createForm.reason}
                onChange={(e) => setCreateForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder="Control, urgencia, etc."
              />
            </label>
            <div>
              <button className="btn" type="button" onClick={loadAvailability} disabled={availStatus === "loading" || !createForm.date || !dentistId}>
                {availStatus === "loading" ? "Buscando..." : "Actualizar disponibilidad"}
              </button>
            </div>
            {availMessage && <div className={`status ${availStatus === "error" ? "error" : "success"}`}>{availMessage}</div>}
            <button
              className="btn btn-primary"
              type="button"
              onClick={createManual}
              disabled={
                status === "creating" ||
                !createForm.patientId ||
                !createForm.date ||
                !createForm.slot ||
                !dentistId ||
                availStatus === "loading"
              }
            >
              {status === "creating" ? "Creando..." : "Crear turno"}
            </button>
            {message && tab === "agregar" && <div className={`status ${status === "error" ? "error" : "success"}`}>{message}</div>}
          </div>
        )}

        {editingId && (
          <div className="form" style={{ marginTop: 12, background: "#f0f4ff", padding: 12, borderRadius: 12 }}>
            <p className="label">Reagendar turno</p>
            <div className="form" style={{ gap: 10 }}>
              <label className="form-group">
                <span className="label">Fecha</span>
                <input className="input" type="date" value={editForm.date} onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))} />
              </label>
              <label className="form-group">
                <span className="label">Desde</span>
                <input className="input" type="time" value={editForm.start} onChange={(e) => setEditForm((f) => ({ ...f, start: e.target.value }))} />
              </label>
              <label className="form-group">
                <span className="label">Hasta</span>
                <input className="input" type="time" value={editForm.end} onChange={(e) => setEditForm((f) => ({ ...f, end: e.target.value }))} />
              </label>
              <label className="form-group">
                <span className="label">Motivo (opcional)</span>
                <input className="input" value={editForm.reason} onChange={(e) => setEditForm((f) => ({ ...f, reason: e.target.value }))} />
              </label>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button className="btn" type="button" onClick={() => setEditingId(null)} disabled={status === "rescheduling"}>
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => reschedule(editingId)}
                disabled={status === "rescheduling" || !editForm.date || !editForm.start || !editForm.end}
              >
                {status === "rescheduling" ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
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
