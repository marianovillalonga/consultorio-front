"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Appointment,
  Patient,
  PaymentRecord,
  HistoryEntry,
  fetchPatient,
  fetchPatientAppointments,
  updatePatient,
} from "@/lib/api";
import { getSession } from "@/lib/session";

type OdontoTool = "red" | "blue" | "extract";

type DetailsForm = {
  fullName: string;
  email: string;
  dni: string;
  phone: string;
  obraSocial: string;
  obraSocialNumero: string;
  historialClinico: string;
  treatmentPlan: string;
  studies: string;
  balance: string;
};

type PaymentForm = {
  amount: string;
  method: string;
  note: string;
  serviceAmount: string;
};

type ToothMark = {
  surfaces: Record<string, "red" | "blue">;
  extraction?: boolean;
};

type TreatmentPlanItem = {
  id: string;
  piece: string;
  faces: string[];
  prestation: string;
  createdAt: string;
};

type TreatmentPlanData = {
  notes?: string;
  items?: TreatmentPlanItem[];
};

const FACE_OPTIONS = [
  { key: "mesial", label: "Mesial", code: "M" },
  { key: "distal", label: "Distal", code: "D" },
  { key: "oclusal", label: "Oclusal", code: "O" },
  { key: "vestibular", label: "Vestibular", code: "V" },
  { key: "lingual", label: "Lingual", code: "L" },
  { key: "palatino", label: "Palatino", code: "P" },
  { key: "incisal", label: "Incisal", code: "I" },
  { key: "gingival", label: "Gingival", code: "G" },
];

export default function PacienteDetallePage() {
  const router = useRouter();
  const params = useParams();
  const patientId = Number(params?.id);

  const [token, setToken] = useState("");
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "error">("loading");
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState<DetailsForm>({
    fullName: "",
    email: "",
    dni: "",
    phone: "",
    obraSocial: "",
    obraSocialNumero: "",
    historialClinico: "",
    treatmentPlan: "",
    studies: "",
    balance: "0",
  });
  const [paymentForm, setPaymentForm] = useState<PaymentForm>({ amount: "", method: "", note: "", serviceAmount: "" });
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "saving" | "error" | "success">("idle");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [editPayment, setEditPayment] = useState<{
    index: number | null;
    amount: string;
    method: string;
    note: string;
    date: string;
    serviceAmount: string;
  }>({
    index: null,
    amount: "",
    method: "",
    note: "",
    date: "",
    serviceAmount: "",
  });
  const [confirmState, setConfirmState] = useState<{ index: number | null }>({ index: null });
  const [odontogram, setOdontogram] = useState<Record<string, ToothMark>>({});
  const [panel, setPanel] = useState<
    "datos" | "historia" | "odontograma" | "plan" | "pagos" | "estudios" | "turnos"
  >("datos");
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [historyFilter, setHistoryFilter] = useState<string>("");
  const [historyModal, setHistoryModal] = useState<{ open: boolean; entry: HistoryEntry | null }>({
    open: false,
    entry: null,
  });
  const [tool, setTool] = useState<OdontoTool>("blue");
  const [treatmentPlanItems, setTreatmentPlanItems] = useState<TreatmentPlanItem[]>([]);
  const [planForm, setPlanForm] = useState<{ piece: string; faces: string[]; prestation: string }>({
    piece: "",
    faces: [],
    prestation: "",
  });
  const [editPlanId, setEditPlanId] = useState<string | null>(null);
  const [planError, setPlanError] = useState("");

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
    if (!patientId) {
      router.replace("/pacientes");
      return;
    }
    setToken(t);
    loadData(t, patientId);
  }, [router, patientId]);

  const loadData = async (tkn: string, id: number) => {
    setStatus("loading");
    setMessage("");
    try {
      const [p, appts] = await Promise.all([fetchPatient(tkn, id), fetchPatientAppointments(tkn, id)]);
      if (p) {
        setPatient(p);
        const autoBalance = computeBalance(p.payments || []);
        const parsedPlan = parseTreatmentPlanItems(p.treatmentPlanItems || p.treatmentPlan || "");
        setDetails({
          fullName: p.fullName || "",
          email: p.email || "",
          dni: p.dni || "",
          phone: p.phone || "",
          obraSocial: p.obraSocial || "",
          obraSocialNumero: p.obraSocialNumero || "",
          historialClinico: p.historialClinico || "",
          treatmentPlan: p.treatmentPlan || parsedPlan.notes || "",
          studies: p.studies || "",
          balance:
            p.balance !== null && p.balance !== undefined
              ? String(p.balance)
              : String(autoBalance),
        });
        setTreatmentPlanItems(parsedPlan.items);
        setOdontogram(parseOdontogram(p.odontograma));
        const parsedHistory = parseHistoryEntries(p.historyEntries);
        setHistoryEntries(parsedHistory);
        if (parsedHistory.length > 0) setHistoryFilter(parsedHistory[0].date);
      }
      setAppointments(appts);
      setStatus("idle");
    } catch (err) {
      const e = err as Error;
      setStatus("error");
      setMessage(e.message || "No se pudo cargar el paciente");
    }
  };

  const onChange = (key: keyof DetailsForm, value: string) => {
    setDetails((prev) => ({ ...prev, [key]: value }));
  };

  const saveDetails = async () => {
    if (!token || !patientId) return;
    setStatus("saving");
    setMessage("");
    try {
      const payload: Partial<Patient> = {
        fullName: details.fullName || undefined,
        email: details.email || undefined,
        dni: details.dni || undefined,
        phone: details.phone || undefined,
        obraSocial: details.obraSocial || undefined,
        obraSocialNumero: details.obraSocialNumero || undefined,
        historialClinico: details.historialClinico || undefined,
        treatmentPlan: details.treatmentPlan || undefined,
        treatmentPlanItems: serializeTreatmentPlanItems(treatmentPlanItems) || undefined,
        studies: details.studies || undefined,
        odontograma: JSON.stringify(odontogram),
        historyEntries: JSON.stringify(historyEntries),
        balance: details.balance ? Number(details.balance) : undefined,
      };
      const updated = await updatePatient(token, patientId, payload);
      setPatient(updated || null);
      setStatus("idle");
      setMessage("Datos guardados");
    } catch (err) {
      const e = err as Error;
      setStatus("error");
      setMessage(e.message || "No se pudo actualizar");
    }
  };

  const addPayment = async () => {
    if (!token || !patientId || !patient) return;
    const amount = Number(paymentForm.amount);
    const serviceAmount = Number(paymentForm.serviceAmount || 0);
    if (!paymentForm.method.trim()) {
      setPaymentStatus("error");
      setPaymentMessage("Metodo es obligatorio");
      return;
    }
    if (Number.isNaN(amount)) {
      setPaymentStatus("error");
      setPaymentMessage("Pago recibido es obligatorio");
      return;
    }
    const newPayment: PaymentRecord = {
      amount, // pago recibido
      method: paymentForm.method,
      note: paymentForm.note || undefined,
      date: new Date().toISOString(),
      serviceAmount: Number.isNaN(serviceAmount) ? 0 : serviceAmount,
    };
    const payments = [...(patient.payments || []), newPayment];
    const newBalance = computeBalance(payments);

    setPaymentStatus("saving");
    setPaymentMessage("");
    try {
      const updated = await updatePatient(token, patientId, { payments, balance: newBalance });
      setPatient(updated ? { ...updated, payments } : { ...(patient as Patient), payments });
      setDetails((prev) => ({ ...prev, balance: String(newBalance) }));
      setPaymentForm({ amount: "", method: "", note: "", serviceAmount: "" });
      setPaymentStatus("success");
      setPaymentMessage("Pago agregado");
    } catch (err) {
      const e = err as Error;
      setPaymentStatus("error");
      setPaymentMessage(e.message || "No se pudo registrar el pago");
  }
};

const startEditPayment = (p: PaymentRecord, index: number) => {
  setEditPayment({
    index,
    amount: String(p.amount ?? ""),
    method: p.method || "",
    note: p.note || "",
    date: p.date ? p.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
    serviceAmount: p.serviceAmount !== undefined ? String(p.serviceAmount) : "",
  });
  setPaymentMessage("");
  setPaymentStatus("idle");
};

const cancelEditPayment = () => {
  setEditPayment({ index: null, amount: "", method: "", note: "", date: "", serviceAmount: "" });
};

  const saveEditPayment = async () => {
    if (editPayment.index === null || !patient || !token) return;
    const amount = Number(editPayment.amount);
    const serviceAmount = Number(editPayment.serviceAmount || 0);
    if (!amount || !editPayment.method.trim()) {
    setPaymentStatus("error");
    setPaymentMessage("Pago recibido y metodo son obligatorios");
    return;
  }
  const payments = [...(patient.payments || [])];
  const original = payments[editPayment.index];
  if (!original) return;
  payments[editPayment.index] = {
    ...original,
    amount,
    method: editPayment.method,
    note: editPayment.note || undefined,
    date: editPayment.date ? new Date(editPayment.date).toISOString() : original.date,
    serviceAmount: Number.isNaN(serviceAmount) ? 0 : serviceAmount,
  };
  const newBalance = computeBalance(payments);
  setPaymentStatus("saving");
    setPaymentMessage("");
    try {
      const updated = await updatePatient(token, patientId, { payments, balance: newBalance });
      setPatient(updated ? { ...updated, payments } : { ...(patient as Patient), payments });
      setDetails((prev) => ({ ...prev, balance: String(newBalance) }));
      setPaymentStatus("success");
      setPaymentMessage("Pago actualizado");
      cancelEditPayment();
    } catch (err) {
    const e = err as Error;
    setPaymentStatus("error");
    setPaymentMessage(e.message || "No se pudo actualizar el pago");
  }
};

const deletePayment = async (index: number) => {
  if (!patient || !token) return;
  setConfirmState({ index });
};

  const debtLabel = useMemo(() => {
    const bal = Number(details.balance || 0);
    if (Number.isNaN(bal)) return "0.00";
    return bal.toFixed(2);
  }, [details.balance]);

  const totalPaid = useMemo(() => {
    if (!patient?.payments || patient.payments.length === 0) return 0;
    return patient.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [patient]);

  const lastPayment = useMemo(() => {
    if (!patient?.payments || patient.payments.length === 0) return null;
    const sorted = [...patient.payments].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    return sorted[0];
  }, [patient]);

  const historyDates = useMemo(() => {
    const dates = Array.from(new Set(historyEntries.map((h) => h.date)));
    return dates.sort((a, b) => b.localeCompare(a));
  }, [historyEntries]);

  const filteredHistory = useMemo(() => {
    if (!historyFilter) return historyEntries;
    return historyEntries.filter((h) => h.date === historyFilter);
  }, [historyEntries, historyFilter]);

  const formatMoney = (v: number) => `$${v.toFixed(2)}`;

  const openHistoryModal = (entry?: HistoryEntry) => {
    setHistoryModal({
      open: true,
      entry: entry || {
        id: `${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        title: "",
        notes: "",
      },
    });
  };

  const closeHistoryModal = () => setHistoryModal({ open: false, entry: null });

  const saveHistoryEntry = () => {
    if (!historyModal.entry) return;
    const entry = historyModal.entry;
    setHistoryEntries((prev) => {
      const exists = prev.some((e) => e.id === entry.id);
      const next = exists ? prev.map((e) => (e.id === entry.id ? entry : e)) : [...prev, entry];
      return next.sort((a, b) => b.date.localeCompare(a.date));
    });
    setHistoryFilter(entry.date);
    setHistoryModal({ open: false, entry: null });
  };

  const toggleSurface = (tooth: string, surface?: string) => {
    setOdontogram((prev) => {
      const current = prev[tooth] || { surfaces: {} };
      const next: ToothMark = {
        surfaces: { ...current.surfaces },
        extraction: current.extraction,
      };

      const isExtraction = tool === "extract" || surface === undefined;

      if (isExtraction) {
        next.extraction = !current.extraction;
        if (next.extraction) next.surfaces = {};
      } else if (surface) {
        // Painting a surface; unset extraction if it was marked.
        next.extraction = false;
        if (next.surfaces[surface] === tool) {
          delete next.surfaces[surface];
        } else {
          next.surfaces[surface] = tool;
        }
      }

      const shouldKeep = next.extraction || Object.keys(next.surfaces).length > 0;
      const updated = { ...prev };
      if (shouldKeep) updated[tooth] = next;
      else delete updated[tooth];
      return updated;
    });
  };

  const togglePlanFace = (face: string) => {
    setPlanForm((prev) => {
      const exists = prev.faces.includes(face);
      const nextFaces = exists ? prev.faces.filter((f) => f !== face) : [...prev.faces, face];
      return { ...prev, faces: nextFaces };
    });
    setPlanError("");
  };

  const addTreatmentPlanItem = () => {
    const piece = planForm.piece.trim();
    const prestation = planForm.prestation.trim();
    if (!piece || !prestation) {
      setPlanError("Pieza y prestacion son obligatorias.");
      return;
    }
    const orderedFaces = FACE_OPTIONS.map((f) => f.key).filter((key) => planForm.faces.includes(key));
    const nextItem: TreatmentPlanItem = {
      id: editPlanId || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      piece,
      faces: orderedFaces,
      prestation,
      createdAt: editPlanId ? getPlanCreatedAt(editPlanId, treatmentPlanItems) : formatMonthYear(new Date()),
    };
    setTreatmentPlanItems((prev) => {
      if (!editPlanId) return [...prev, nextItem];
      return prev.map((item) => (item.id === editPlanId ? nextItem : item));
    });
    setPlanForm({ piece: "", faces: [], prestation: "" });
    setEditPlanId(null);
    setPlanError("");
  };

  const startEditPlanItem = (item: TreatmentPlanItem) => {
    setPlanForm({
      piece: item.piece,
      faces: item.faces || [],
      prestation: item.prestation,
    });
    setEditPlanId(item.id);
    setPlanError("");
  };

  const cancelEditPlanItem = () => {
    setPlanForm({ piece: "", faces: [], prestation: "" });
    setEditPlanId(null);
    setPlanError("");
  };

  const removeTreatmentPlanItem = (id: string) => {
    setTreatmentPlanItems((prev) => prev.filter((item) => item.id !== id));
    if (editPlanId === id) cancelEditPlanItem();
  };

  const formatPlanFaces = (faces: string[]) => {
    if (!faces || faces.length === 0) return "-";
    return faces
      .map((face) => FACE_OPTIONS.find((opt) => opt.key === face)?.code)
      .filter(Boolean)
      .join("");
  };

  const clearOdontogram = () => setOdontogram({});

  const printInvoice = (payment: PaymentRecord, index: number) => {
    const win = window.open("", "_blank", "width=700,height=900");
    if (!win) return;
    const patientName = details.fullName || patient?.fullName || "Paciente";
    const balanceValue = Number(details.balance || 0);
    const paidLabel = formatMoney(Number(payment.amount || 0));
    const balanceLabel = formatMoney(balanceValue);
    const today = new Date().toLocaleDateString();
    const paymentDate = payment.date ? formatDate(payment.date) : today;
    const html = `
      <html>
        <head>
          <title>Factura / Recibo</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0b1d3a; }
            .card { border: 1px solid #dfe3ed; border-radius: 10px; padding: 18px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .title { font-size: 20px; font-weight: 700; margin-bottom: 12px; }
            .label { color: #5c647a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.4px; }
            .value { font-size: 14px; font-weight: 600; }
            .highlight { font-size: 16px; font-weight: 700; color: #1f6bff; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="title">Factura / Recibo #${index + 1}</div>
            <div class="row"><span class="label">Paciente</span><span class="value">${patientName}</span></div>
            <div class="row"><span class="label">Fecha pago</span><span class="value">${paymentDate}</span></div>
            <div class="row"><span class="label">Metodo</span><span class="value">${payment.method || "-"}</span></div>
            <div class="row"><span class="label">Importe servicio</span><span class="value">${formatMoney(Number((payment as any).serviceAmount || 0))}</span></div>
            <div class="row"><span class="label">Importe</span><span class="highlight">${paidLabel}</span></div>
            ${payment.note ? `<div class="row"><span class="label">Nota</span><span class="value">${payment.note}</span></div>` : ""}
            <hr />
            <div class="row"><span class="label">Saldo del paciente</span><span class="value">${balanceLabel}</span></div>
          </div>
          <script>
            setTimeout(() => { window.print(); }, 300);
          </script>
        </body>
      </html>
    `;
    win.document.write(html);
    win.document.close();
  };

  return (
    <section className="auth-hero" style={{ width: "min(1000px, 100%)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <p className="eyebrow">Paciente</p>
          <h1 className="heading">{details.fullName || "Detalle del paciente"}</h1>
          <p className="subheading">Datos completos, tratamiento, pagos y ficha clínica.</p>
        </div>
        <button className="btn ghost" type="button" onClick={() => router.push("/pacientes")}>
          Volver
        </button>
      </div>

      <div className="auth-card">
        {status === "loading" && <p className="muted">Cargando...</p>}
        {message && <div className={`status ${status === "error" ? "error" : "success"}`}>{message}</div>}

                    {patient && (
                      <>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
              <aside
                style={{
                  minWidth: 200,
                  maxWidth: 240,
                  background: "#e9f1ff",
                  border: "1px solid #c7d6ff",
                  borderRadius: 12,
                  padding: 12,
                  position: "sticky",
                  top: 12,
                  alignSelf: "flex-start",
                }}
              >
                <p className="label" style={{ marginBottom: 8, color: "#0b1d3a" }}>
                  Secciones
                </p>
                <div style={{ display: "grid", gap: 8 }}>
                  {[
                    { key: "datos", label: "Datos personales" },
                    { key: "historia", label: "Historia clínica" },
                    { key: "odontograma", label: "Odontograma" },
                    { key: "plan", label: "Plan de tratamiento" },
                    { key: "estudios", label: "Estudios / imágenes" },
                    { key: "pagos", label: "Pagos y saldo" },
                    { key: "turnos", label: "Turnos del paciente" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      className="btn"
                      type="button"
                      onClick={() => setPanel(item.key as typeof panel)}
                      style={{
                        justifyContent: "flex-start",
                        background: panel === item.key ? "#1f6bff" : "#ffffff",
                        color: panel === item.key ? "#fff" : "#0b1d3a",
                        borderColor: panel === item.key ? "#1f6bff" : "#d7e3ff",
                        boxShadow: panel === item.key ? "0 4px 12px rgba(31,107,255,0.18)" : "none",
                        fontWeight: 600,
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </aside>

              <div style={{ flex: 1, minWidth: 320, display: "grid", gap: 12 }}>
                {panel === "datos" && (
                  <div style={{ display: "grid", gap: 12 }}>
                    <section style={{ display: "grid", gap: 12 }}>
                      <p className="label">Datos personales</p>
                      <div className="form" style={{ gap: 10 }}>
                        <Field label="Nombre completo" value={details.fullName} onChange={(v) => onChange("fullName", v)} />
                        <Field label="Correo" value={details.email} onChange={(v) => onChange("email", v)} type="email" />
                        <Field label="DNI" value={details.dni} onChange={(v) => onChange("dni", v)} />
                        <Field label="Teléfono" value={details.phone} onChange={(v) => onChange("phone", v)} />
                        <Field label="Obra social" value={details.obraSocial} onChange={(v) => onChange("obraSocial", v)} />
                        <Field
                          label="Número de obra social"
                          value={details.obraSocialNumero}
                          onChange={(v) => onChange("obraSocialNumero", v)}
                        />
                      </div>
                    </section>

                    <section style={{ display: "grid", gap: 8 }}>
                      <p className="label">Notas de tratamiento</p>
                      <textarea
                        className="input"
                        style={{ minHeight: 120 }}
                        value={details.treatmentPlan}
                        onChange={(e) => onChange("treatmentPlan", e.target.value)}
                        placeholder="Notas generales, sesiones, indicaciones..."
                      />
                    </section>
                  </div>
                )}

                {panel === "historia" && (
                  <div style={{ display: "grid", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <p className="label">Historia clínica</p>
                      <button className="btn btn-primary" type="button" onClick={() => openHistoryModal()}>
                        Nueva entrada
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <span className="muted">Filtrar por día:</span>
                      <select
                        className="input"
                        style={{ maxWidth: 220 }}
                        value={historyFilter}
                        onChange={(e) => setHistoryFilter(e.target.value)}
                      >
                        <option value="">Todos</option>
                        {historyDates.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    {filteredHistory.length === 0 && <p className="muted">Sin registros para esta fecha.</p>}

                    {filteredHistory.length > 0 && (
                      <div className="grid" style={{ gap: 8 }}>
                        {filteredHistory.map((h) => (
                          <button
                            key={h.id}
                            className="menu-item"
                            style={{ background: "#eef3ff", color: "#0b1d3a", textAlign: "left" }}
                            onClick={() => openHistoryModal(h)}
                          >
                            <div style={{ display: "grid", gap: 4 }}>
                              <span className="label">
                                {h.date} — {h.title || "Sin título"}
                              </span>
                              <span className="muted">{h.notes.slice(0, 120) || "Sin notas"}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {panel === "odontograma" && (
                  <div style={{ display: "grid", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <p className="label">Odontograma</p>
                      <button className="btn ghost" type="button" onClick={clearOdontogram}>
                        Limpiar
                      </button>
                    </div>
                    <span className="muted">Selecciona una herramienta y haz click en una cara o en el diente para marcar extracción.</span>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <span className="muted">Herramientas:</span>
                      {[
                        { key: "red" as OdontoTool, label: "Rojo - trabajo hecho", color: "#d92d2d" },
                        { key: "blue" as OdontoTool, label: "Azul - planificado", color: "#1f6bff" },
                        { key: "extract" as OdontoTool, label: "E - Extraccion", color: "#0b1d3a" },
                      ].map((t) => (
                        <button
                          key={t.key}
                          className="btn"
                          type="button"
                          onClick={() => setTool(t.key)}
                          style={{
                            background: tool === t.key ? t.color : "#ffffff",
                            color: tool === t.key ? "#ffffff" : "#0b1d3a",
                            borderColor: tool === t.key ? t.color : "#d7e3ff",
                            boxShadow: tool === t.key ? "0 3px 10px rgba(0,0,0,0.12)" : "none",
                          }}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                    <div style={{ overflowX: "auto", paddingBottom: 6 }}>
                      <OdontogramGrid data={odontogram} onToggle={toggleSurface} />
                    </div>

                  </div>
                )}

                {panel === "plan" && (
                    <div
                      style={{
                        marginTop: 12,
                        display: "grid",
                        gap: 12,
                        padding: 12,
                        borderRadius: 12,
                        border: "1px solid #d7e3ff",
                        background: "#f7f9ff",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <p className="label" style={{ margin: 0 }}>Plan de tratamiento</p>
                        <span className="muted" style={{ fontSize: 12 }}>Piezas = PI, Caras = seleccion del paciente.</span>
                      </div>

                      <div style={{ display: "grid", gap: 10 }}>
                        <label className="form-group">
                          <span className="label">Pieza (PI)</span>
                          <select
                            className="input"
                            value={planForm.piece}
                            onChange={(e) => {
                              setPlanForm((prev) => ({ ...prev, piece: e.target.value }));
                              setPlanError("");
                            }}
                          >
                            <option value="">Selecciona una pieza</option>
                            {TEETH_LIST.map((tooth) => (
                              <option key={tooth} value={tooth}>
                                {tooth}
                              </option>
                            ))}
                          </select>
                        </label>

                        <div style={{ display: "grid", gap: 6 }}>
                          <span className="label">Caras</span>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
                            {FACE_OPTIONS.map((face) => (
                              <label key={face.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <input
                                  type="checkbox"
                                  checked={planForm.faces.includes(face.key)}
                                  onChange={() => togglePlanFace(face.key)}
                                />
                                <span className="muted">{face.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <label className="form-group">
                          <span className="label">Prestacion</span>
                          <input
                            className="input"
                            value={planForm.prestation}
                            onChange={(e) => {
                              setPlanForm((prev) => ({ ...prev, prestation: e.target.value }));
                              setPlanError("");
                            }}
                            placeholder="Ej: 02.09"
                          />
                        </label>

                        {planError && <span className="muted" style={{ color: "#b42318" }}>{planError}</span>}

                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                        {editPlanId && (
                          <button className="btn" type="button" onClick={cancelEditPlanItem}>
                            Cancelar
                          </button>
                        )}
                        <button className="btn btn-primary" type="button" onClick={addTreatmentPlanItem}>
                          {editPlanId ? "Guardar cambios" : "Agregar"}
                        </button>
                      </div>
                      </div>

                      <div style={{ overflowX: "auto" }}>
                        {treatmentPlanItems.length === 0 ? (
                          <p className="muted">Sin prestaciones cargadas.</p>
                        ) : (
                          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
                            <thead>
                              <tr style={{ textAlign: "left", borderBottom: "1px solid #d7e3ff" }}>
                              <th style={{ padding: "8px 6px", fontSize: 12, color: "#0b1d3a" }}>PI</th>
                              <th style={{ padding: "8px 6px", fontSize: 12, color: "#0b1d3a" }}>Caras</th>
                              <th style={{ padding: "8px 6px", fontSize: 12, color: "#0b1d3a" }}>Prestacion</th>
                              <th style={{ padding: "8px 6px", fontSize: 12, color: "#0b1d3a" }}>Fecha</th>
                              <th style={{ padding: "8px 6px", fontSize: 12, color: "#0b1d3a" }}>Accion</th>
                            </tr>
                          </thead>
                          <tbody>
                            {treatmentPlanItems.map((item) => (
                              <tr key={item.id} style={{ borderBottom: "1px solid #e3e8f4" }}>
                                <td style={{ padding: "8px 6px", fontWeight: 600 }}>{item.piece}</td>
                                <td style={{ padding: "8px 6px" }}>{formatPlanFaces(item.faces)}</td>
                                <td style={{ padding: "8px 6px" }}>{item.prestation}</td>
                                <td style={{ padding: "8px 6px" }}>{item.createdAt}</td>
                                <td style={{ padding: "8px 6px" }}>
                                  <div style={{ display: "flex", gap: 8 }}>
                                    <button className="btn" type="button" onClick={() => startEditPlanItem(item)}>
                                      Modificar
                                    </button>
                                    <button
                                      className="btn"
                                      type="button"
                                      onClick={() => removeTreatmentPlanItem(item.id)}
                                      style={{ background: "#ffe6e6", color: "#b42318", borderColor: "#f5c2c7" }}
                                    >
                                      Quitar
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                )}


                {panel === "estudios" && (
                  <div style={{ display: "grid", gap: 8 }}>
                    <p className="label">Estudios / imágenes</p>
                    <textarea
                      className="input"
                      style={{ minHeight: 200 }}
                      value={details.studies}
                      onChange={(e) => onChange("studies", e.target.value)}
                      placeholder="Notas de estudios, links a radiografías, descripciones o resultados."
                    />
                    <p className="muted" style={{ fontSize: 13 }}>
                      Puedes pegar URLs de radiografías (Drive, PACS) o registrar hallazgos relevantes.
                    </p>
                  </div>
                )}

                {panel === "pagos" && (
                  <div style={{ display: "grid", gap: 8 }}>
                    <p className="label">Pagos y saldo</p>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "8px 10px",
                          borderRadius: 10,
                          background: Number(details.balance || 0) > 0 ? "#ffe6e6" : "#e6f4ec",
                          color: Number(details.balance || 0) > 0 ? "#b42318" : "#0f5132",
                          border: Number(details.balance || 0) > 0 ? "1px solid #f5c2c7" : "1px solid #c2e0cb",
                          fontWeight: 600,
                        }}
                      >
                        <span>{Number(details.balance || 0) > 0 ? "⚠️ Deuda pendiente:" : "💰 Saldo a favor:"}</span>
                        <span>${debtLabel}</span>
                      </div>
                    </div>
                    <span className="muted" style={{ fontSize: 12 }}>
                      Saldo = servicios cargados - pagos registrados.
                    </span>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: 10,
                        background: "#f6f8ff",
                        border: "1px solid #dce4ff",
                        borderRadius: 12,
                        padding: 12,
                      }}
                    >
                      <div style={{ display: "grid", gap: 4 }}>
                        <span className="muted" style={{ fontSize: 12 }}>
                          Total pagado
                        </span>
                        <span className="label" style={{ color: "#1b5c2d" }}>
                          💰 ${totalPaid.toFixed(2)}
                        </span>
                      </div>
                      <div style={{ display: "grid", gap: 4 }}>
                        <span className="muted" style={{ fontSize: 12 }}>
                          {Number(details.balance || 0) > 0 ? "Deuda pendiente" : "Saldo a favor"}
                        </span>
                        <span
                          className="label"
                          style={{
                            color: Number(details.balance || 0) > 0 ? "#b42318" : "#1b5c2d",
                          }}
                        >
                          {Number(details.balance || 0) > 0 ? "⚠️" : "💰"} ${debtLabel}
                        </span>
                      </div>
                      <div style={{ display: "grid", gap: 4 }}>
                        <span className="muted" style={{ fontSize: 12 }}>
                          Ultimo pago
                        </span>
                        {lastPayment ? (
                          <span className="label">
                            {formatDate(lastPayment.date)} - ${Number(lastPayment.amount || 0).toFixed(2)}
                          </span>
                        ) : (
                          <span className="muted">Sin pagos</span>
                        )}
                      </div>
                    </div>
                    <div className="form" style={{ gap: 10 }}>
                      <Field
                        label="Importe del servicio"
                        value={paymentForm.serviceAmount}
                        onChange={(v) => setPaymentForm((f) => ({ ...f, serviceAmount: v }))}
                        type="number"
                      />
                      <Field
                        label="Pago recibido"
                        value={paymentForm.amount}
                        onChange={(v) => setPaymentForm((f) => ({ ...f, amount: v }))}
                        type="number"
                      />
                      <Field
                        label="Metodo"
                        value={paymentForm.method}
                        onChange={(v) => setPaymentForm((f) => ({ ...f, method: v }))}
                        placeholder="Efectivo, tarjeta..."
                      />
                      <Field
                        label="Nota"
                        value={paymentForm.note}
                        onChange={(v) => setPaymentForm((f) => ({ ...f, note: v }))}
                        placeholder="Detalle opcional"
                      />
                    </div>
                    {paymentMessage && (
                      <div className={`status ${paymentStatus === "error" ? "error" : "success"}`}>{paymentMessage}</div>
                    )}
                    <button className="btn btn-primary" type="button" onClick={addPayment} disabled={paymentStatus === "saving"}>
                      {paymentStatus === "saving" ? "Guardando..." : "Registrar pago"}
                    </button>

                      <div style={{ marginTop: 8 }}>
                        <p className="label">Historial de pagos</p>
                        {(patient.payments && patient.payments.length > 0 && (
                          <div className="grid" style={{ gap: 8 }}>
                            {patient.payments.map((p, idx) => (
                              <div key={`${p.date}-${idx}`} className="menu-item" style={{ background: "#eef3ff", color: "#0b1d3a" }}>
                                <div style={{ display: "grid", gap: 2 }}>
                                  <span className="label">
                                    {formatDate(p.date)} - Pago: ${Number(p.amount).toFixed(2)}
                                  </span>
                                  <span className="muted">
                                    Servicio: ${Number((p as any).serviceAmount || 0).toFixed(2)} · Metodo: {p.method}
                                  </span>
                                  {p.note && <span className="muted">{p.note}</span>}
                                </div>
                                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                                  <button className="btn" type="button" onClick={() => printInvoice(p, idx)}>
                                    🧾 Generar factura
                                  </button>
                                  <button className="btn btn-primary" type="button" onClick={() => startEditPayment(p, idx)}>
                                    ✏️ Editar
                                  </button>
                                  <button className="btn" type="button" onClick={() => deletePayment(idx)} style={{ background: "#ffe6e6", color: "#b42318", borderColor: "#f5c2c7" }}>
                                    🗑️ Eliminar
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )) || <p className="muted">Sin pagos registrados.</p>}

                      </div>
                    </div>
                  )}

                {panel === "turnos" && (
                  <div style={{ display: "grid", gap: 10 }}>
                    <p className="label">Turnos del paciente</p>
                    {appointments.length === 0 && <p className="muted">Sin turnos registrados.</p>}
                    {appointments.length > 0 && (
                      <div className="grid" style={{ gap: 10 }}>
                        {appointments.map((a) => (
                          <div key={a.id} className="menu-item" style={{ background: "#f7f9ff", color: "#0b1d3a" }}>
                            <div style={{ display: "grid", gap: 2 }}>
                              <span className="label">
                                {formatDate(a.startAt)} {formatTime(a.startAt)} - {formatTime(a.endAt)}
                              </span>
                              <span className="muted">Estado: {a.status}</span>
                              <span className="muted">Dentista: {a.dentist?.user?.email || "N/A"}</span>
                              {a.reason && <span className="muted">Motivo: {a.reason}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  <button className="btn" type="button" onClick={() => router.push("/pacientes")}>
                    Cancelar
                  </button>
                  <button className="btn btn-primary" type="button" onClick={saveDetails} disabled={status === "saving"}>
                    {status === "saving" ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {historyModal.open && historyModal.entry && (
        <div className="modal-backdrop" onClick={closeHistoryModal}>
          <div className="modal-card" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p className="eyebrow">Historia clínica</p>
                <h2 className="heading" style={{ fontSize: 22, color: "#0b1d3a" }}>
                  {historyModal.entry.title || "Nueva entrada"}
                </h2>
              </div>
              <button className="btn ghost" type="button" onClick={closeHistoryModal}>
                Cerrar
              </button>
            </div>

            <div className="form" style={{ marginTop: 12 }}>
              <label className="form-group">
                <span className="label">Fecha</span>
                <input
                  className="input"
                  type="date"
                  value={historyModal.entry.date}
                  onChange={(e) =>
                    setHistoryModal(m =>
                      m.entry
                        ? { ...m, entry: { ...m.entry, date: e.target.value } }
                        : m
                    )
                  }
                />
              </label>
              <label className="form-group">
                <span className="label">Título</span>
                <input
                  className="input"
                  value={historyModal.entry.title}
                  onChange={(e) =>
                    setHistoryModal(m =>
                      m.entry
                        ? { ...m, entry: { ...m.entry, title: e.target.value } }
                        : m 
                    )
                  }
                  placeholder="Ej: Control de caries, profilaxis, etc."
                />
              </label>
              <label className="form-group">
                <span className="label">Notas</span>
                <textarea
                  className="input"
                  style={{ minHeight: 140 }}
                  value={historyModal.entry.notes}
                  onChange={(e) =>
                    setHistoryModal(m =>
                      m.entry
                        ? { ...m, entry: { ...m.entry, notes: e.target.value } }
                        : m
                    )
                  }
                  placeholder="Procedimientos realizados, hallazgos, indicaciones..."
                />
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn" type="button" onClick={closeHistoryModal}>
                Cancelar
              </button>
              <button className="btn btn-primary" type="button" onClick={saveHistoryEntry}>
                Guardar entrada
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmState.index !== null && (
        <ConfirmModal
          onCancel={() => setConfirmState({ index: null })}
          onConfirm={async () => {
            const idx = confirmState.index;
            if (idx === null || !patient || !token) return;
            const payments = [...(patient.payments || [])];
            payments.splice(idx, 1);
            const newBalance = computeBalance(payments);
            setPaymentStatus("saving");
            setPaymentMessage("");
            try {
              const updated = await updatePatient(token, patientId, { payments, balance: newBalance });
              setPatient(updated ? { ...updated, payments } : { ...(patient as Patient), payments });
              setDetails((prev) => ({ ...prev, balance: String(newBalance) }));
              setPaymentStatus("success");
              setPaymentMessage("Pago eliminado");
              if (editPayment.index === idx) cancelEditPayment();
            } catch (err) {
              const e = err as Error;
              setPaymentStatus("error");
              setPaymentMessage(e.message || "No se pudo eliminar el pago");
            } finally {
              setConfirmState({ index: null });
            }
          }}
        />
      )}

      {editPayment.index !== null && (
        <EditPaymentModal
          editPayment={{
            amount: editPayment.amount,
            method: editPayment.method,
            note: editPayment.note,
            date: editPayment.date,
            serviceAmount: editPayment.serviceAmount,
          }}
          saving={paymentStatus === "saving"}
          onChange={(field, value) => setEditPayment((f) => ({ ...f, [field]: value }))}
          onCancel={cancelEditPayment}
          onSave={saveEditPayment}
        />
      )}
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

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString();
}

type OdontogramGridProps = {
  data: Record<string, ToothMark>;
  onToggle: (tooth: string, surface?: string) => void;
};

const TEETH_ROWS = [
  ["18", "17", "16", "15", "14", "13", "12", "11", "21", "22", "23", "24", "25", "26", "27", "28"],
  ["48", "47", "46", "45", "44", "43", "42", "41", "31", "32", "33", "34", "35", "36", "37", "38"],
  ["55", "54", "53", "52", "51", "61", "62", "63", "64", "65"],
  ["85", "84", "83", "82", "81", "71", "72", "73", "74", "75"],
];

const TEETH_LIST = TEETH_ROWS.flat();

function computeBalance(payments: PaymentRecord[]) {
  if (!payments || payments.length === 0) return 0;
  return payments.reduce((acc, p) => {
    const svc = Number((p as any).serviceAmount || 0) || 0;
    const paid = Number(p.amount || 0) || 0;
    return acc + (svc - paid);
  }, 0);
}

function OdontogramGrid({ data, onToggle }: OdontogramGridProps) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {TEETH_ROWS.map((row, idx) => (
        <div
          key={idx}
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            justifyContent: "center",
            marginBottom: idx === 1 ? 12 : idx === 2 ? 8 : 0,
          }}
        >
          {row.map((tooth) => (
            <Tooth key={tooth} id={tooth} mark={data[tooth]} onToggle={onToggle} />
          ))}
        </div>
      ))}
      <div className="muted" style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", fontSize: 12 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 14, height: 14, border: "1px solid #9aa0b5", background: "#d92d2d" }} />
          Rojo: realizado
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 14, height: 14, border: "1px solid #9aa0b5", background: "#1f6bff" }} />
          Azul: planificado
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#d92d2d", fontWeight: 700 }}>E: extraccion</span>
      </div>
    </div>
  );
}

function Tooth({
  id,
  mark,
  onToggle,
}: {
  id: string;
  mark?: ToothMark;
  onToggle: (tooth: string, surface?: string) => void;
}) {
  const colorFor = (surface: string) => {
    if (!mark) return "#fff";
    const c = mark.surfaces[surface];
    return c === "red" ? "#d92d2d" : c === "blue" ? "#1f6bff" : "#fff";
  };

  const cellStyle = (surface: string) => ({
    width: 16,
    height: 16,
    border: "1px solid #7f8696",
    background: colorFor(surface),
    cursor: "pointer",
    boxSizing: "border-box" as const,
    transition: "background 120ms ease, border-color 120ms ease",
  });

  return (
    <div style={{ display: "grid", gap: 4, alignItems: "center", justifyItems: "center", padding: "4px 6px", borderRadius: 6 }}>
      <span className="muted" style={{ fontSize: 12, color: "#394060" }}>
        {id}
      </span>
      <div
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "repeat(3, 16px)",
          gridTemplateRows: "repeat(3, 16px)",
          gap: 1,
          padding: 2,
          borderRadius: 4,
          border: "1px solid #c3c7d3",
          background: "#fff",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <div />
        <div style={cellStyle("mesial")} title="Mesial" onClick={() => onToggle(id, "mesial")} />
        <div />

        <div style={cellStyle("vestibular")} title="Vestibular/Bucal" onClick={() => onToggle(id, "vestibular")} />
        <div style={cellStyle("oclusal")} title="Oclusal/Incisal" onClick={() => onToggle(id, "oclusal")} />
        <div style={cellStyle("lingual")} title="Lingual/Palatino" onClick={() => onToggle(id, "lingual")} />

        <div />
        <div style={cellStyle("distal")} title="Distal" onClick={() => onToggle(id, "distal")} />
        <div />

        {mark?.extraction && (
          <div
            style={{
              position: "absolute",
              inset: -2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              color: "#d92d2d",
              fontSize: 18,
              pointerEvents: "none",
              background: "rgba(255,255,255,0.6)",
              borderRadius: 4,
            }}
          >
            E
          </div>
        )}
      </div>
    </div>
  );
}

function parseOdontogram(raw?: string | null): Record<string, ToothMark> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, any>;
    if (parsed && typeof parsed === "object") {
      const result: Record<string, ToothMark> = {};
      Object.entries(parsed).forEach(([tooth, value]) => {
        if (Array.isArray(value)) {
          // Old format: list of painted faces -> assume red (realizado).
          const surfaces: Record<string, "red" | "blue"> = {};
          value.forEach((v) => {
            if (typeof v === "string") surfaces[v] = "red";
          });
          if (Object.keys(surfaces).length > 0) result[tooth] = { surfaces };
        } else if (value && typeof value === "object") {
          const mark: ToothMark = { surfaces: {} };
          if (value.surfaces && typeof value.surfaces === "object") {
            Object.entries(value.surfaces).forEach(([k, v]) => {
              if (v === "red" || v === "blue") {
                mark.surfaces[k] = v;
              } else if (v === true) {
                mark.surfaces[k] = "red";
              }
            });
          }
          if (value.extraction) mark.extraction = true;
          if (mark.extraction || Object.keys(mark.surfaces).length > 0) result[tooth] = mark;
        }
      });
      return result;
    }
  } catch {
    return {};
  }
  return {};
}

function parseTreatmentPlanItems(raw?: string | null): { notes?: string; items: TreatmentPlanItem[] } {
  if (!raw) return { notes: "", items: [] };
  try {
    const parsed = JSON.parse(raw) as TreatmentPlanData | TreatmentPlanItem[] | { notes?: string; items?: TreatmentPlanItem[] };
    if (Array.isArray(parsed)) {
      return { notes: "", items: normalizeTreatmentPlanItems(parsed) };
    }
    if (parsed && typeof parsed === "object") {
      const notes = typeof (parsed as TreatmentPlanData).notes === "string" ? (parsed as TreatmentPlanData).notes : "";
      const items = Array.isArray((parsed as TreatmentPlanData).items) ? (parsed as TreatmentPlanData).items : [];
      return { notes, items: normalizeTreatmentPlanItems(items) };
    }
  } catch {
    return { notes: raw, items: [] };
  }
  return { notes: raw, items: [] };
}

function serializeTreatmentPlanItems(items: TreatmentPlanItem[]) {
  if (!items || items.length === 0) return "";
  return JSON.stringify(items);
}

function normalizeTreatmentPlanItems(
  rawItems?: Array<Partial<TreatmentPlanItem> & { prestacion?: string; pi?: string }>
): TreatmentPlanItem[] {
  return (rawItems || [])
    .filter((item) => item && typeof item === "object")
    .map((item, idx) => {
        const faces = Array.isArray(item.faces) ? item.faces.filter((f) => typeof f === "string") : [];
        return {
          id: typeof item.id === "string" ? item.id : `${Date.now()}-${idx}`,
          piece: String(item.piece || item.pi || ""),
          faces,
          prestation: String(item.prestation || (item as any).prestacion || ""),
          createdAt:
            typeof (item as any).createdAt === "string" && (item as any).createdAt
              ? (item as any).createdAt
              : formatMonthYear(new Date()),
        };
      })
      .filter((item) => item.piece || item.prestation);
}

function formatMonthYear(date: Date) {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${year}`;
}

function getPlanCreatedAt(id: string, items: TreatmentPlanItem[]) {
  const found = items.find((item) => item.id === id);
  return found?.createdAt || formatMonthYear(new Date());
}

function parseHistoryEntries(raw?: string | HistoryEntry[] | null): HistoryEntry[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw) as HistoryEntry[];
    if (Array.isArray(parsed)) return parsed;
  } catch {
    return [];
  }
  return [];
}

function ConfirmModal({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="modal-backdrop" style={{ background: "rgba(12,18,46,0.55)" }}>
      <div
        className="modal-card"
        style={{
          maxWidth: 420,
          padding: 20,
          borderRadius: 14,
          border: "1px solid #e3e8f4",
          boxShadow: "0 18px 38px rgba(15,23,42,0.28)",
        }}
      >
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>🗑️</span>
            <div>
              <p className="label" style={{ margin: 0 }}>
                Eliminar pago
              </p>
              <p className="muted" style={{ margin: 0 }}>
                Esta acción actualizará el saldo del paciente.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button className="btn" type="button" onClick={onCancel}>
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              style={{ background: "#d92d2d", borderColor: "#d92d2d" }}
              type="button"
              onClick={onConfirm}
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditPaymentModal({
  editPayment,
  onChange,
  onCancel,
  onSave,
  saving,
}: {
  editPayment: {
    amount: string;
    method: string;
    note: string;
    date: string;
    serviceAmount: string;
  };
  onChange: (field: keyof typeof editPayment, value: string) => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="modal-backdrop" style={{ background: "rgba(12,18,46,0.55)" }} onClick={onCancel}>
      <div
        className="modal-card"
        style={{
          maxWidth: 480,
          padding: 20,
          borderRadius: 14,
          border: "1px solid #e3e8f4",
          boxShadow: "0 18px 38px rgba(15,23,42,0.28)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <p className="label" style={{ margin: 0 }}>
            ✏️ Editar pago
          </p>
          <button className="btn ghost" type="button" onClick={onCancel}>
            Cerrar
          </button>
        </div>
        <div className="form" style={{ gap: 10 }}>
          <Field
            label="Importe del servicio"
            value={editPayment.serviceAmount}
            onChange={(v) => onChange("serviceAmount", v)}
            type="number"
          />
          <Field label="Pago recibido" value={editPayment.amount} onChange={(v) => onChange("amount", v)} type="number" />
          <Field label="Metodo" value={editPayment.method} onChange={(v) => onChange("method", v)} />
          <Field label="Nota" value={editPayment.note} onChange={(v) => onChange("note", v)} />
          <label className="form-group">
            <span className="label">Fecha</span>
            <input className="input" type="date" value={editPayment.date} onChange={(e) => onChange("date", e.target.value)} />
          </label>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-end" }}>
          <button className="btn" type="button" onClick={onCancel}>
            Cancelar
          </button>
          <button className="btn btn-primary" type="button" onClick={onSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
