"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { authRequest, AuthResponse, resendActivation } from "@/lib/api";
import { saveSession } from "@/lib/session";

type Mode = "login" | "register";

type Props = {
  mode: Mode;
  redirectTo?: string;
  showHeader?: boolean;
};

export function AuthForm({ mode, redirectTo, showHeader = true }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState<AuthResponse | null>(null);
  const [resendStatus, setResendStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const isRegister = mode === "register";
  const submitLabel = isRegister ? "Crear cuenta" : "Ingresar";

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    setResponse(null);

    try {
      const data = await authRequest(isRegister ? "/auth/register" : "/auth/login", {
        ...(isRegister ? { email } : { identifier: email }),
        password,
        ...(isRegister ? { fullName } : {}),
      });

      if (mode === "login") {
        saveSession(data.token || "", data.user.role);
      }
      setStatus("success");
      setMessage(mode === "register" ? "Revisa tu correo para activar la cuenta." : "Accion completada con exito.");
      setResponse(data);

      if (mode === "login" && redirectTo) {
        router.push(redirectTo);
      }
    } catch (error) {
      const err = error as Error;
      setStatus("error");
      setMessage(err.message || "No se pudo completar la accion.");
    }
  };

  const isDisabled =
    status === "loading" ||
    !email ||
    !password ||
    (isRegister && (fullName.trim().length < 2 || confirmPassword.trim().length === 0));

  const passwordsMatch = !isRegister || password === confirmPassword;

  return (
    <div className="auth-form">
      {showHeader && (
        <div className="grid">
          <div>
            <p className="eyebrow">{isRegister ? "Nuevo paciente" : "Bienvenido"}</p>
            <h1 className="heading" style={{ fontSize: "28px" }}>
              {isRegister ? "Crea tu cuenta de paciente" : "Ingresa para continuar"}
            </h1>
            <p className="subheading" style={{ marginTop: 8 }}>
              {isRegister
                ? "Registra tu nombre y correo para reservar turnos y ver tu perfil."
                : "Usa tu correo o documento y tu contrasena para acceder al panel."}
            </p>
          </div>
        </div>
      )}

      <form className="form" onSubmit={onSubmit}>
        <div className="form-row">
          {isRegister && (
            <label className="form-group">
              <span className="label">Nombre completo</span>
              <div className="input-wrap">
                <span aria-hidden="true">
                  <User size={16} />
                </span>
                <input
                  className="input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej: Ana Perez"
                  autoComplete="name"
                />
              </div>
            </label>
          )}
          <label className="form-group">
            <span className="label">{isRegister ? "Correo electronico" : "Documento o correo"}</span>
            <div className="input-wrap">
              <span aria-hidden="true">
                <Mail size={16} />
              </span>
              <input
                className="input"
                type={isRegister ? "email" : "text"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isRegister ? "tu@email.com" : "Tu numero de documento o correo"}
                autoComplete={isRegister ? "email" : "username"}
              />
            </div>
          </label>
          <label className="form-group">
            <span className="label">Contrasena</span>
            <div className="input-wrap">
              <span aria-hidden="true">
                <Lock size={16} />
              </span>
              <input
                className="input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contrasena"
                autoComplete={isRegister ? "new-password" : "current-password"}
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
          {!isRegister && (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Link href="/recuperar" className="btn" style={{ padding: "6px 12px" }}>
                Olvidaste tu contrasena?
              </Link>
            </div>
          )}
          {isRegister && (
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
                  placeholder="Repite tu contrasena"
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
          )}
        </div>

        {message && <div className={`status ${status === "error" ? "error" : "success"}`}>{message}</div>}

        {response && status === "success" && (
          <div className="status success" aria-live="polite">
            Sesion lista para {response.user.email}
          </div>
        )}

        {mode === "register" && status === "success" && (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              type="button"
              className="btn"
              onClick={async () => {
                if (!email) return;
                setResendStatus("loading");
                try {
                  await resendActivation(email);
                  setResendStatus("success");
                } catch {
                  setResendStatus("error");
                }
              }}
              disabled={resendStatus === "loading"}
            >
              {resendStatus === "loading" ? "Enviando..." : "Reenviar correo de activacion"}
            </button>
            {resendStatus === "success" && <span className="muted">Correo reenviado.</span>}
            {resendStatus === "error" && <span className="muted" style={{ color: "#b42318" }}>No se pudo reenviar.</span>}
          </div>
        )}

        <div className="form-footer">
          <button className="btn btn-primary" type="submit" disabled={isDisabled || !passwordsMatch}>
            {status === "loading" ? "Enviando..." : submitLabel}
          </button>
          <p className="muted">
            {isRegister ? "Ya tienes cuenta?" : "Aun no tienes cuenta?"}{" "}
            <Link href={isRegister ? "/login" : "/register"} style={{ fontWeight: 700, color: "#1b3f9e" }}>
              {isRegister ? "Inicia sesion" : "Registrate"}
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}

