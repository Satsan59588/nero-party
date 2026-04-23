import { useState, useEffect } from "react";
import { Icon } from "../primitives/Icon";
import { Button } from "../primitives/Button";
import { api } from "../../lib/api";

interface JoinPartyModalProps {
  open: boolean;
  onClose: () => void;
  onJoined: (party: any, participant: any) => void;
  initialCode?: string;
}

export function JoinPartyModal({ open, onClose, onJoined, initialCode = "" }: JoinPartyModalProps) {
  const [code, setCode] = useState(initialCode);

  // Sync if the code arrives after mount (e.g. from URL restore)
  useEffect(() => { if (initialCode) setCode(initialCode); }, [initialCode]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const join = async () => {
    if (!code.trim()) { setError("Enter a party code"); return; }
    if (!name.trim()) { setError("Enter your name"); return; }
    setLoading(true);
    setError("");
    try {
      const { party, participant } = await api.joinParty(code.trim().toUpperCase(), name.trim());
      onJoined(party, participant);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(10,10,10,0.45)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        animation: "neroModalBgIn 200ms var(--ease-nero)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 440, background: "#fff", borderRadius: 28,
          padding: "32px 32px 28px", position: "relative",
          boxShadow: "0 40px 80px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.08)",
          animation: "neroModalIn 240ms var(--ease-nero)",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 18, right: 18, width: 36, height: 36,
            borderRadius: 9999, background: "#f2f2f2", border: "none",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Icon name="x" size={16} strokeWidth={1.8} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#17a34a", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#17a34a" }} />
          Join a Party
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.1, margin: "10px 0 6px" }}>
          Enter the room
        </h2>

        <div style={{ marginTop: 24, display: "grid", gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Party code
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="XXXXXX"
              maxLength={6}
              style={{
                marginTop: 8, width: "100%", boxSizing: "border-box",
                padding: "12px 16px", borderRadius: 12, border: "1px solid var(--border-default)",
                background: "#fafafa", fontFamily: "var(--font-mono)", fontSize: 18,
                letterSpacing: "0.12em", textTransform: "uppercase",
                color: "#0a0a0a", outline: "none",
              }}
              onFocus={(e) => { e.target.style.background = "#fff"; e.target.style.borderColor = "#0a0a0a"; }}
              onBlur={(e) => { e.target.style.background = "#fafafa"; e.target.style.borderColor = "var(--border-default)"; }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Your name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What should we call you?"
              onKeyDown={(e) => e.key === "Enter" && join()}
              style={{
                marginTop: 8, width: "100%", boxSizing: "border-box",
                padding: "12px 16px", borderRadius: 12, border: "1px solid var(--border-default)",
                background: "#fafafa", fontFamily: "var(--font-body)", fontSize: 15,
                color: "#0a0a0a", outline: "none",
              }}
              onFocus={(e) => { e.target.style.background = "#fff"; e.target.style.borderColor = "#0a0a0a"; }}
              onBlur={(e) => { e.target.style.background = "#fafafa"; e.target.style.borderColor = "var(--border-default)"; }}
            />
          </div>

          {error && (
            <div style={{ fontSize: 13, color: "#c0392b", background: "#ffe9e9", padding: "10px 14px", borderRadius: 10 }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ marginTop: 26, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Button variant="ghost" size="md" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" onClick={join} disabled={loading}>
            {loading ? "Joining…" : "Join Party"}
          </Button>
        </div>
      </div>
    </div>
  );
}
