"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    if (!getSession().token) {
      router.replace("/not-found");
    }
  }, [router]);

  return (
    <section className="auth-hero" style={{ marginTop: 16 }}>
      <div>
        <p className="eyebrow">Panel</p>
        <h1 className="heading">Bienvenido al dashboard</h1>
        <p className="subheading">
          Esta es una pagina placeholder para validar la redireccion despues del login.
        </p>
      </div>
      <div className="auth-card">
        <p className="muted">
          Aqui puedes continuar construyendo tu panel con turnos, pacientes o lo que necesites.
        </p>
      </div>
    </section>
  );
}
