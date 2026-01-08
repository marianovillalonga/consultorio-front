"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { activateAccount } from "@/lib/api";

export default function ActivarPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!token) {
        setStatus("error");
        setMessage("Token invalido.");
        return;
        }
        setStatus("loading");
        activateAccount(token)
        .then(() => {
            setStatus("success");
            setMessage("Cuenta activada. Ya podes ingresar.");
        })
        .catch((err) => {
            const e = err;
            setStatus("error");
            setMessage(e.message || "No se pudo activar la cuenta.");
        });
    }, [token]);

    return (
        <section className="auth-hero">
        <div>
            <p className="eyebrow">Activacion</p>
            <h1 className="heading">Activar cuenta</h1>
            <p className="subheading">Confirmamos el estado de tu registro.</p>
        </div>
        <div className="auth-card">
            {status === "loading" && <p className="muted">Procesando...</p>}
            {status === "success" && <div className="status success">{message}</div>}
            {status === "error" && <div className="status error">{message}</div>}
            <div style={{ marginTop: 12 }}>
            <Link className="btn btn-primary" href="/login">
                Ir al login
            </Link>
            </div>
        </div>
        </section>
    );
}
