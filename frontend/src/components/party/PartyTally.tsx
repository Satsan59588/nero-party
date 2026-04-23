import { useEffect, useState } from "react";

const STEPS = [
  { label: "Counting reactions…",        hint: "scanning the room" },
  { label: "Crediting each queue…",      hint: "linking songs → queuers" },
  { label: "Computing weighted scores…", hint: "avg × log(songs)" },
  { label: "Crowning the Auxecutive…",   hint: "who had the aux tonight" },
];

function FlameMark({ size = 20, color = "#17a34a" }: { size?: number; color?: string }) {
  return (
    <span style={{
      display: "inline-block",
      width: size,
      height: size * (200 / 157),
      backgroundColor: color,
      WebkitMaskImage: "url(/nero-logo.png)",
      maskImage: "url(/nero-logo.png)",
      WebkitMaskRepeat: "no-repeat",
      maskRepeat: "no-repeat",
      WebkitMaskSize: "contain",
      maskSize: "contain",
    }} />
  );
}

interface PartyTallyProps {
  onDone: () => void;
  duration?: number;
}

export function PartyTally({ onDone, duration = 5200 }: PartyTallyProps) {
  const [stepIdx, setStepIdx] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const stepMs = duration / STEPS.length;
    const interval = setInterval(() => {
      setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
    }, stepMs);
    // Start fade and switch screen simultaneously — PartyWinner renders beneath while tally fades
    const fadeTimer = setTimeout(() => { setFadingOut(true); onDone(); }, duration);
    return () => { clearInterval(interval); clearTimeout(fadeTimer); };
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 60,
      background: "#0a0a0a",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 24, textAlign: "center",
      opacity: fadingOut ? 0 : 1,
      transition: "opacity 600ms ease",
      pointerEvents: fadingOut ? "none" : "auto",
      animation: "neroTallyIn 260ms var(--ease-nero)",
    }}>
      {/* Concentric rings */}
      <svg width="420" height="420" viewBox="0 0 420 420" style={{ position: "absolute", opacity: 0.5 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <circle
            key={i} cx="210" cy="210" r={40 + i * 34}
            fill="none" stroke="#17a34a" strokeWidth="1" strokeOpacity={0.4 - i * 0.07}
            style={{ animation: `neroPulse ${2400 + i * 160}ms var(--ease-nero) ${i * 120}ms infinite` }}
          />
        ))}
      </svg>

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 560 }}>
        <div style={{ display: "flex", justifyContent: "center", animation: "neroFlamePulse 1600ms var(--ease-nero) infinite" }}>
          <FlameMark size={72} color="#17a34a" />
        </div>

        <div style={{ fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#17a34a", marginTop: 22 }}>
          Session complete
        </div>

        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 44, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.1, margin: "10px 0 28px", color: "#fff" }}>
          Tallying the results…
        </h1>

        <div style={{ display: "grid", gap: 8, maxWidth: 340, margin: "0 auto 28px" }}>
          {STEPS.map((step, i) => {
            const done = i < stepIdx;
            const active = i === stepIdx;
            const pending = i > stepIdx;
            return (
              <div key={step.label} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                borderRadius: 12, textAlign: "left",
                background: active ? "rgba(23,163,74,0.1)" : "transparent",
                border: active ? "1px solid rgba(23,163,74,0.3)" : "1px solid transparent",
                opacity: pending ? 0.35 : 1,
                transition: "all 280ms var(--ease-nero)",
              }}>
                <span style={{
                  width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: done ? "#17a34a" : "transparent",
                  border: done ? "none" : `1.5px solid ${active ? "#17a34a" : "rgba(255,255,255,0.2)"}`,
                }}>
                  {done && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 12 5 5L20 7" />
                    </svg>
                  )}
                  {active && (
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#17a34a", animation: "neroDotPulse 900ms var(--ease-nero) infinite" }} />
                  )}
                </span>
                <span style={{ fontSize: 14, color: done ? "rgba(255,255,255,0.6)" : active ? "#fff" : "rgba(255,255,255,0.5)", fontWeight: active ? 500 : 400, flex: 1 }}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
