"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Mail } from "lucide-react";
import { requestPasswordReset } from "@/lib/api";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      await requestPasswordReset(email);
      setStatus("success");
      setMessage("Si el correo existe, te enviamos un link para restablecer la contrasena.");
    } catch (error) {
      const err = error as Error;
      setStatus("error");
      setMessage(err.message || "No se pudo enviar el correo.");
    }
  };

  return (
    <section className="auth-hero">
      <div
        className="auth-card"
        style={{
          width: "min(580px, 100%)",
          padding: "28px 28px 24px",
          border: "1px solid rgba(27, 63, 158, 0.12)",
          boxShadow: "0 24px 60px rgba(10, 44, 120, 0.12)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            aria-hidden="true"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "linear-gradient(135deg, #1b3f9e 0%, #2f6bf0 100%)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 10px 22px rgba(27, 63, 158, 0.28)",
            }}
          >
            <Mail size={18} />
          </span>
          <div>
            <p className="eyebrow" style={{ marginBottom: 4 }}>
              Recuperar acceso
            </p>
            <h1 className="heading" style={{ fontSize: "28px" }}>
              Reestablecer contrasena
            </h1>
          </div>
        </div>
        <p className="subheading" style={{ marginTop: 8, color: "#5b6b86" }}>
          Ingresa tu correo y te enviaremos un enlace seguro para crear una nueva contrasena.
        </p>

        <form className="form" onSubmit={onSubmit} style={{ marginTop: 22 }}>
          <label className="form-group">
            <span className="label">Correo electronico</span>
            <div className="input-wrap">
              <span aria-hidden="true">
                <Mail size={16} />
              </span>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                autoComplete="email"
                style={{ background: "#f7f9ff", borderColor: "#dbe3f3" }}
              />
            </div>
          </label>

          {message && <div className={`status ${status === "error" ? "error" : "success"}`}>{message}</div>}

          <div className="form-footer" style={{ marginTop: 14, alignItems: "center" }}>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={status === "loading" || !email}
              style={{ padding: "10px 16px" }}
            >
              {status === "loading" ? "Enviando..." : "Enviar enlace"}
            </button>
            <p className="muted" style={{ marginTop: 8 }}>
              Volver a{" "}
              <Link href="/login" style={{ fontWeight: 700, color: "#1b3f9e" }}>
                iniciar sesion
              </Link>
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
