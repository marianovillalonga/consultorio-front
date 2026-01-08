type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title = "Confirmar accion",
  message,
  confirmLabel = "Aceptar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" style={{ background: "rgba(12,18,46,0.55)" }} onClick={onCancel}>
      <div
        className="modal-card"
        style={{
          maxWidth: 460,
          padding: 20,
          borderRadius: 14,
          border: "1px solid #e3e8f4",
          boxShadow: "0 18px 38px rgba(15,23,42,0.28)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <p className="label" style={{ margin: 0 }}>
            {title}
          </p>
          <button className="btn ghost" type="button" onClick={onCancel}>
            Cerrar
          </button>
        </div>
        <p className="muted" style={{ marginBottom: 16 }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn" type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className="btn btn-primary" type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
