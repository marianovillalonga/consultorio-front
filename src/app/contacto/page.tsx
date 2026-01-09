export default function ContactoPage() {
  return (
    <section className="auth-hero contact-hero">
      <div>
        <p className="eyebrow">Contacto urgencias</p>
        <h1 className="heading">Datos de contacto</h1>
        <p className="subheading">Estos datos son solo informativos y no se pueden editar.</p>
      </div>
      <div className="contact-grid">
        <div className="auth-card auth-card-elevated contact-card">
          <div className="form">
            <div className="form-group">
              <label className="label" htmlFor="contact-name">
                Nombre
              </label>
              <input
                id="contact-name"
                className="input"
                value="Mariano Villalonga"
                readOnly
                aria-readonly="true"
              />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="contact-phone">
                Telefono
              </label>
              <input
                id="contact-phone"
                className="input"
                value="3413692907"
                readOnly
                aria-readonly="true"
              />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="contact-email">
                Email
              </label>
              <input
                id="contact-email"
                className="input"
                value="marianovillalonga94.mv@gmail.com"
                readOnly
                aria-readonly="true"
              />
            </div>
          </div>
        </div>
        <div className="auth-card contact-actions">
          <p className="label">Acciones rapidas</p>
          <p className="muted">Accesos directos para contacto inmediato.</p>
          <div className="contact-actions-list">
            <a className="btn btn-primary" href="tel:3413692907">
              Llamar ahora
            </a>
            <a className="btn ghost" href="mailto:marianovillalonga94.mv@gmail.com">
              Enviar email
            </a>
            <a className="btn" href="/dashboard">
              Volver al inicio
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
