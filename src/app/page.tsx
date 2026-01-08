export default function Home() {
  return (
    <section
      style={{
        minHeight: "100vh",
        padding: "48px 20px 64px",
        background:
          "linear-gradient(135deg, rgba(14,86,177,0.18) 0%, rgba(14,86,177,0.04) 45%, rgba(247,250,255,0.9) 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "auto -10% -30% auto",
          width: 520,
          height: 520,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(31,107,255,0.24), rgba(31,107,255,0))",
          filter: "blur(0px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "-10% auto auto -5%",
          width: 360,
          height: 360,
          borderRadius: "20% 80% 40% 60%",
          background: "linear-gradient(140deg, rgba(13,58,134,0.25), rgba(13,58,134,0))",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "grid",
          gap: 28,
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "linear-gradient(145deg, #1f6bff, #0b2d6e)",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontWeight: 700,
                letterSpacing: 1,
              }}
            >
              MV
            </div>
            <div style={{ display: "grid" }}>
              <span style={{ fontSize: 12, letterSpacing: 2, color: "#0b2d6e", textTransform: "uppercase" }}>
                Consultorio
              </span>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#0b1d3a" }}>Mariano Villalonga</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <a className="btn" style={{ background: "#eef3ff", color: "#1a2f55" }} href="/login">
              Ingresar
            </a>
            <a className="btn btn-primary" href="/register">
              Crear cuenta
            </a>
          </div>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 24,
            alignItems: "center",
          }}
        >
          <div style={{ display: "grid", gap: 16 }}>
            <span
              style={{
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: 3,
                color: "#1f6bff",
                fontWeight: 700,
              }}
            >
              Odontologia digital
            </span>
            <h1
              style={{
                fontSize: "clamp(32px, 4.2vw, 54px)",
                lineHeight: 1.05,
                fontFamily: '"Times New Roman", serif',
                color: "#0b1d3a",
                margin: 0,
              }}
            >
              Un consultorio que organiza la historia clinica y los tratamientos en un solo lugar.
            </h1>
            <p style={{ color: "#3c4a63", fontSize: 16, maxWidth: 520 }}>
              Gestiona odontogramas, planes de tratamiento, estudios e imagenes con un flujo claro para tu equipo y
              tus pacientes.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a className="btn btn-primary" href="/login">
                Acceder al panel
              </a>
              <a className="btn" style={{ background: "#ffffff", borderColor: "#d7e3ff", color: "#1a2f55" }} href="/register">
                Registrar paciente
              </a>
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {[
                { label: "Pacientes activos", value: "+420" },
                { label: "Tratamientos en curso", value: "86" },
                { label: "Estudios digitales", value: "1.2k" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 12,
                    background: "#ffffff",
                    border: "1px solid #e3e8f4",
                    minWidth: 140,
                  }}
                >
                  <div style={{ fontWeight: 700, color: "#0b1d3a", fontSize: 18 }}>{stat.value}</div>
                  <div style={{ fontSize: 12, color: "#5c647a" }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              background: "#ffffff",
              borderRadius: 18,
              border: "1px solid #dce4ff",
              padding: 18,
              boxShadow: "0 18px 40px rgba(15,23,42,0.12)",
              display: "grid",
              gap: 14,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p className="label" style={{ margin: 0 }}>
                Panel rapido
              </p>
              <span style={{ fontSize: 12, color: "#1f6bff", fontWeight: 700 }}>Hoy</span>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {[
                { title: "Nuevo paciente", desc: "Alta con datos y obra social" },
                { title: "Cargar estudio", desc: "Sube imagenes y descripciones" },
                { title: "Actualizar plan", desc: "Agregar prestaciones por pieza" },
              ].map((item) => (
                <div
                  key={item.title}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    padding: "10px 12px",
                    borderRadius: 12,
                    background: "#f6f8ff",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "#1f6bff",
                      color: "#fff",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 700,
                    }}
                  >
                    ✓
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: "#0b1d3a" }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: "#5c647a" }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <a className="btn btn-primary" href="/login">
                Ir al dashboard
              </a>
              <span style={{ fontSize: 12, color: "#5c647a" }}>
                Accesos disponibles para odontologos, administracion y recepcion.
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          {[
            {
              title: "Historia clinica viva",
              detail: "Notas, sesiones y seguimiento centralizado.",
            },
            {
              title: "Odontograma interactivo",
              detail: "Planificado vs realizado con control visual.",
            },
            {
              title: "Estudios y archivos",
              detail: "Guarda imagenes y descargas cuando las necesites.",
            },
            {
              title: "Control de pagos",
              detail: "Saldo, recibos y cobertura al dia.",
            },
          ].map((card) => (
            <div
              key={card.title}
              style={{
                padding: "14px 16px",
                borderRadius: 14,
                border: "1px solid #e3e8f4",
                background: "#ffffff",
              }}
            >
              <div style={{ fontWeight: 700, color: "#0b1d3a" }}>{card.title}</div>
              <div style={{ fontSize: 13, color: "#5c647a" }}>{card.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
