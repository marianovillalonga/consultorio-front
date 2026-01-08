"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logoutRequest } from "@/lib/api";
import { clearSession, getSession } from "@/lib/session";

export default function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [hasToken, setHasToken] = useState(() => Boolean(getSession().token));
  const [role, setRole] = useState(() => getSession().role);
  const [open, setOpen] = useState(false);
  const [turnosOpen, setTurnosOpen] = useState(false);
  const [pacientesOpen, setPacientesOpen] = useState(false);
  const [obrasOpen, setObrasOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const pacientesTimer = useRef<number | null>(null);
  const obrasTimer = useRef<number | null>(null);
  const adminTimer = useRef<number | null>(null);

  const handleTurnosEnter = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setTurnosOpen(true);
  };

  const handleTurnosLeave = () => {
    closeTimer.current = window.setTimeout(() => {
      setTurnosOpen(false);
    }, 120);
  };

  const handlePacientesEnter = () => {
    if (pacientesTimer.current) {
      clearTimeout(pacientesTimer.current);
      pacientesTimer.current = null;
    }
    setPacientesOpen(true);
  };

  const handlePacientesLeave = () => {
    pacientesTimer.current = window.setTimeout(() => {
      setPacientesOpen(false);
    }, 120);
  };

  const handleObrasEnter = () => {
    if (obrasTimer.current) {
      clearTimeout(obrasTimer.current);
      obrasTimer.current = null;
    }
    setObrasOpen(true);
  };

  const handleObrasLeave = () => {
    obrasTimer.current = window.setTimeout(() => {
      setObrasOpen(false);
    }, 120);
  };

  const handleAdminEnter = () => {
    if (adminTimer.current) {
      clearTimeout(adminTimer.current);
      adminTimer.current = null;
    }
    setAdminOpen(true);
  };

  const handleAdminLeave = () => {
    adminTimer.current = window.setTimeout(() => {
      setAdminOpen(false);
    }, 120);
  };

  useEffect(() => {
    const session = getSession();
    setHasToken(Boolean(session.token));
    setRole(session.role);
    setOpen(false);
  }, [pathname]);

  const logout = async () => {
    try {
      await logoutRequest();
    } catch {
      // ignore
    }
    clearSession();
    setHasToken(false);
    router.replace("/login");
  };

  if (!hasToken) return null;

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/" || pathname.startsWith("/dashboard");
    return pathname.startsWith(href);
  };

  return (
    <header className="topbar">
      <Link href="/dashboard" className="brand-mark">
        <div className="brand-icon">
          <img src="/images/logo.png" alt="Mario Villalonga" />
        </div>
        <span>Mariano Villalonga</span>
      </Link>
      <div className="topbar-links">
        <Link className={`nav-link ${isActive("/dashboard") ? "active" : ""}`} href="/dashboard">
          Inicio
        </Link>
        {(role === "PACIENTE" || role === "ODONTOLOGO" || role === "ADMIN" || role === "") && (
          <div
            className="nav-dropdown"
            onMouseEnter={handleTurnosEnter}
            onMouseLeave={handleTurnosLeave}
          >
            <button type="button" className={`nav-link ${isActive("/turnos") ? "active" : ""}`}>
              Turnos
            </button>
            {turnosOpen && (
              <div className="nav-submenu" onMouseEnter={handleTurnosEnter} onMouseLeave={handleTurnosLeave}>
                {(role === "PACIENTE" || role === "") && (
                  <>
                    <Link className="nav-subitem" href="/turnos">
                      Pedir turnos
                    </Link>
                    <Link className="nav-subitem" href="/turnos/mis">
                      Ver mis turnos
                    </Link>
                  </>
                )}
                {(role === "ODONTOLOGO" || role === "ADMIN") && (
                  <>
                    <Link className="nav-subitem" href="/turnos/doctor?tab=buscar">
                      Turnos del dia
                    </Link>
                    <Link className="nav-subitem" href="/turnos/doctor?tab=agregar">
                      Agregar turnos
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        )}
        {(role === "ODONTOLOGO" || role === "ADMIN") && (
          <div
            className="nav-dropdown"
            onMouseEnter={handlePacientesEnter}
            onMouseLeave={handlePacientesLeave}
          >
            <button type="button" className={`nav-link ${isActive("/pacientes") ? "active" : ""}`}>
              Pacientes
            </button>
            {pacientesOpen && (
              <div className="nav-submenu" onMouseEnter={handlePacientesEnter} onMouseLeave={handlePacientesLeave}>
                <Link className="nav-subitem" href="/pacientes?tab=buscar">
                  Buscar paciente
                </Link>
                <Link className="nav-subitem" href="/pacientes?tab=agregar">
                  Agregar paciente
                </Link>
              </div>
            )}
          </div>
        )}
        {(role === "ODONTOLOGO" || role === "ADMIN") && (
          <div
            className="nav-dropdown"
            onMouseEnter={handleObrasEnter}
            onMouseLeave={handleObrasLeave}
          >
            <button type="button" className={`nav-link ${isActive("/obras-sociales") ? "active" : ""}`}>
              Obras sociales
            </button>
            {obrasOpen && (
              <div className="nav-submenu" onMouseEnter={handleObrasEnter} onMouseLeave={handleObrasLeave}>
                <Link className="nav-subitem" href="/obras-sociales?tab=ver">
                  Ver obras sociales
                </Link>
                <Link className="nav-subitem" href="/obras-sociales?tab=agregar">
                  Agregar obra social
                </Link>
              </div>
            )}
          </div>
        )}
        {role === "ADMIN" && (
          <div className="nav-dropdown" onMouseEnter={handleAdminEnter} onMouseLeave={handleAdminLeave}>
            <button type="button" className={`nav-link ${isActive("/admin") ? "active" : ""}`}>
              Administracion
            </button>
            {adminOpen && (
              <div className="nav-submenu" onMouseEnter={handleAdminEnter} onMouseLeave={handleAdminLeave}>
                <Link className="nav-subitem" href="/admin/usuarios?vista=gestion">
                  Gestionar vistas
                </Link>
                <Link className="nav-subitem" href="/admin/usuarios?vista=crear">
                  Crear usuario
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="menu-wrapper">
        <button
          type="button"
          className="menu-toggle"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
        {open && (
          <div className="menu-dropdown">
            <Link className="menu-item" href="/account">
              Mi cuenta
            </Link>
            <Link className="menu-item" href="/account/configuracion">
              Cambiar datos
            </Link>
            <button className="menu-item danger" type="button" onClick={logout}>
              Cerrar sesion
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
