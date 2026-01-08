export default function Home() {
  return (
    <section className="auth-hero">
      <div>
        <div className="brand-mark">
          <div className="brand-icon">
            <img src="/images/logo.png" alt="Mario Villalonga" />
          </div>
          <span>Mariano Villalonga</span>
        </div>
        <p className="eyebrow">Odontologia Digital</p>
        <h1 className="heading">Ingresa o crea tu cuenta</h1>
        <p className="subheading">
          Coloca tus datos para ingresar al sistema de turnos o crea una cuenta nueva.
        </p>
      </div>
      <div className="auth-card">
        <p className="muted" style={{ marginBottom: 10 }}>
          Elige la accion que necesitas:
        </p>
        <div style={{ display: "grid", gap: 10 }}>
          <a className="btn btn-primary" href="/login">
            Ingresar
          </a>
          <a
            className="btn"
            style={{ borderColor: "#d7e4ff", background: "#f7f9ff", color: "#1a2f55" }}
            href="/register"
          >
            Registrarse
          </a>
        </div>
      </div>
    </section>
  );
}
