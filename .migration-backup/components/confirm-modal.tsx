"use client"

interface ConfirmModalProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({ title, message, confirmLabel = "تأكيد", cancelLabel = "إلغاء", onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 300 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#1a0a05", border: "1px solid #3a1f10", borderRadius: 16, padding: 24, width: "100%", maxWidth: 400 }}>
        <h2 style={{ color: "#c9a84c", margin: "0 0 8px", fontSize: 20, fontFamily: "serif" }}>{title}</h2>
        <p style={{ color: "#f5efe6", fontSize: 14, lineHeight: 1.6, margin: "0 0 20px", fontFamily: "'Cairo', sans-serif" }}>{message}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ padding: "9px 14px", borderRadius: 8, border: "1px solid #3a1f10", background: "transparent", color: "#f5efe6", cursor: "pointer", fontFamily: "'Cairo', sans-serif", fontSize: 13 }}>{cancelLabel}</button>
          <button onClick={onConfirm} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "#c9a84c", color: "#1a0a05", fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif", fontSize: 13 }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
