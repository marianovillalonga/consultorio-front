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
      <div className="auth-card" style={{ width: "min(560px, 100%)" }}>
        <p className="eyebrow">Recuperar acceso</p>
        <h1 className="heading" style={{ fontSize: "28px" }}>
          Olvidaste tu contrasena?
        </h1>
        <p className="subheading" style={{ marginTop: 8 }}>
          Ingresa tu correo y te enviaremos un enlace para cambiarla.
        </p>

        <form className="form" onSubmit={onSubmit} style={{ marginTop: 20 }}>
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
              />
            </div>
          </label>

          {message && <div className={`status ${status === "error" ? "error" : "success"}`}>{message}</div>}

          <div className="form-footer" style={{ marginTop: 12 }}>
            <button className="btn btn-primary" type="submit" disabled={status === "loading" || !email}>
              {status === "loading" ? "Enviando..." : "Enviar enlace"}
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
    </section>
  );
}
