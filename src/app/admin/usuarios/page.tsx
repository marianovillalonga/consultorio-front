"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createAdminUser,
  fetchAdminUserPermissions,
  fetchAdminUsers,
  updateAdminUser,
  updateAdminUserPermissions,
  UserPermission,
} from "@/lib/api";
import { getSession } from "@/lib/session";

type AdminUser = {
  id: number;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type FormState = {
  email: string;
  password: string;
  active: boolean;
};

const emptyForm: FormState = {
  email: "",
  password: "",
  active: true,
};

const PERMISSION_VIEWS = [
  { key: "TURNOS", label: "Turnos" },
  { key: "PACIENTES", label: "Pacientes" },
  { key: "OBRAS_SOCIALES", label: "Obras sociales" },
];

export default function AdminUsuariosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "error">("loading");
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"gestion" | "crear">("gestion");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [permStatus, setPermStatus] = useState<"idle" | "loading" | "saving" | "error">("idle");

  useEffect(() => {
    const session = getSession();
    if (!session.token) {
      router.replace("/login");
      return;
    }
    if (session.role !== "ADMIN") {
      router.replace("/dashboard");
      return;
    }
    setToken(session.token);
  }, [router]);

  useEffect(() => {
    const v = (searchParams.get("vista") as "gestion" | "crear" | null) || "gestion";
    setView(v);
  }, [searchParams]);

  useEffect(() => {
    if (!token) return;
    loadUsers(token);
  }, [token]);

  const loadUsers = async (tkn: string) => {
    setStatus("loading");
    setMessage("");
    try {
      const list = await fetchAdminUsers(tkn);
      setUsers(list);
      setStatus("idle");
    } catch (err) {
      const e = err as Error;
      setStatus("error");
      setMessage(e.message || "No se pudieron obtener los usuarios");
    }
  };

  const visible = useMemo(() => {
    if (!search.trim()) return users;
    const term = search.toLowerCase();
    return users.filter((u) => u.email.toLowerCase().includes(term));
  }, [users, search]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
  };

  const startEdit = (user: AdminUser) => {
    setEditId(user.id);
    setForm({
      email: user.email,
      password: "",
      active: user.active,
    });
  };

  const loadPermissions = async (user: AdminUser) => {
    if (!token) return;
    if (user.role !== "ODONTOLOGO") {
      setSelectedUser(null);
      return;
    }
    setPermStatus("loading");
    setMessage("");
    setSelectedUser(user);
    try {
      const list = await fetchAdminUserPermissions(token, user.id);
      const merged = PERMISSION_VIEWS.map((v) => {
        const found = list.find((p) => p.viewKey === v.key);
        return {
          viewKey: v.key,
          canRead: found?.canRead || false,
          canWrite: found?.canWrite || false,
        };
      });
      setPermissions(merged);
      setPermStatus("idle");
    } catch (err) {
      const e = err as Error;
      setPermStatus("error");
      setMessage(e.message || "No se pudieron obtener los permisos");
    }
  };

  const handleSave = async () => {
    if (!token) return;
    if (!form.email.trim()) {
      setStatus("error");
      setMessage("El email es obligatorio.");
      return;
    }
    if (editId === null && !form.password.trim()) {
      setStatus("error");
      setMessage("La contraseña es obligatoria.");
      return;
    }

    setStatus("saving");
    setMessage("");

    try {
      if (editId === null) {
        await createAdminUser(token, {
          email: form.email.trim(),
          password: form.password.trim(),
          active: form.active,
        });
        setMessage("Cuenta de odontólogo creada.");
      } else {
        await updateAdminUser(token, editId, {
          email: form.email.trim(),
          password: form.password.trim() || undefined,
          active: form.active,
        });
        setMessage("Cuenta actualizada.");
      }
      resetForm();
      await loadUsers(token);
      setStatus("idle");
      if (view !== "gestion") {
        const params = new URLSearchParams(Array.from(searchParams.entries()));
        params.set("vista", "gestion");
        router.replace(`/admin/usuarios?${params.toString()}`);
      }
    } catch (err) {
      const e = err as Error;
      setStatus("error");
      setMessage(e.message || "No se pudo guardar el usuario");
    }
  };

  const toggleActive = async (id: number, nextActive: boolean) => {
    if (!token) return;
    setStatus("saving");
    setMessage("");
    try {
      await updateAdminUser(token, id, { active: nextActive });
      setMessage(nextActive ? "Cuenta reactivada." : "Cuenta dada de baja.");
      await loadUsers(token);
      setStatus("idle");
    } catch (err) {
      const e = err as Error;
      setStatus("error");
      setMessage(e.message || "No se pudo actualizar el estado");
    }
  };

  const updatePermission = (viewKey: string, field: "canRead" | "canWrite", value: boolean) => {
    setPermissions((prev) =>
      prev.map((p) => {
        if (p.viewKey !== viewKey) return p;
        if (field === "canWrite" && value) {
          return { ...p, canWrite: true, canRead: true };
        }
        if (field === "canRead" && !value) {
          return { ...p, canRead: false, canWrite: false };
        }
        return { ...p, [field]: value };
      })
    );
  };

  const savePermissions = async () => {
    if (!token || !selectedUser) return;
    setPermStatus("saving");
    setMessage("");
    try {
      await updateAdminUserPermissions(token, selectedUser.id, permissions);
      setPermStatus("idle");
      setMessage("Permisos actualizados.");
    } catch (err) {
      const e = err as Error;
      setPermStatus("error");
      setMessage(e.message || "No se pudieron guardar los permisos");
    }
  };

  return (
    <section className="auth-hero" style={{ width: "min(1000px, 100%)" }}>
      <div>
        <p className="eyebrow">Administración</p>
        <h1 className="heading">Usuarios odontólogos</h1>
        <p className="subheading">Alta, baja y modificación de cuentas odontólogas.</p>
      </div>

      <div className="auth-card">
        {message && <div className={`status ${status === "error" ? "error" : "success"}`}>{message}</div>}

        {view === "crear" && (
          <div className="form" style={{ gap: 10 }}>
            <p className="label">{editId ? "Editar cuenta" : "Nueva cuenta"}</p>
            <Field label="Email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
            <Field
              label={editId ? "Nueva contraseña (opcional)" : "Contraseña"}
              value={form.password}
              onChange={(v) => setForm((f) => ({ ...f, password: v }))}
              type="password"
            />
            <label className="form-group">
              <span className="label">Activo</span>
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              />
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {editId && (
                <button className="btn" type="button" onClick={resetForm} disabled={status === "saving"}>
                  Cancelar
                </button>
              )}
              <button className="btn btn-primary" type="button" onClick={handleSave} disabled={status === "saving"}>
                {status === "saving" ? "Guardando..." : editId ? "Guardar cambios" : "Crear"}
              </button>
            </div>
          </div>
        )}

        {view === "gestion" && (
          <>
            {status === "loading" && <p className="muted">Cargando...</p>}
            <div className="form" style={{ marginTop: 8 }}>
              <label className="form-group" style={{ maxWidth: 360 }}>
                <span className="label">Buscar por email</span>
                <input
                  className="input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar"
                />
              </label>
            </div>

            {visible.length === 0 && status === "idle" ? (
              <p className="muted" style={{ marginTop: 12 }}>
                No hay usuarios cargados.
              </p>
            ) : (
              <div style={{ display: "grid", gap: 14, marginTop: 12 }}>
                <div style={{ overflowX: "auto" }}>
                  <table className="table" style={{ width: "100%", fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th style={{ textAlign: "right" }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((u) => (
                        <tr key={u.id}>
                          <td>
                            {u.role === "ODONTOLOGO" ? (
                              <button
                                className="btn"
                                type="button"
                                onClick={() => loadPermissions(u)}
                                style={{ padding: "6px 10px", borderColor: "#dbe3f3", background: "#f5f7ff" }}
                              >
                                {u.email}
                              </button>
                            ) : (
                              u.email
                            )}
                          </td>
                          <td>{u.role}</td>
                          <td>{u.active ? "Activo" : "Inactivo"}</td>
                          <td style={{ textAlign: "right" }}>
                            {u.role === "ODONTOLOGO" ? (
                              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                                <button
                                  className="btn btn-primary"
                                  type="button"
                                  onClick={() => {
                                    startEdit(u);
                                    const params = new URLSearchParams(Array.from(searchParams.entries()));
                                    params.set("vista", "crear");
                                    router.replace(`/admin/usuarios?${params.toString()}`);
                                  }}
                                >
                                  Editar
                                </button>
                                {u.active ? (
                                  <button
                                    className="btn"
                                    type="button"
                                    onClick={() => toggleActive(u.id, false)}
                                    style={{ background: "#ffe6e6", color: "#b42318", borderColor: "#f5c2c7" }}
                                  >
                                    Dar de baja
                                  </button>
                                ) : (
                                  <button className="btn" type="button" onClick={() => toggleActive(u.id, true)}>
                                    Reactivar
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="muted">Sin acciones</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {selectedUser && (
                  <div style={{ border: "1px solid #e5e8f0", borderRadius: 10, padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                      <div>
                        <p className="label" style={{ margin: 0 }}>
                          Permisos de vistas
                        </p>
                        <p className="muted" style={{ margin: 0 }}>
                          {selectedUser.email}
                        </p>
                      </div>
                      <button className="btn" type="button" onClick={() => setSelectedUser(null)}>
                        Cerrar
                      </button>
                    </div>
                    <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                      {PERMISSION_VIEWS.map((viewItem) => {
                        const perm = permissions.find((p) => p.viewKey === viewItem.key);
                        return (
                          <div
                            key={viewItem.key}
                            style={{
                              display: "flex",
                              gap: 14,
                              alignItems: "center",
                              justifyContent: "space-between",
                              border: "1px solid #e5e8f0",
                              borderRadius: 10,
                              padding: 10,
                            }}
                          >
                            <div style={{ display: "grid", gap: 2 }}>
                              <span className="label" style={{ margin: 0 }}>
                                {viewItem.label}
                              </span>
                              <span className="muted">Configura lectura o edicion.</span>
                            </div>
                            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                              <label className="muted" style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(perm?.canRead)}
                                  onChange={(e) => updatePermission(viewItem.key, "canRead", e.target.checked)}
                                />
                                Lectura
                              </label>
                              <label className="muted" style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(perm?.canWrite)}
                                  onChange={(e) => updatePermission(viewItem.key, "canWrite", e.target.checked)}
                                />
                                Lectura y editar
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                      <button className="btn btn-primary" type="button" onClick={savePermissions} disabled={permStatus === "saving"}>
                        {permStatus === "saving" ? "Guardando..." : "Guardar permisos"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="form-group">
      <span className="label">{label}</span>
      <input className="input" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
