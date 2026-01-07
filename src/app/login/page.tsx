import { AuthForm } from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <section className="auth-hero auth-split">
      <div className="auth-visual">
        <div className="auth-visual-card">
          <div className="auth-visual-brand">
            <div className="brand-icon">
              <span>MV</span>
            </div>
            <div>
              <p className="label" style={{ color: "#f8fbff" }}>Mariano Villalonga</p>
              <p className="muted" style={{ color: "rgba(248,251,255,0.78)" }}>Odontologia Digital</p>
            </div>
          </div>
          <h2 className="auth-visual-title">Bienvenido al panel</h2>
          <p className="auth-visual-copy">
            Gestiona turnos, pacientes y obras sociales con una vista clara y segura.
          </p>
          <div className="auth-visual-illustration">
            <svg viewBox="0 0 200 160" role="img" aria-label="Icono de diente" className="auth-visual-svg">
              <path
                d="M60 34c10-10 70-10 80 0 6 7 8 18 6 32-3 17-8 28-12 44-4 16-10 40-24 40-8 0-12-10-14-20-2-10-4-10-6-10s-4 0-6 10c-2 10-6 20-14 20-14 0-20-24-24-40-4-16-9-27-12-44-2-14 0-25 6-32z"
                fill="rgba(248,251,255,0.95)"
              />
              <path
                d="M74 66c6-6 46-6 52 0"
                stroke="#2f6bf0"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <circle cx="86" cy="78" r="4" fill="#2f6bf0" />
              <circle cx="114" cy="78" r="4" fill="#2f6bf0" />
            </svg>
            <p className="muted" style={{ margin: 0, color: "rgba(248,251,255,0.8)" }}>
              Odontologia profesional
            </p>
          </div>
          <div className="auth-visual-footer">
            <span>Soporte seguro</span>
            <span>Acceso rapido</span>
          </div>
        </div>
      </div>
      <div className="auth-form-panel">
        <div>
          <p className="eyebrow">Ingreso</p>
          <h1 className="heading">Coloca tus datos para ingresar</h1>
          <p className="subheading">Usa tu correo o documento y tu contrasena.</p>
        </div>
        <div className="auth-card auth-card-elevated">
          <AuthForm mode="login" redirectTo="/dashboard" showHeader={false} />
        </div>
      </div>
    </section>
  );
}



