export default function ContactoPage() {
  return (
    <section className="auth-hero">
      <div>
        <p className="eyebrow">Contacto urgencias</p>
        <h1 className="heading">Datos de contacto</h1>
        <p className="subheading">Estos datos son solo informativos y no se pueden editar.</p>
      </div>
      <div className="auth-card auth-card-elevated">
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
    </section>
  );
}
