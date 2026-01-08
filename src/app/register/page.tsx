import { AuthForm } from "@/components/AuthForm";

export default function RegisterPage() {
  return (
    <section className="auth-hero auth-split">
      <div className="auth-visual">
        <div className="auth-visual-card">
          <h2 className="auth-visual-title">Atencion personalizada</h2>
          <p className="auth-visual-copy">
            Crea tu cuenta para reservar turnos y acceder a tu historial dental.
          </p>
          <div className="auth-visual-illustration auth-visual-logo">
            <img src="/images/logo.png" alt="Mario Villalonga" />
          </div>
          <div className="auth-visual-footer">
            <span>Turnos rapidos</span>
            <span>Seguimiento continuo</span>
          </div>
        </div>
      </div>
      <div className="auth-form-panel">
        <div>
          <p className="eyebrow">Registro</p>
          <h1 className="heading">Registra tu cuenta de paciente</h1>
          <p className="subheading">Completa tu nombre, correo y contrasena.</p>
        </div>
        <div className="auth-card auth-card-elevated">
          <AuthForm mode="register" showHeader={false} />
        </div>
      </div>
    </section>
  );
}



