"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ObraSocial, createObraSocial, deleteObraSocial, fetchObrasSociales, updateObraSocial } from "@/lib/api";
import { getSession } from "@/lib/session";

type FormState = {
  numeroObraSocial: string;
  nombre: string;
  descripcion: string;
  telefono: string;
  email: string;
  notas: string;
  aranceles: {
    codigo: string;
    descripcion: string;
    vigenciaDesde: string;
    arancelTotal: string;
    copago: string;
  }[];
  normasTrabajoFileName: string;
  normasTrabajoFileData: string;
  normasFacturacionFileName: string;
  normasFacturacionFileData: string;
};

export default function ObrasSocialesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [obras, setObras] = useState<ObraSocial[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "error">("loading");
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<"ver" | "agregar">("ver");
  const [form, setForm] = useState<FormState>({
    numeroObraSocial: "",
    nombre: "",
    descripcion: "",
    telefono: "",
    email: "",
    notas: "",
    aranceles: [],
    normasTrabajoFileName: "",
    normasTrabajoFileData: "",
    normasFacturacionFileName: "",
    normasFacturacionFileData: "",
  });
  const [editId, setEditId] = useState<number | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session.token) {
      router.replace("/login");
      return;
    }
    if (session.role !== "ODONTOLOGO" && session.role !== "ADMIN") {
      router.replace("/dashboard");
      return;
    }
    setToken(session.token);
  }, [router]);

  useEffect(() => {
    const initialTab = (searchParams.get("tab") as "ver" | "agregar" | null) || "ver";
    if (initialTab !== tab) setTab(initialTab);
  }, [searchParams, tab]);

  useEffect(() => {
    if (!token) return;
    loadObras(token);
  }, [token]);

  const loadObras = async (tkn: string) => {
    setStatus("loading");
    setMessage("");
    try {
      const list = await fetchObrasSociales(tkn);
      setObras(list);
      setStatus("idle");
    } catch (err) {
      const e = err as Error;
      setStatus("error");
      setMessage(e.message || "No se pudieron obtener las obras sociales");
    }
  };

  const resetForm = () =>
    setForm({
      numeroObraSocial: "",
      nombre: "",
      descripcion: "",
      telefono: "",
      email: "",
      notas: "",
      aranceles: [],
      normasTrabajoFileName: "",
      normasTrabajoFileData: "",
      normasFacturacionFileName: "",
      normasFacturacionFileData: "",
    });

  const handleCreate = async () => {
    if (!token) return;
    if (!form.nombre.trim()) {
      setMessage("Nombre es obligatorio");
      setStatus("error");
      return;
    }
    setStatus("saving");
    setMessage("");
    try {
      await createObraSocial(token, {
        nombre: form.nombre.trim(),
        numeroObraSocial: form.numeroObraSocial || undefined,
        descripcion: form.descripcion || undefined,
        telefono: form.telefono || undefined,
        email: form.email || undefined,
        notas: form.notas || undefined,
        aranceles: form.aranceles
          .filter((a) => a.codigo && a.descripcion)
          .map((a) => ({
            codigo: a.codigo,
            descripcion: a.descripcion,
            vigenciaDesde: a.vigenciaDesde || undefined,
            arancelTotal: a.arancelTotal ? Number(a.arancelTotal) : undefined,
            copago: a.copago ? Number(a.copago) : undefined,
          })),
        normasTrabajoFileName: form.normasTrabajoFileName || undefined,
        normasTrabajoFileData: form.normasTrabajoFileData || undefined,
        normasFacturacionFileName: form.normasFacturacionFileName || undefined,
        normasFacturacionFileData: form.normasFacturacionFileData || undefined,
      });
      await loadObras(token);
      resetForm();
      setStatus("idle");
      setMessage("Obra social creada");
      setTab("ver");
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      params.set("tab", "ver");
      router.replace(`/obras-sociales?${params.toString()}`);
    } catch (err) {
      const e = err as Error;
      setStatus("error");
      setMessage(e.message || "No se pudo crear la obra social");
    }
  };

  const handleUpdate = async () => {
    if (!token || editId === null) return;
    setStatus("saving");
    setMessage("");
    try {
      await updateObraSocial(token, editId, {
        nombre: form.nombre.trim() || undefined,
        numeroObraSocial: form.numeroObraSocial || undefined,
        descripcion: form.descripcion || undefined,
        telefono: form.telefono || undefined,
        email: form.email || undefined,
        notas: form.notas || undefined,
        aranceles: form.aranceles
          .filter((a) => a.codigo && a.descripcion)
          .map((a) => ({
            codigo: a.codigo,
            descripcion: a.descripcion,
            vigenciaDesde: a.vigenciaDesde || undefined,
            arancelTotal: a.arancelTotal ? Number(a.arancelTotal) : undefined,
            copago: a.copago ? Number(a.copago) : undefined,
          })),
        normasTrabajoFileName: form.normasTrabajoFileName || undefined,
        normasTrabajoFileData: form.normasTrabajoFileData || undefined,
        normasFacturacionFileName: form.normasFacturacionFileName || undefined,
        normasFacturacionFileData: form.normasFacturacionFileData || undefined,
      });
      await loadObras(token);
      resetForm();
      setEditId(null);
      setStatus("idle");
      setMessage("Obra social actualizada");
    } catch (err) {
      const e = err as Error;
      setStatus("error");
      setMessage(e.message || "No se pudo actualizar la obra social");
    }
  };

  const startEdit = (obra: ObraSocial) => {
    setEditId(obra.id);
    setForm({
      numeroObraSocial: obra.numeroObraSocial || "",
      nombre: obra.nombre || "",
      descripcion: obra.descripcion || "",
      telefono: obra.telefono || "",
      email: obra.email || "",
      notas: obra.notas || "",
      aranceles:
        obra.aranceles?.map((a) => ({
          codigo: a.codigo || "",
          descripcion: a.descripcion || "",
          vigenciaDesde: a.vigenciaDesde || "",
          arancelTotal: a.arancelTotal !== undefined && a.arancelTotal !== null ? String(a.arancelTotal) : "",
          copago: a.copago !== undefined && a.copago !== null ? String(a.copago) : "",
        })) || [],
      normasTrabajoFileName: obra.normasTrabajoFileName || "",
      normasTrabajoFileData: obra.normasTrabajoFileData || "",
      normasFacturacionFileName: obra.normasFacturacionFileName || "",
      normasFacturacionFileData: obra.normasFacturacionFileData || "",
    });
    setTab("agregar");
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("tab", "agregar");
    router.replace(`/obras-sociales?${params.toString()}`);
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    const confirmed = window.confirm("¿Eliminar obra social?");
    if (!confirmed) return;
    setStatus("saving");
    setMessage("");
    try {
      await deleteObraSocial(token, id);
      await loadObras(token);
      setStatus("idle");
      setMessage("Obra social eliminada");
    } catch (err) {
      const e = err as Error;
      setStatus("error");
      setMessage(e.message || "No se pudo eliminar la obra social");
    }
  };

  const [search, setSearch] = useState("");
  const visible = useMemo(() => {
    if (!search.trim()) return obras;
    const term = search.toLowerCase();
    return obras.filter(
      (o) =>
        o.nombre.toLowerCase().includes(term) ||
        (o.descripcion || "").toLowerCase().includes(term) ||
        (o.numeroObraSocial || "").toLowerCase().includes(term)
    );
  }, [obras, search]);

  const emptyArancel = useMemo(
    () => ({ codigo: "", descripcion: "", vigenciaDesde: "", arancelTotal: "", copago: "" }),
    []
  );

  const [arancelModal, setArancelModal] = useState<{
    open: boolean;
    index: number | null;
    data: { codigo: string; descripcion: string; vigenciaDesde: string; arancelTotal: string; copago: string };
  }>({ open: false, index: null, data: { codigo: "", descripcion: "", vigenciaDesde: "", arancelTotal: "", copago: "" } });
  const [detailTab, setDetailTab] = useState<"aranceles" | "normas">("aranceles");

  const openNewArancel = () => setArancelModal({ open: true, index: null, data: { ...emptyArancel } });

  const openEditArancel = (index: number) => {
    const row = form.aranceles[index] || emptyArancel;
    setArancelModal({ open: true, index, data: { ...row } });
  };

  const saveArancel = () => {
    const d = arancelModal.data;
    if (!d.codigo.trim() || !d.descripcion.trim()) {
      setMessage("Código y descripción son obligatorios");
      setStatus("error");
      return;
    }
    setForm((f) => {
      const next = [...f.aranceles];
      if (arancelModal.index === null) next.push(d);
      else next[arancelModal.index] = d;
      return { ...f, aranceles: next };
    });
    setArancelModal({ open: false, index: null, data: { ...emptyArancel } });
    setMessage("");
    setStatus("idle");
  };

  const removeArancel = (index: number) => {
    setForm((f) => {
      const next = f.aranceles.filter((_, i) => i !== index);
      return { ...f, aranceles: next };
    });
  };

  const handleFile = (file: File, type: "trabajo" | "facturacion") => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result);
      setForm((f) =>
        type === "trabajo"
          ? { ...f, normasTrabajoFileName: file.name, normasTrabajoFileData: base64 }
          : { ...f, normasFacturacionFileName: file.name, normasFacturacionFileData: base64 }
      );
    };
    reader.readAsDataURL(file);
  };

  const downloadFile = (name?: string | null, data?: string | null) => {
    if (!name || !data) return;
    const link = document.createElement("a");
    link.href = data;
    link.download = name;
    link.click();
  };

  return (
    <section className="auth-hero" style={{ width: "min(900px, 100%)" }}>
      <div>
        <p className="eyebrow">Obras sociales</p>
        <h1 className="heading">Obras sociales</h1>
        <p className="subheading">Administra la cartilla de obras sociales.</p>
      </div>

      <div className="auth-card">
        {message && <div className={`status ${status === "error" ? "error" : "success"}`}>{message}</div>}

        {tab === "ver" && (
  <>
    {status === "loading" && <p className="muted">Cargando...</p>}
    {visible.length === 0 && status === "idle" && (
      <p className="muted">No hay obras sociales cargadas.</p>
    )}

    <div className="form" style={{ marginBottom: 12 }}>
      <label className="form-group" style={{ maxWidth: 360 }}>
        <span className="label">Obra social</span>
        <input
          className="input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, descripcion o numero"
        />
      </label>
    </div>

    {visible.length > 0 && (
      <div className="grid" style={{ gap: 10 }}>
        {visible.map((obra) => (
          <button
            key={obra.id}
            type="button"
            className="menu-item"
            style={{ background: "#f7f9ff", color: "#0b1d3a", textAlign: "left" }}
            onClick={() => startEdit(obra)}
          >
            <div style={{ display: "grid", gap: 4 }}>
              <span className="label">
                {obra.numeroObraSocial || "N/D"} - {obra.nombre}
              </span>
              {obra.descripcion && <span className="muted">{obra.descripcion}</span>}
            </div>
          </button>
        ))}
      </div>
    )}
  </>
)}

        
        {tab === "agregar" && (
          <div className="form" style={{ gap: 10 }}>
            <p className="label">{editId ? "Editar obra social" : "Agregar obra social"}</p>
            <Field label="N° Obra social" value={form.numeroObraSocial} onChange={(v) => setForm((f) => ({ ...f, numeroObraSocial: v }))} />
            <Field label="Nombre" value={form.nombre} onChange={(v) => setForm((f) => ({ ...f, nombre: v }))} />
            <label className="form-group">
              <span className="label">Descripción</span>
              <textarea
                className="input"
                style={{ minHeight: 80 }}
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                placeholder="Breve descripción"
              />
            </label>
            {editId ? (
              <>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    className={`btn ${detailTab === "aranceles" ? "btn-primary" : ""}`}
                    type="button"
                    onClick={() => setDetailTab("aranceles")}
                  >
                    Aranceles
                  </button>
                  <button
                    className={`btn ${detailTab === "normas" ? "btn-primary" : ""}`}
                    type="button"
                    onClick={() => setDetailTab("normas")}
                  >
                    Normas y facturación
                  </button>
                </div>
                {detailTab === "aranceles" && (
                  <div style={{ border: "1px solid #e5e8f0", borderRadius: 10, padding: 10, background: "#f9fbff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <p className="label" style={{ margin: 0 }}>
                        Aranceles
                      </p>
                      <button className="btn btn-primary" type="button" onClick={openNewArancel}>
                        + Añadir arancel
                      </button>
                    </div>
                    {form.aranceles.length === 0 && <p className="muted">Sin aranceles cargados.</p>}
                    {form.aranceles.length > 0 && (
                      <div style={{ overflowX: "auto" }}>
                        <table className="table" style={{ width: "100%", fontSize: 13 }}>
                          <thead>
                            <tr>
                              <th>Código</th>
                              <th>Descripción</th>
                              <th>Vigencia</th>
                              <th style={{ textAlign: "right" }}>Arancel</th>
                              <th style={{ textAlign: "right" }}>Copago</th>
                              <th />
                            </tr>
                          </thead>
                          <tbody>
                            {form.aranceles.map((a, idx) => (
                              <tr key={`${a.codigo}-${idx}`}>
                                <td>{a.codigo}</td>
                                <td>{a.descripcion}</td>
                                <td>{a.vigenciaDesde}</td>
                                <td style={{ textAlign: "right" }}>{a.arancelTotal || "-"}</td>
                                <td style={{ textAlign: "right" }}>{a.copago || "-"}</td>
                                <td style={{ textAlign: "right" }}>
                                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                                    <button className="btn btn-primary" type="button" onClick={() => openEditArancel(idx)}>
                                      Editar
                                    </button>
                                    <button
                                      className="btn"
                                      type="button"
                                      onClick={() => removeArancel(idx)}
                                      style={{ background: "#ffe6e6", color: "#b42318", borderColor: "#f5c2c7" }}
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
                {detailTab === "normas" && (
                  <div style={{ display: "grid", gap: 8, border: "1px solid #e5e8f0", borderRadius: 10, padding: 10 }}>
                    <p className="label" style={{ margin: 0 }}>
                      Normas y facturación
                    </p>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <label className="btn" style={{ cursor: "pointer" }}>
                        Subir normas de trabajo (Word)
                        <input type="file" accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" style={{ display: "none" }} onChange={(e) => e.target.files && e.target.files[0] && handleFile(e.target.files[0], "trabajo")} />
                      </label>
                      {form.normasTrabajoFileName && (
                        <span className="muted" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          Archivo: {form.normasTrabajoFileName}
                          <button
                            className="btn"
                            type="button"
                            onClick={() => downloadFile(form.normasTrabajoFileName, form.normasTrabajoFileData)}
                            style={{ padding: "8px 12px", borderColor: "#cbd5e1", background: "#eef2ff", color: "#1e293b" }}
                          >
                            Ver
                          </button>
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <label className="btn" style={{ cursor: "pointer" }}>
                        Subir normas de facturación (Excel)
                        <input type="file" accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" style={{ display: "none" }} onChange={(e) => e.target.files && e.target.files[0] && handleFile(e.target.files[0], "facturacion")} />
                      </label>
                      {form.normasFacturacionFileName && (
                        <span className="muted" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          Archivo: {form.normasFacturacionFileName}
                          <button
                            className="btn"
                            type="button"
                            onClick={() => downloadFile(form.normasFacturacionFileName, form.normasFacturacionFileData)}
                            style={{ padding: "8px 12px", borderColor: "#cbd5e1", background: "#eef2ff", color: "#1e293b" }}
                          >
                            Ver
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{ border: "1px solid #e5e8f0", borderRadius: 10, padding: 10, background: "#f9fbff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <p className="label" style={{ margin: 0 }}>
                      Aranceles
                    </p>
                    <button className="btn btn-primary" type="button" onClick={openNewArancel}>
                      + Añadir arancel
                    </button>
                  </div>
                  {form.aranceles.length === 0 && <p className="muted">Sin aranceles cargados.</p>}
                  {form.aranceles.length > 0 && (
                    <div style={{ overflowX: "auto" }}>
                      <table className="table" style={{ width: "100%", fontSize: 13 }}>
                        <thead>
                          <tr>
                            <th>Código</th>
                            <th>Descripción</th>
                            <th>Vigencia</th>
                            <th style={{ textAlign: "right" }}>Arancel</th>
                            <th style={{ textAlign: "right" }}>Copago</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {form.aranceles.map((a, idx) => (
                            <tr key={`${a.codigo}-${idx}`}>
                              <td>{a.codigo}</td>
                              <td>{a.descripcion}</td>
                              <td>{a.vigenciaDesde}</td>
                              <td style={{ textAlign: "right" }}>{a.arancelTotal || "-"}</td>
                              <td style={{ textAlign: "right" }}>{a.copago || "-"}</td>
                              <td style={{ textAlign: "right" }}>
                                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                                  <button className="btn btn-primary" type="button" onClick={() => openEditArancel(idx)}>
                                    Editar
                                  </button>
                                  <button
                                    className="btn"
                                    type="button"
                                    onClick={() => removeArancel(idx)}
                                    style={{ background: "#ffe6e6", color: "#b42318", borderColor: "#f5c2c7" }}
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <div style={{ display: "grid", gap: 8, border: "1px solid #e5e8f0", borderRadius: 10, padding: 10 }}>
                  <p className="label" style={{ margin: 0 }}>
                    Normas y facturación
                  </p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <label className="btn" style={{ cursor: "pointer" }}>
                      Subir normas de trabajo (Word)
                      <input type="file" accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" style={{ display: "none" }} onChange={(e) => e.target.files && e.target.files[0] && handleFile(e.target.files[0], "trabajo")} />
                    </label>
                    {form.normasTrabajoFileName && (
                      <span className="muted" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        Archivo: {form.normasTrabajoFileName}
                        <button
                          className="btn"
                          type="button"
                          onClick={() => downloadFile(form.normasTrabajoFileName, form.normasTrabajoFileData)}
                          style={{ padding: "8px 12px", borderColor: "#cbd5e1", background: "#eef2ff", color: "#1e293b" }}
                        >
                          Ver
                        </button>
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <label className="btn" style={{ cursor: "pointer" }}>
                      Subir normas de facturación (Excel)
                      <input type="file" accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" style={{ display: "none" }} onChange={(e) => e.target.files && e.target.files[0] && handleFile(e.target.files[0], "facturacion")} />
                    </label>
                    {form.normasFacturacionFileName && (
                      <span className="muted" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        Archivo: {form.normasFacturacionFileName}
                        <button
                          className="btn"
                          type="button"
                          onClick={() => downloadFile(form.normasFacturacionFileName, form.normasFacturacionFileData)}
                          style={{ padding: "8px 12px", borderColor: "#cbd5e1", background: "#eef2ff", color: "#1e293b" }}
                        >
                          Ver
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              {editId && (
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    resetForm();
                    setEditId(null);
                  }}
                  disabled={status === "saving"}
                >
                  Cancelar
                </button>
              )}
              <button
                className="btn btn-primary"
                type="button"
                onClick={editId ? handleUpdate : handleCreate}
                disabled={status === "saving"}
              >
                {status === "saving" ? "Guardando..." : editId ? "Guardar cambios" : "Crear"}
              </button>
            </div>
          </div>
        )}
      </div>

      {arancelModal.open && (
        <ArancelModal
          open={arancelModal.open}
          data={arancelModal.data}
          onChange={(field, value) => setArancelModal((m) => ({ ...m, data: { ...m.data, [field]: value } }))}
          onCancel={() => setArancelModal({ open: false, index: null, data: { ...emptyArancel } })}
          onSave={saveArancel}
        />
      )}
    </section>
  );
}

function ArancelModal({
  open,
  data,
  onChange,
  onCancel,
  onSave,
}: {
  open: boolean;
  data: { codigo: string; descripcion: string; vigenciaDesde: string; arancelTotal: string; copago: string };
  onChange: (field: keyof typeof data, value: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" style={{ background: "rgba(12,18,46,0.55)" }} onClick={onCancel}>
      <div
        className="modal-card"
        style={{
          maxWidth: 520,
          padding: 20,
          borderRadius: 14,
          border: "1px solid #e3e8f4",
          boxShadow: "0 18px 38px rgba(15,23,42,0.28)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <p className="label" style={{ margin: 0 }}>
            Arancel
          </p>
          <button className="btn ghost" type="button" onClick={onCancel}>
            Cerrar
          </button>
        </div>
        <div className="form" style={{ gap: 10 }}>
          <Field label="Código" value={data.codigo} onChange={(v) => onChange("codigo", v)} />
          <Field label="Descripción" value={data.descripcion} onChange={(v) => onChange("descripcion", v)} />
          <Field label="Vigencia desde" value={data.vigenciaDesde} onChange={(v) => onChange("vigenciaDesde", v)} />
          <Field label="Arancel total" value={data.arancelTotal} onChange={(v) => onChange("arancelTotal", v)} type="number" />
          <Field label="Copago" value={data.copago} onChange={(v) => onChange("copago", v)} type="number" />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-end" }}>
          <button className="btn" type="button" onClick={onCancel}>
            Cancelar
          </button>
          <button className="btn btn-primary" type="button" onClick={onSave}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="form-group">
      <span className="label">{label}</span>
      <input className="input" type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}




