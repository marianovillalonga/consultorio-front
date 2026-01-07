import Link from "next/link";

export default function NotFound() {
  return (
    <section className="auth-hero">
      <div>
        <div className="brand-mark">
          <div className="brand-icon">
            <span>MV</span>
          </div>
          <span>Mariano Villalonga</span>
        </div>
        <p className="eyebrow">Pagina no encontrada</p>
        <h1 className="heading">Ups, este enlace no existe</h1>
        <p className="subheading">
          Verifica la URL o vuelve al inicio para continuar con tus tramites.
        </p>
      </div>
      <div className="auth-card">
        <p className="muted" style={{ marginBottom: 12 }}>
          Atajos rapidos:
        </p>
        <div style={{ display: "grid", gap: 10 }}>
          <Link className="btn btn-primary" href="/">
            Ir al inicio
          </Link>
          <Link className="btn" style={{ borderColor: "#d7e4ff", background: "#f7f9ff", color: "#1a2f55" }} href="/login">
            Ir a login
          </Link>
        </div>
      </div>
    </section>
  );
}
