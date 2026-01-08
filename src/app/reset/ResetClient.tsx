"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { resetPassword } from "@/lib/api";

export default function ResetClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const passwordsMatch = password === confirmPassword;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setStatus("error");
      setMessage("Falta el token de restablecimiento.");
      return;
    }
    setStatus("loading");
    setMessage("");

    try {
      await resetPassword(token, password);
      setStatus("success");
      setMessage("Contrasena actualizada. Ya puedes iniciar sesion.");
      setTimeout(() => router.push("/login"), 1500);
    } catch (error) {
      const err = error as Error;
      setStatus("error");
      setMessage(err.message || "No se pudo cambiar la contrasena.");
    }
  };

  return (
    <div className="auth-card" style={{ width: "min(560px, 100%)" }}>
      <p className="eyebrow">Restablecer acceso</p>
      <h1 className="heading" style={{ fontSize: "28px" }}>
        Cambiar contrasena
      </h1>
      <p className="subheading" style={{ marginTop: 8 }}>
        Ingresa tu nueva contrasena para continuar.
      </p>

      <form className="form" onSubmit={onSubmit} style={{ marginTop: 20 }}>
        <label className="form-group">
          <span className="label">Nueva contrasena</span>
          <div className="input-wrap">
            <span aria-hidden="true">
              <Lock size={16} />
            </span>
            <input
              className="input"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nueva contrasena"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="btn"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar contrasena" : "Ver contrasena"}
              style={{ padding: "6px 10px", borderColor: "#dbe3f3", background: "#f5f7ff" }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>

        <label className="form-group">
          <span className="label">Repetir contrasena</span>
          <div className="input-wrap">
            <span aria-hidden="true">
              <Lock size={16} />
            </span>
            <input
              className="input"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la contrasena"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="btn"
              onClick={() => setShowConfirmPassword((v) => !v)}
              aria-label={showConfirmPassword ? "Ocultar contrasena" : "Ver contrasena"}
              style={{ padding: "6px 10px", borderColor: "#dbe3f3", background: "#f5f7ff" }}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {!passwordsMatch && (
            <span className="muted" style={{ color: "#b42318" }}>
              Las contrasenas no coinciden.
            </span>
          )}
        </label>

        {message && <div className={`status ${status === "error" ? "error" : "success"}`}>{message}</div>}

        <div className="form-footer" style={{ marginTop: 12 }}>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={status === "loading" || !password || !confirmPassword || !passwordsMatch || !token}
          >
            {status === "loading" ? "Guardando..." : "Actualizar contrasena"}
          </button>
          <p className="muted">
            Volver a{" "}
            <Link href="/login" style={{ fontWeight: 700, color: "#1b3f9e" }}>
              iniciar sesion
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
