import { useState, useEffect, useRef, useCallback } from "react";
import { Icon } from "../primitives/Icon";
import { Button } from "../primitives/Button";
import { Badge } from "../primitives/Badge";
import { Avatar } from "../primitives/Avatar";
import { AlbumCover } from "../primitives/AlbumCover";
import { socket } from "../../lib/socket";
import { api } from "../../lib/api";

// ─── Reaction types (3 standard + golden buzzer) ────────────────────────────
const REACTIONS = [
  { key: "dislike", emoji: "👎", label: "Dislike" },
  { key: "vibe",    emoji: "🙂", label: "Vibe"    },
  { key: "love",    emoji: "😍", label: "Love"    },
];
const emojiFor = (k: string) =>
  k === "crown" ? "👑" : (REACTIONS.find((r) => r.key === k)?.emoji ?? "🙂");

// ─── Floating reaction burst ─────────────────────────────────────────────────
interface FloatingBurst { id: number; emoji: string; x: number; gold?: boolean; }

function FloatingReactions({ burst }: { burst: FloatingBurst[] }) {
  return (
    <>
      {burst.map((b) => (
        <div
          key={b.id}
          style={{
            position: "absolute", left: b.x, bottom: 100,
            pointerEvents: "none", zIndex: b.gold ? 5 : 1,
            animation: b.gold
              ? "neroFloatGold 2400ms var(--ease-nero) forwards"
              : "neroFloat 1600ms var(--ease-nero) forwards",
            fontSize: b.gold ? 58 : 28, lineHeight: 1,
            filter: b.gold ? "drop-shadow(0 4px 24px rgba(212,160,23,0.8))" : "none",
          }}
        >
          {b.emoji}
        </div>
      ))}
    </>
  );
}

// ─── Toast notification ───────────────────────────────────────────────────────
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const hideTimer = setTimeout(() => setLeaving(true), 2800);
    return () => clearTimeout(hideTimer);
  }, []);

  useEffect(() => {
    if (!leaving) return;
    const removeTimer = setTimeout(onDone, 320);
    return () => clearTimeout(removeTimer);
  }, [leaving]);

  return (
    <div style={{
      position: "fixed", bottom: 28, left: "50%",
      zIndex: 200, pointerEvents: "none",
      animation: leaving
        ? "neroToastOut 320ms var(--ease-nero) forwards"
        : "neroToastIn 220ms var(--ease-nero) both",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 18px", borderRadius: 14,
        background: "#ffe9e9", color: "#c0392b",
        fontSize: 14, fontWeight: 500, fontFamily: "var(--font-body)",
        boxShadow: "0 8px 32px rgba(192,57,43,0.15)",
        border: "1px solid rgba(192,57,43,0.15)",
        whiteSpace: "nowrap",
      }}>
        {message}
      </div>
    </div>
  );
}

// ─── Copy button ─────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1400); }}
      style={{
        background: copied ? "#dbe7dd" : "#fff", color: copied ? "#17a34a" : "var(--fg-2)",
        border: "1px solid var(--border-default)", borderRadius: 9999,
        padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer",
        display: "flex", alignItems: "center", gap: 5, fontFamily: "var(--font-display)",
      }}
    >
      <Icon name={copied ? "check" : "copy"} size={12} strokeWidth={1.8} />
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// ─── Transport button (circular) ─────────────────────────────────────────────
function TransportButton({ icon, onClick, primary = false, size = 44, iconSize = 16, label, disabled = false }: {
  icon: string; onClick: () => void; primary?: boolean; size?: number;
  iconSize?: number; label?: string; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick} disabled={disabled} aria-label={label} title={label}
      style={{
        width: size, height: size, borderRadius: "50%",
        background: primary ? "#0a0a0a" : "#f2f2f2",
        color: primary ? "#fff" : "#0a0a0a",
        border: "none", cursor: disabled ? "default" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 160ms var(--ease-nero)",
        opacity: disabled ? 0.4 : 1,
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        const el = e.currentTarget as HTMLButtonElement;
        el.style.transform = "scale(1.06)";
        if (!primary) el.style.background = "#e8e8e8";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.transform = "none";
        if (!primary) el.style.background = "#f2f2f2";
      }}
    >
      <Icon name={icon} size={iconSize} strokeWidth={1.8} color="currentColor" />
    </button>
  );
}

// ─── Search bar ──────────────────────────────────────────────────────────────
function SearchBar({ onAdd }: { onAdd: (track: any) => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    clearTimeout(debounce.current);
    if (!q.trim()) { setResults([]); return; }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try { const { tracks } = await api.searchSongs(q); setResults(tracks); }
      finally { setLoading(false); }
    }, 350);
  }, [q]);

  const pick = (t: any) => { onAdd(t); setQ(""); setOpen(false); setResults([]); };

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      <div style={{
        display: "flex", gap: 10, padding: "12px 16px 12px 20px",
        background: "#f2f2f2", borderRadius: open && results.length ? "20px 20px 0 0" : 9999,
        alignItems: "center", transition: "border-radius 200ms var(--ease-nero)",
      }}>
        <Icon name="search" size={16} color="var(--fg-2)" />
        <input
          value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search a song or artist to add to the queue…"
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-body)", fontSize: 14, color: "#0a0a0a" }}
        />
        {q && (
          <button onClick={() => { setQ(""); setOpen(false); setResults([]); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--fg-muted)", display: "flex" }}>
            <Icon name="x" size={14} strokeWidth={2} />
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20,
          background: "#fff", border: "1px solid var(--border-default)",
          borderTop: "none", borderRadius: "0 0 20px 20px",
          boxShadow: "0 24px 48px rgba(0,0,0,0.08)",
          padding: 8, display: "grid", gap: 2, maxHeight: 320, overflow: "auto",
        }}>
          {results.map((t) => (
            <button key={t.spotifyId} onClick={() => pick(t)}
              style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: 12, alignItems: "center", padding: "8px 10px", borderRadius: 12, border: "none", background: "transparent", cursor: "pointer", textAlign: "left", width: "100%", transition: "background 120ms var(--ease-nero)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fafafa"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
              <AlbumCover title={t.title} thumbnail={t.thumbnail} size={36} radius={8} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0a0a0a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</div>
                <div style={{ fontSize: 12, color: "var(--fg-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.artist}</div>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-muted)" }}>
                {Math.floor(t.durationSecs / 60)}:{String(t.durationSecs % 60).padStart(2, "0")}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#0a0a0a", padding: "4px 10px", background: "#edf9ef", borderRadius: 9999 }}>
                <Icon name="plus" size={12} strokeWidth={2} /> Add
              </div>
            </button>
          ))}
        </div>
      )}
      {open && q.trim() && !loading && results.length === 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20, background: "#fff", border: "1px solid var(--border-default)", borderTop: "none", borderRadius: "0 0 20px 20px", padding: "16px 20px", fontSize: 13, color: "var(--fg-muted)" }}>
          No matches for "{q}"
        </div>
      )}
    </div>
  );
}

// ─── Confirm dialog (shared) ──────────────────────────────────────────────────
function ConfirmDialog({ open, onCancel, tag, tagColor, title, body, cancelLabel, confirmLabel, onConfirm }: {
  open: boolean; onCancel: () => void; onConfirm: () => void;
  tag: string; tagColor: string; title: string; body: string;
  cancelLabel: string; confirmLabel: string;
}) {
  if (!open) return null;
  return (
    <div onClick={onCancel} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(10,10,10,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 24, padding: "28px 28px 24px", maxWidth: 440, width: "100%", boxShadow: "0 30px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "inline-block", padding: "4px 10px", borderRadius: 9999, background: tagColor === "red" ? "#ffe9e9" : "#e9f0ff", color: tagColor === "red" ? "#c0392b" : "#2d3a8c", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{tag}</div>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 500, letterSpacing: "-0.015em", margin: "10px 0 4px" }}>{title}</h3>
        <p style={{ margin: 0, color: "var(--fg-3)", fontSize: 14 }}>{body}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
          <Button variant="ghost" size="md" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant="primary" size="md" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}

// ─── How It Works overlay ────────────────────────────────────────────────────
const HOW_STEPS = [
  { icon: "users",  title: "listen together",
    body: "Everyone hears the same song at the same time. Drop tracks into the shared queue — the aux is communal tonight." },
  { icon: "heart",  title: "react in real time",
    body: <>Tap <b>👎</b> <b>🙂</b> <b>😍</b> as a song plays. Reactions feed the leaderboard — each one's a vote for the track and the friend who queued it.</> },
  { icon: "crown",  title: "use your crown", gold: true,
    body: <>Everyone gets one 👑 per session. Counts for <b>8× a normal reaction</b>. Save it for the song that makes everyone lose it.</> },
  { icon: "skip",   title: "room votes to skip",
    body: <>Dislike is just a reaction — it still counts toward scoring. <b>Skip</b> is the room's separate vote to move on.</> },
  { icon: "flame",  title: "crown the night",
    body: <>When you end the session, Nero tallies everything to crown the <b>Song of the Night</b> — plus the <b>Auxecutive</b>, the friend with the best taste.</> },
];

function HowItWorks({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setStep((i) => Math.min(i + 1, HOW_STEPS.length - 1));
      if (e.key === "ArrowLeft") setStep((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;
  const s = HOW_STEPS[step];
  const isFirst = step === 0;
  const isLast = step === HOW_STEPS.length - 1;

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 90,
      background: "rgba(10,10,10,0.18)", backdropFilter: "blur(18px) saturate(1.1)",
      WebkitBackdropFilter: "blur(18px) saturate(1.1)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        position: "relative", width: "100%", maxWidth: 540, overflow: "hidden",
        background: "linear-gradient(180deg, rgba(232,247,234,0.92) 0%, rgba(244,251,245,0.92) 60%, rgba(252,254,252,0.92) 100%)",
        backdropFilter: "blur(24px) saturate(1.2)", WebkitBackdropFilter: "blur(24px) saturate(1.2)",
        border: "1px solid rgba(23,163,74,0.12)", borderRadius: 32,
        boxShadow: "0 30px 80px rgba(10,40,20,0.18), 0 1px 0 rgba(255,255,255,0.9) inset",
        padding: "40px 40px 32px",
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: "absolute", top: 20, right: 20, width: 36, height: 36, borderRadius: "50%",
          background: "rgba(255,255,255,0.9)", border: "1px solid rgba(10,10,10,0.06)",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name="x" size={14} strokeWidth={2} />
        </button>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, paddingRight: 52 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px",
            borderRadius: 9999, background: "rgba(255,255,255,0.7)", border: "1px solid rgba(23,163,74,0.25)",
            fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#17a34a",
          }}>
            Nero Party
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-muted)" }}>
            {String(step + 1).padStart(2, "0")} <span style={{ opacity: 0.5 }}>/ {String(HOW_STEPS.length).padStart(2, "0")}</span>
          </div>
        </div>

        {/* Step card */}
        <div key={step} style={{
          marginTop: 24, display: "flex", flexDirection: "column", gap: 18,
          padding: "34px 32px 32px", borderRadius: 22,
          background: "rgba(255,255,255,0.82)", border: "1px solid rgba(255,255,255,0.9)",
          boxShadow: "0 10px 30px rgba(10,40,20,0.08), 0 1px 0 rgba(255,255,255,0.9) inset",
          minHeight: 220,
        }}>
          <div style={{ position: "relative", width: 56, height: 56 }}>
            {s.gold && (
              <span style={{
                position: "absolute", inset: -6, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(23,163,74,0.28) 0%, rgba(23,163,74,0) 70%)",
                animation: "neroCrownPulse 1.8s ease-in-out infinite",
              }} />
            )}
            <div style={{ position: "relative", width: 56, height: 56, borderRadius: "50%", background: "#edf9ef", color: "#17a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={s.icon} size={26} strokeWidth={1.7} />
            </div>
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 500, letterSpacing: "-0.02em", color: "#0a0a0a", lineHeight: 1.05 }}>
            {s.title}
          </div>
          <div style={{ fontSize: 16, lineHeight: 1.55, color: "var(--fg-3)" }}>{s.body}</div>
        </div>

        {/* Dots */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 22 }}>
          {HOW_STEPS.map((_, i) => (
            <button key={i} onClick={() => setStep(i)} style={{
              width: i === step ? 22 : 7, height: 7, borderRadius: 9999,
              background: i === step ? "#0a0a0a" : "rgba(10,10,10,0.18)",
              border: "none", padding: 0, cursor: "pointer",
              transition: "width 220ms var(--ease-nero), background 160ms var(--ease-nero)",
            }} />
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginTop: 22 }}>
          <button onClick={() => setStep((i) => Math.max(i - 1, 0))} disabled={isFirst} style={{
            padding: "12px 18px", borderRadius: 9999, background: "transparent",
            color: isFirst ? "var(--fg-muted)" : "#0a0a0a", border: "1px solid rgba(10,10,10,0.12)",
            cursor: isFirst ? "default" : "pointer", opacity: isFirst ? 0.45 : 1,
            fontSize: 13, fontWeight: 600,
          }}>Back</button>
          <button onClick={() => isLast ? onClose() : setStep((i) => i + 1)} style={{
            padding: "12px 22px", borderRadius: 9999, background: "#0a0a0a", color: "#fff",
            border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
            display: "inline-flex", alignItems: "center", gap: 8,
            boxShadow: "0 10px 24px rgba(10,40,20,0.18)",
          }}>
            {isLast ? "Got it" : "Next"}
            {!isLast && <Icon name="arrowUR" size={14} strokeWidth={2.2} color="#fff" />}
          </button>
        </div>

      </div>
      <style>{`
        @keyframes neroCrownPulse {
          0%,100%{transform:scale(0.92);opacity:0.55}
          50%{transform:scale(1.18);opacity:0.95}
        }
      `}</style>
    </div>
  );
}

// ─── Reaction bar ────────────────────────────────────────────────────────────
function ReactionBar({ onReact, goldenUsed, skipVotes, skipThreshold, skipSelf, onSkipVote, isOwnSong }: {
  onReact: (k: string) => void;
  goldenUsed: boolean;
  skipVotes: number;
  skipThreshold: number;
  skipSelf: boolean;
  onSkipVote: () => void;
  isOwnSong: boolean;
}) {
  const skipPct = Math.min(100, (skipVotes / Math.max(skipThreshold, 1)) * 100);

  return (
    <div style={{
      background: "#fff", border: "1px solid var(--border-default)",
      borderRadius: 22, padding: 14,
      boxShadow: "0 2px 6px rgba(10,10,10,0.03)",
      display: "grid", gap: 10, alignContent: "start",
    }}>
      {/* 3 reaction buttons */}
      {isOwnSong && (
        <div style={{ padding: "8px 12px", borderRadius: 10, background: "#f5f5f5", border: "1px solid rgba(10,10,10,0.06)", fontSize: 12, color: "var(--fg-muted)", textAlign: "center" }}>
          You can't react to your own song
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {REACTIONS.map((r) => (
          <button key={r.key} onClick={() => !isOwnSong && onReact(r.key)} disabled={isOwnSong} title={isOwnSong ? "Can't react to your own song" : r.label}
            style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 6,
              padding: "14px 10px", borderRadius: 14,
              background: "linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.55))",
              border: "1px solid rgba(255,255,255,0.8)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 2px 10px rgba(10,10,10,0.04)",
              backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
              cursor: isOwnSong ? "not-allowed" : "pointer",
              opacity: isOwnSong ? 0.4 : 1,
              transition: "all 160ms var(--ease-nero)",
            }}
            onMouseEnter={(e) => { if (isOwnSong) return; const el = e.currentTarget as HTMLButtonElement; el.style.background = "linear-gradient(180deg, rgba(237,249,239,0.95), rgba(237,249,239,0.7))"; el.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { if (isOwnSong) return; const el = e.currentTarget as HTMLButtonElement; el.style.background = "linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.55))"; el.style.transform = "none"; }}
          >
            <span style={{ fontSize: 26, lineHeight: 1 }}>{r.emoji}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#0a0a0a", letterSpacing: "-0.01em" }}>{r.label}</span>
          </button>
        ))}
      </div>

      {/* Crown */}
      <button
        onClick={() => !goldenUsed && !isOwnSong && onReact("crown")}
        disabled={goldenUsed || isOwnSong}
        title={goldenUsed ? "Crown already used" : isOwnSong ? "Can't crown your own song" : "Crown · 8× weight · one per person"}
        style={{
          position: "relative", display: "flex", alignItems: "center", gap: 14,
          padding: "14px 18px", borderRadius: 14, width: "100%",
          background: goldenUsed || isOwnSong
            ? "linear-gradient(135deg, rgba(246,246,246,0.6), rgba(240,240,240,0.5))"
            : "linear-gradient(135deg, rgba(219,240,222,0.75) 0%, rgba(202,239,210,0.7) 55%, rgba(198,235,206,0.72) 100%)",
          border: goldenUsed || isOwnSong ? "1px dashed rgba(170,170,170,0.6)" : "1px solid rgba(23,163,74,0.22)",
          cursor: goldenUsed || isOwnSong ? "not-allowed" : "pointer",
          color: goldenUsed || isOwnSong ? "#9a9a9a" : "#0a0a0a",
          boxShadow: goldenUsed || isOwnSong
            ? "inset 0 1px 0 rgba(255,255,255,0.5)"
            : "0 6px 18px rgba(23,163,74,0.10), inset 0 1px 0 rgba(255,255,255,0.7)",
          backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
          opacity: isOwnSong ? 0.4 : 1,
          transition: "all 180ms var(--ease-nero)", textAlign: "left", overflow: "hidden",
        }}
        onMouseEnter={(e) => { if (!goldenUsed && !isOwnSong) (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "none"; }}
      >
        {!goldenUsed && (
          <div aria-hidden style={{ position: "absolute", top: -20, left: -10, right: -10, height: 30, background: "linear-gradient(180deg, rgba(255,255,255,0.55), transparent)", filter: "blur(6px)", pointerEvents: "none" }} />
        )}
        <span style={{
          fontSize: 26, lineHeight: 1, flex: "none",
          width: 44, height: 44, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: goldenUsed || isOwnSong ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.75)",
          border: goldenUsed || isOwnSong ? "1px dashed rgba(170,170,170,0.5)" : "1px solid rgba(23,163,74,0.15)",
          filter: goldenUsed || isOwnSong ? "grayscale(1) opacity(0.5)" : "none",
        }}>👑</span>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.2 }}>
            {goldenUsed ? "Crown used" : "Crown"}
          </span>
          <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.75, lineHeight: 1.3, marginTop: 2, color: goldenUsed || isOwnSong ? undefined : "var(--fg-3)" }}>
            {goldenUsed ? "Counted 8× in the final tally" : "8× weight · one per person"}
          </span>
        </div>
        {!goldenUsed && !isOwnSong && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px",
            borderRadius: 9999, background: "#0a0a0a", color: "#fff",
            fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
            flex: "none", whiteSpace: "nowrap",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#17a34a", boxShadow: "0 0 6px rgba(74,222,128,0.9)" }} />
            1 LEFT
          </span>
        )}
        {(goldenUsed || isOwnSong) && (
          <span style={{ padding: "5px 10px", borderRadius: 9999, background: "rgba(236,236,236,0.8)", color: "#9a9a9a", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", flex: "none" }}>
            SPENT
          </span>
        )}
      </button>

      {/* Room Vote divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--fg-muted)" }}>
        <span style={{ flex: "none" }}>Room Vote</span>
        <span style={{ flex: 1, height: 1, background: "rgba(10,10,10,0.08)" }} />
      </div>

      {/* Skip vote */}
      <button
        onClick={() => !skipSelf && onSkipVote()} disabled={skipSelf}
        title={skipSelf ? "You voted to skip" : `Vote to skip — ${skipVotes}/${skipThreshold} needed`}
        style={{
          position: "relative", display: "grid", gridTemplateColumns: "auto 1fr auto",
          alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, width: "100%",
          background: skipSelf ? "linear-gradient(180deg, rgba(20,20,20,0.92), rgba(20,20,20,0.85))" : "linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.45))",
          border: skipSelf ? "1px solid rgba(60,60,60,0.9)" : "1px solid rgba(255,255,255,0.75)",
          color: skipSelf ? "#fff" : "#0a0a0a",
          cursor: skipSelf ? "default" : "pointer",
          backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
          boxShadow: skipSelf ? "0 6px 20px rgba(10,10,10,0.25)" : "inset 0 1px 0 rgba(255,255,255,0.8), 0 2px 10px rgba(10,10,10,0.04)",
          textAlign: "left", transition: "all 180ms var(--ease-nero)", overflow: "hidden",
        }}
        onMouseEnter={(e) => { if (!skipSelf) (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "none"; }}
      >
        <span style={{ fontSize: 22, lineHeight: 1 }}>💀</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, whiteSpace: "nowrap" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em" }}>
              {skipSelf ? "You voted to skip" : "Skip this song"}
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, opacity: 0.75 }}>
              {skipVotes}/{skipThreshold}
            </span>
          </div>
          <div style={{ marginTop: 6, height: 4, borderRadius: 99, background: skipSelf ? "rgba(255,255,255,0.15)" : "rgba(10,10,10,0.08)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${skipPct}%`, background: skipSelf ? "linear-gradient(90deg,#ff6b6b,#ffa07a)" : "linear-gradient(90deg,#0a0a0a,#404040)", transition: "width 600ms var(--ease-nero)" }} />
          </div>
        </div>
        <span style={{
          padding: "4px 9px", borderRadius: 9999,
          background: skipSelf ? "rgba(255,255,255,0.12)" : "rgba(10,10,10,0.06)",
          color: skipSelf ? "#ffa07a" : "var(--fg-muted)",
          fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", flex: "none",
        }}>{skipSelf ? "VOTED" : "VOTE"}</span>
      </button>

    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
interface PartyLiveProps { party: any; participant: any; onEnd: (results: any) => void; onLeave: () => void; }

export function PartyLive({ party: initialParty, participant, onEnd, onLeave }: PartyLiveProps) {
  const [party] = useState(initialParty);
  const [songs, setSongs] = useState<any[]>(initialParty.songs || []);
  const [participants, setParticipants] = useState<any[]>(initialParty.participants || []);
  const [currentSong, setCurrentSong] = useState<any | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [burst, setBurst] = useState<FloatingBurst[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [endOpen, setEndOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [howOpen, setHowOpen] = useState(true);

  const showToast = (msg: string) => setToast(msg);


  // Crown — tracks whether the current participant has used theirs
  const [goldenUsed, setGoldenUsed] = useState(false);

  // Skip votes
  const [skipVotes, setSkipVotes] = useState(0);
  const [skipSelf, setSkipSelf] = useState(false);

  // Scrubbing (host only)
  const [scrubbing, setScrubbing] = useState(false);
  const [scrubPct, setScrubPct] = useState(0);
  const [justSeeked, setJustSeeked] = useState(false);
  const scrubBarRef = useRef<HTMLDivElement>(null);

  const burstId = useRef(0);
  const playerRef = useRef<any>(null);
  const playerDivRef = useRef<HTMLDivElement>(null);
  const ytReady = useRef(false);
  const isMutedRef = useRef(true);

  const isHost = participant.isHost;
  const partyUrl = `${window.location.origin}/party/${party.code}`;

  // ── Initial state restore ─────────────────────────────────────────────────
  useEffect(() => {
    // Crown state — only mark spent if THIS participant used theirs
    const myCrown = songs.flatMap((s: any) => s.crowns || []).find((c: any) => c.participantId === participant.id);
    if (myCrown) setGoldenUsed(true);

    // Current song
    const playing = songs.reduce<any | null>((best, s) => {
      if (!s.playedAt) return best;
      if (!best) return s;
      return new Date(s.playedAt) > new Date(best.playedAt) ? s : best;
    }, null);

    if (playing) {
      const sa = new Date(playing.playedAt).getTime();
      setCurrentSong(playing);
      setStartedAt(sa);
      const elapsed = (Date.now() - sa) / 1000;
      setProgress(Math.min(100, (elapsed / playing.durationSecs) * 100));
      if (playing.youtubeId) loadYouTubePlayer(playing.youtubeId, sa);
    }
  }, []);

  // ── Socket events ─────────────────────────────────────────────────────────
  useEffect(() => {
    socket.on("party:state", ({ party: p }) => {
      setSongs(p.songs || []);
      setParticipants(p.participants || []);
    });

    socket.on("queue:updated", ({ song, songId, action }: { song?: any; songId?: string; action: string }) => {
      if (action === "remove") {
        setSongs((prev) => prev.filter((s) => s.id !== songId));
      } else {
        setSongs((prev) => {
          if (!song) return prev;
          const exists = prev.find((s) => s.id === song.id);
          if (exists) return prev.map((s) => s.id === song.id ? { ...s, ...song } : s);
          return [...prev, song];
        });
      }
    });

    socket.on("playback:start", ({ song, startedAt: sa }: { song: any; startedAt: number }) => {
      setCurrentSong(song);
      setStartedAt(sa);
      setProgress(0);
      setIsPaused(false);
      setSkipVotes(0);
      setSkipSelf(false);
      loadYouTubePlayer(song.youtubeId, sa);
    });

    socket.on("playback:pause", (_: { elapsed: number }) => {
      setIsPaused(true);
      playerRef.current?.pauseVideo?.();
    });

    socket.on("playback:resume", ({ startedAt: sa }: { startedAt: number }) => {
      setStartedAt(sa);
      setIsPaused(false);
      const elapsed = (Date.now() - sa) / 1000;
      playerRef.current?.seekTo?.(elapsed, true);
      playerRef.current?.playVideo?.();
    });

    socket.on("reaction:new", ({ songId, participantId: pid, type }: { songId: string; participantId: string; type: string }) => {
      // Only show burst for other participants — self burst already fired on click
      if (pid !== participant.id) {
        setCurrentSong((cs: any) => {
          if (cs?.id !== songId) return cs;
          const id = ++burstId.current;
          setBurst((b) => [...b, { id, emoji: emojiFor(type), x: 400 + Math.random() * 200 }]);
          setTimeout(() => setBurst((b) => b.filter((x) => x.id !== id)), 1600);
          return cs;
        });
      }
    });

    socket.on("golden:used", ({ participantId: pid }: { songId: string; participantId: string; participantName: string }) => {
      if (pid === participant.id) {
        // Mark as spent — burst already fired on click, skip duplicate
        setGoldenUsed(true);
      } else {
        // Show burst for other participants who didn't click it themselves
        const id = ++burstId.current;
        setBurst((b) => [...b, { id, emoji: "👑", x: 480 + Math.random() * 120, gold: true }]);
        setTimeout(() => setBurst((b) => b.filter((x) => x.id !== id)), 2600);
      }
    });

    socket.on("skip:vote", ({ skipCount }: { songId: string; skipCount: number; threshold: number; autoSkip: boolean }) => {
      setSkipVotes(skipCount);
    });

    socket.on("participant:joined", (p: any) => {
      setParticipants((prev) => [...prev.filter((x) => x.id !== p.id), p]);
    });

    socket.on("participant:left", ({ participantId }: { participantId: string }) => {
      setParticipants((prev) => prev.filter((x) => x.id !== participantId));
    });

    socket.on("playback:seek", ({ startedAt: sa }: { startedAt: number }) => {
      setStartedAt(sa);
      setIsPaused(false);
      const elapsed = (Date.now() - sa) / 1000;
      playerRef.current?.seekTo?.(elapsed, true);
      playerRef.current?.playVideo?.();
    });

    socket.on("party:ended", (results: any) => { onEnd(results); });

    return () => {
      socket.off("party:state");
      socket.off("queue:updated");
      socket.off("playback:start");
      socket.off("playback:pause");
      socket.off("playback:resume");
      socket.off("playback:seek");
      socket.off("reaction:new");
      socket.off("golden:used");
      socket.off("skip:vote");
      socket.off("participant:joined");
      socket.off("participant:left");
      socket.off("party:ended");
    };
  }, []);

  // ── Progress ticker ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentSong || !startedAt || isPaused) return;
    const t = setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      setProgress(Math.min(100, (elapsed / currentSong.durationSecs) * 100));
    }, 500);
    return () => clearInterval(t);
  }, [currentSong, startedAt, isPaused]);

  // ── YouTube player ────────────────────────────────────────────────────────
  const loadYouTubePlayer = useCallback((videoId: string, sa: number) => {
    if (!videoId) return;
    const seekTo = Math.floor((Date.now() - sa) / 1000);

    if (playerRef.current) {
      playerRef.current.loadVideoById({ videoId, startSeconds: seekTo });
      setTimeout(() => {
        playerRef.current?.unMute?.();
        playerRef.current?.setVolume?.(100);
        isMutedRef.current = false;
      }, 800);
      return;
    }

    if (!ytReady.current) {
      if (!window.YT) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      window.onYouTubeIframeAPIReady = () => { ytReady.current = true; createPlayer(videoId, seekTo); };
      if (window.YT?.Player) { ytReady.current = true; createPlayer(videoId, seekTo); }
    } else {
      createPlayer(videoId, seekTo);
    }
  }, []);

  const createPlayer = (videoId: string, seekTo: number) => {
    if (!playerDivRef.current) return;
    playerRef.current = new window.YT.Player(playerDivRef.current, {
      height: "1", width: "1", videoId,
      playerVars: { autoplay: 1, start: seekTo, mute: 1 },
      events: {
        onReady: () => {
          setTimeout(() => {
            playerRef.current?.unMute?.();
            playerRef.current?.setVolume?.(100);
            isMutedRef.current = false;
          }, 800);
        },
        onStateChange: (e: any) => {
          if (e.data === 0 && isHost) nextSong();
        },
      },
    });
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const react = async (type: string) => {
    if (!currentSong || isOwnSong) return;
    if (type === "crown") {
      if (goldenUsed) return;
      const id = ++burstId.current;
      setBurst((b) => [...b, { id, emoji: "👑", x: 480 + Math.random() * 120, gold: true }]);
      setTimeout(() => setBurst((b) => b.filter((x) => x.id !== id)), 2600);
      try { await api.crownSong(currentSong.id, participant.id); } catch {}
      return;
    }
    // Fire burst immediately
    const id = ++burstId.current;
    setBurst((b) => [...b, { id, emoji: emojiFor(type), x: 560 + Math.random() * 80 }]);
    setTimeout(() => setBurst((b) => b.filter((x) => x.id !== id)), 1600);
    try { await api.reactToSong(currentSong.id, participant.id, type); } catch {}
  };

  const skipVote = async () => {
    if (!currentSong || skipSelf) return;
    setSkipSelf(true);
    try { await api.skipVote(currentSong.id, participant.id); } catch {}
  };

  const nextSong = async () => { try { await api.nextSong(party.id, participant.id); } catch {} };
  const prevSong = async () => {
    const playedCount = songs.filter((s: any) => s.playedAt).length;
    if (playedCount <= 1 && currentSong) {
      try { await api.seekSong(party.id, participant.id, 0); } catch {}
    } else {
      try { await api.prevSong(party.id, participant.id); } catch {}
    }
  };

  const getScrubPct = (e: MouseEvent | React.MouseEvent) => {
    const bar = scrubBarRef.current;
    if (!bar) return 0;
    const { left, width } = bar.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - left) / width));
  };
  const togglePause = async () => {
    try {
      if (isPaused) await api.resumeSong(party.id, participant.id);
      else await api.pauseSong(party.id, participant.id);
    } catch {}
  };

  const addSong = async (track: any) => {
    try { await api.addSong(party.id, participant.id, track); }
    catch (e: any) { showToast(e.message); }
  };

  const removeSong = async (songId: string) => {
    try { await api.removeSong(songId, participant.id); } catch {}
  };

  const endParty = async () => {
    try { const results = await api.endParty(party.id, participant.id); onEnd(results); }
    catch (e: any) { showToast(e.message); }
  };

  const leaveParty = async () => {
    try {
      await api.leaveParty(party.id, participant.id);
      sessionStorage.removeItem(`nero-party-${party.code}`);
      onLeave();
    } catch (e: any) { showToast(e.message); }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const formatTime = (secs: number) => `${Math.floor(secs / 60)}:${String(Math.floor(secs % 60)).padStart(2, "0")}`;
  const elapsed = currentSong ? (progress / 100) * currentSong.durationSecs : 0;
  const isOwnSong = !!currentSong && currentSong.addedBy === participant.name;
  // Threshold recalculates live as participants join/leave
  const skipThreshold = Math.ceil(participants.length * 0.75);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 1180, margin: "24px auto 80px", padding: "0 24px", position: "relative" }}>
      {/* Hidden YouTube player */}
      <div style={{ position: "fixed", bottom: -10, left: -10, width: 1, height: 1, overflow: "hidden", opacity: 0 }}>
        <div ref={playerDivRef} />
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: "6px 0 0", fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 600, letterSpacing: "-0.015em" }}>
            {party.name}
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {/* Invite code pill */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 8px 0 14px", background: "#f2f2f2", borderRadius: 9999, fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--fg-2)", height: 36, boxSizing: "border-box" }}>
            <span>{party.code}</span>
            <CopyButton text={partyUrl} />
          </div>
          {/* Participant avatars */}
          <div style={{ display: "flex", alignItems: "center" }}>
            {participants.slice(0, 6).map((u: any, i: number) => (
              <div key={u.id} style={{ marginLeft: i === 0 ? 0 : -8, border: "2px solid #fafafa", borderRadius: "50%" }}>
                <Avatar name={u.name} size={32} ring={u.id === participant.id} />
              </div>
            ))}
          </div>
          <Badge variant="live" dot style={{ height: 36, boxSizing: "border-box" }}>LIVE · {participants.length}</Badge>
          {isHost
            ? <Button variant="secondary" size="sm" style={{ height: 36 }} onClick={() => setEndOpen(true)}>End Session</Button>
            : <Button variant="secondary" size="sm" style={{ height: 36 }} onClick={() => setLeaveOpen(true)}>Leave Session</Button>
          }
          {/* How it works */}
          <button onClick={() => setHowOpen(true)} title="How a Nero Party works" style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "#0a0a0a", border: "none", cursor: "pointer",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: "#fff",
            boxShadow: "0 6px 16px rgba(10,40,20,0.18)",
            transition: "transform 160ms var(--ease-nero), background 160ms var(--ease-nero)",
          }}
          onMouseEnter={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.transform = "translateY(-1px) scale(1.04)"; el.style.background = "#17a34a"; }}
          onMouseLeave={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.transform = "none"; el.style.background = "#0a0a0a"; }}>
            ?
          </button>
        </div>
      </div>

      {/* Now Playing + Reaction Bar */}
      {currentSong ? (
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)", gap: 16, alignItems: "stretch" }}>
          {/* Now Playing card */}
          <div style={{ background: "#fff", border: "1px solid var(--border-default)", borderRadius: 24, padding: 24, display: "grid", gridTemplateColumns: "auto 1fr", gap: 28, alignItems: "center" }}>
            <AlbumCover title={currentSong.title} thumbnail={currentSong.thumbnail} size={200} radius={18} />
            <div style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.05, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingBottom: "0.15em" }}>
                {currentSong.title}
              </div>
              <div style={{ color: "var(--fg-3)", marginTop: 6, fontSize: 15 }}>
                {currentSong.artist} · added by {currentSong.addedBy}
              </div>
              {/* Progress / scrub bar */}
              <div
                ref={scrubBarRef}
                style={{ marginTop: 20, height: 4, background: "#ededed", borderRadius: 99, position: "relative", cursor: isHost ? "pointer" : "default" }}
                onMouseDown={isHost ? (e) => {
                  e.preventDefault();
                  const pct = getScrubPct(e);
                  setScrubbing(true);
                  setScrubPct(pct);
                  const onMove = (ev: MouseEvent) => setScrubPct(getScrubPct(ev));
                  const onUp = (ev: MouseEvent) => {
                    const finalPct = getScrubPct(ev);
                    const finalSecs = finalPct * (currentSong?.durationSecs ?? 0);
                    const newStartedAt = Date.now() - finalSecs * 1000;
                    // Set progress immediately so the bar is already at the right spot
                    // when scrubbing turns off — prevents the snap-back flicker
                    setProgress(Math.min(100, finalPct * 100));
                    setStartedAt(newStartedAt);
                    setScrubbing(false);
                    setJustSeeked(true);
                    setTimeout(() => setJustSeeked(false), 50);
                    playerRef.current?.seekTo?.(finalSecs, true);
                    playerRef.current?.playVideo?.();
                    api.seekSong(party.id, participant.id, finalSecs).catch(() => {});
                    window.removeEventListener("mousemove", onMove);
                    window.removeEventListener("mouseup", onUp);
                  };
                  window.addEventListener("mousemove", onMove);
                  window.addEventListener("mouseup", onUp);
                } : undefined}
              >
                <div style={{
                  height: "100%",
                  width: `${scrubbing ? scrubPct * 100 : progress}%`,
                  background: "#0a0a0a", borderRadius: 99,
                  transition: (scrubbing || justSeeked) ? "none" : "width 600ms linear",
                }} />
                {isHost && (
                  <div style={{
                    position: "absolute", top: "50%", transform: "translate(-50%, -50%)",
                    left: `${scrubbing ? scrubPct * 100 : progress}%`,
                    width: 12, height: 12, borderRadius: "50%",
                    background: "#0a0a0a", border: "2px solid #fff",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                    opacity: scrubbing ? 1 : 0,
                    transition: scrubbing ? "none" : "opacity 150ms",
                    pointerEvents: "none",
                  }} />
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-muted)" }}>
                <span>{formatTime(scrubbing ? scrubPct * currentSong.durationSecs : elapsed)}</span>
                <span>{formatTime(currentSong.durationSecs)}</span>
              </div>
              {/* Transport controls — host only */}
              {isHost && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 18 }}>
                  <TransportButton icon="skipBack" onClick={prevSong} label="Previous" />
                  <TransportButton icon={isPaused ? "play" : "pause"} onClick={togglePause} primary size={52} iconSize={isPaused ? 22 : 20} label={isPaused ? "Play" : "Pause"} />
                  <TransportButton icon="skipForward" onClick={nextSong} label="Next" />
                </div>
              )}
            </div>
          </div>

          {/* Reaction bar */}
          <ReactionBar
            onReact={react}
            goldenUsed={goldenUsed}
            skipVotes={skipVotes}
            skipThreshold={skipThreshold}
            skipSelf={skipSelf}
            onSkipVote={skipVote}
            isOwnSong={isOwnSong}
          />

          <FloatingReactions burst={burst} />
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid var(--border-default)", borderRadius: 24, padding: "40px 24px", textAlign: "center" }}>
          <div style={{ marginBottom: 12, color: "var(--fg-muted)", display: "flex", justifyContent: "center" }}>
            <Icon name="music" size={32} strokeWidth={1.6} />
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, color: "#0a0a0a" }}>
            {songs.length === 0 ? "Queue is empty" : "Ready to play"}
          </div>
          <div style={{ fontSize: 14, color: "var(--fg-3)", marginTop: 6 }}>
            {songs.length === 0
              ? "Add songs below to get the party started"
              : isHost
              ? 'Hit "Start Playing" to kick things off'
              : "Waiting for the host to start playing"}
          </div>
          {isHost && songs.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <Button variant="primary" size="md" onClick={nextSong}>Start Playing</Button>
            </div>
          )}
        </div>
      )}

      {/* Queue */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, letterSpacing: "-0.015em" }}>Shared Queue</h2>
          </div>
          <span style={{ fontSize: 12, color: "var(--fg-muted)" }}>{songs.length} in queue</span>
        </div>

        <div style={{ marginBottom: 14 }}>
          <SearchBar onAdd={addSong} />
        </div>

        {songs.length > 0 ? (
          <div style={{ background: "#fff", border: "1px solid var(--border-default)", borderRadius: 20, padding: 10, display: "grid", gap: 4 }}>
            {songs.map((s: any, i: number) => {
              const isPlaying = currentSong?.id === s.id;
              const hasCrown = (s.crowns || []).length > 0;
              const canDelete = !s.playedAt && !isPlaying && s.addedBy === participant.name;
              return (
                <div key={s.id} style={{
                  display: "grid", gridTemplateColumns: "28px 44px 1fr auto auto",
                  gap: 12, alignItems: "center", padding: "10px 14px", borderRadius: 14,
                  background: isPlaying ? "#edf9ef" : "transparent",
                  border: isPlaying ? "1px solid #caefd2" : "1px solid transparent",
                  transition: "all 240ms var(--ease-nero)",
                }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-muted)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <AlbumCover title={s.title} thumbnail={s.thumbnail} size={40} radius={8} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#0a0a0a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: "var(--fg-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "flex", alignItems: "center", gap: 6 }}>
                      {s.artist} · added by {s.addedBy}
                      {hasCrown && (
                        <span style={{ background: "#fffbe6", color: "#92710a", border: "1px solid #f5d87a", padding: "1px 7px", borderRadius: 9999, fontSize: 10, fontWeight: 700 }}>
                          👑 Crown
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-muted)", minWidth: 36, textAlign: "right" }}>
                    {formatTime(s.durationSecs)}
                  </div>
                  <div style={{ width: 28, display: "flex", justifyContent: "center" }}>
                    {canDelete && (
                      <button
                        onClick={() => removeSong(s.id)}
                        title="Remove from queue"
                        style={{
                          width: 28, height: 28, borderRadius: "50%", border: "none",
                          background: "transparent", color: "var(--fg-muted)",
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 140ms var(--ease-nero)",
                        }}
                        onMouseEnter={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.background = "#ffe9e9"; el.style.color = "#c0392b"; }}
                        onMouseLeave={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.background = "transparent"; el.style.color = "var(--fg-muted)"; }}
                      >
                        <Icon name="trash" size={13} strokeWidth={1.7} color="currentColor" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: "24px", textAlign: "center", color: "var(--fg-muted)", fontSize: 14, background: "#fafafa", borderRadius: 16, border: "1px solid var(--border-default)" }}>
            No songs yet — search above to add the first one
          </div>
        )}
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      <ConfirmDialog
        open={endOpen} onCancel={() => setEndOpen(false)} onConfirm={endParty}
        tag="End session" tagColor="red"
        title="Crown the winners now?"
        body="We'll tally reactions and crown the Song of the Night — plus the friend whose queue scored highest."
        cancelLabel="Keep going" confirmLabel="End & Tally"
      />
      <ConfirmDialog
        open={leaveOpen} onCancel={() => setLeaveOpen(false)} onConfirm={leaveParty}
        tag="Leave session" tagColor="blue"
        title="Leave this party?"
        body="You'll be removed from the session. You can rejoin using the party code."
        cancelLabel="Stay" confirmLabel="Leave"
      />
      <HowItWorks open={howOpen} onClose={() => setHowOpen(false)} />
    </div>
  );
}

declare global {
  interface Window { YT: any; onYouTubeIframeAPIReady: () => void; }
}
