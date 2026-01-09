import { AuthForm } from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <section className="auth-hero auth-split auth-page">
      <div className="auth-visual">
        <div className="auth-visual-card">
          <h2 className="auth-visual-title">Bienvenido al panel</h2>
          <p className="auth-visual-copy">
            Gestiona turnos, pacientes y obras sociales con una vista clara y segura.
          </p>
          <div className="auth-visual-illustration auth-visual-logo">
            <img src="/images/logo.png" alt="Mario Villalonga" />
          </div>
          <div className="auth-visual-footer">
            <span>Soporte seguro</span>
            <span>Acceso rapido</span>
          </div>
        </div>
      </div>
      <div className="auth-form-panel">
        <div>
          <h1 className="heading">Ingresá a tu consultorio</h1>
          <p className="subheading">Accedé a turnos, pacientes y obras sociales de forma segura.</p>
        </div>
        <div className="auth-card auth-card-elevated">
          <AuthForm mode="login" redirectTo="/dashboard" showHeader={false} />
        </div>
      </div>
    </section>
  );
}




