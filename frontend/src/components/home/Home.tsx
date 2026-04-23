import { useState, useEffect } from "react";
import { Icon } from "../primitives/Icon";
import { Button } from "../primitives/Button";


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

function FeatureTile({ icon, name, desc }: { icon: string; name: string; desc: string }) {
  return (
    <div style={{
      position: "relative",
      background: "rgba(255,255,255,0.75)",
      backdropFilter: "blur(24px) saturate(1.4)",
      border: "1px solid rgba(255,255,255,0.9)",
      borderRadius: 24,
      padding: "28px 30px",
      boxShadow: "0 8px 28px -10px rgba(10,10,10,0.08), 0 2px 6px rgba(0,0,0,0.03)",
      overflow: "hidden",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: "rgba(23,163,74,0.1)", border: "1px solid rgba(23,163,74,0.22)",
          display: "flex", alignItems: "center", justifyContent: "center", color: "#17a34a",
        }}>
          <Icon name={icon} size={20} strokeWidth={1.8} />
        </div>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500, textTransform: "lowercase", letterSpacing: "-0.015em", color: "#0a0a0a" }}>
          {name}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--fg-2)" }}>{desc}</p>
    </div>
  );
}

interface HomeProps {
  onStartParty: () => void;
  onJoinParty: () => void;
}

export function Home({ onStartParty, onJoinParty }: HomeProps) {
  const variants = ["dibs on aux", "to choose the vibe", "to queue up bangers", "song of the night"];
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % variants.length), 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <div>
      {/* Hero */}
      <section style={{ position: "relative", padding: "96px 0 80px", textAlign: "center", overflow: "hidden" }}>
        <div style={{ position: "relative", zIndex: 1, maxWidth: 960, margin: "0 auto", padding: "0 24px" }}>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(44px, 7vw, 104px)",
            fontWeight: 400,
            letterSpacing: "-0.03em",
            lineHeight: 1.08,
            margin: 0,
            color: "#0a0a0a",
          }}>
            <div style={{ marginBottom: "0.14em" }}>Who should get</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.24em", whiteSpace: "nowrap" }}>
              <span
                key={i}
                style={{
                  display: "inline-block",
                  padding: "0.08em 0.4em 0.16em",
                  background: "#0a0a0a",
                  color: "#fff",
                  fontWeight: 700,
                  borderRadius: 9999,
                  lineHeight: 1,
                  animation: "neroCapIn 320ms var(--ease-nero)",
                }}
              >
                {variants[i]}
              </span>
              <span>?</span>
            </div>
          </h1>

          <div style={{ marginTop: 56, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <button
              onClick={onStartParty}
              style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "16px 34px",
                fontSize: 17,
                fontWeight: 500,
                fontFamily: "var(--font-display)",
                color: "#0a0a0a",
                background: "#fff",
                border: "2px solid #17a34a",
                borderRadius: 9999,
                cursor: "pointer",
                letterSpacing: "-0.005em",
                animation: "neroGlow 2200ms var(--ease-nero) infinite",
                transition: "transform 200ms var(--ease-nero), background 200ms var(--ease-nero), color 200ms var(--ease-nero), box-shadow 200ms var(--ease-nero)",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.transform = "scale(1.04)";
                el.style.background = "#f0fdf4";
                el.style.color = "#2d5a3d";
                el.style.boxShadow = "0 0 0 6px rgba(23,163,74,0.12), 0 0 28px rgba(23,163,74,0.22)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.transform = "none";
                el.style.background = "#fff";
                el.style.color = "#0a0a0a";
                el.style.boxShadow = "";
              }}
            >
              Start a Listening Party
            </button>

            <button
              onClick={onJoinParty}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: 14,
                color: "var(--fg-3)",
                fontFamily: "var(--font-body)",
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 8px",
              }}
            >
              Got a code? Join a party <Icon name="arrowUR" size={13} />
            </button>
          </div>

          <p style={{ marginTop: 48, fontSize: 18, color: "var(--fg-3)", lineHeight: 1.5, maxWidth: 640, margin: "48px auto 0" }}>
            Drop a link, invite your friends, build a shared queue.<br />
            Every song you add gets rated. Crown the song of the night, and the friend with the best taste in the room.
          </p>
        </div>
      </section>

      {/* Feature grid */}
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 24px" }}>
        <section style={{
          position: "relative",
          padding: "64px 32px 72px",
          margin: "72px 0 40px",
          borderRadius: 32,
          overflow: "hidden",
          background: "radial-gradient(ellipse at 20% 0%, rgba(23,163,74,0.18) 0%, transparent 55%), radial-gradient(ellipse at 80% 100%, rgba(23,163,74,0.15) 0%, transparent 55%), #f8faf8",
        }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(120deg, rgba(23,163,74,0.04) 0 1px, transparent 1px 28px)", pointerEvents: "none" }} />
          <div style={{ position: "relative", textAlign: "center", marginBottom: 44 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 12px",
              background: "rgba(23,163,74,0.1)", color: "#17a34a",
              border: "1px solid rgba(23,163,74,0.25)", borderRadius: 9999,
              fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#17a34a" }} />
              Nero Party
            </div>
            <h2 style={{ margin: "14px 0 0", fontFamily: "var(--font-display)", fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 400, letterSpacing: "-0.025em", color: "#0a0a0a", lineHeight: 1.05 }}>
              Built for listening parties.
            </h2>
          </div>
          <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, maxWidth: 900, margin: "0 auto" }}>
            <FeatureTile icon="users" name="join with a code" desc="Share a 6-character code. Anyone clicks the link and they're in. No accounts, no downloads." />
            <FeatureTile icon="music" name="shared queue" desc="Everyone searches and adds songs. Not feeling it? A room vote at 75% skips it." />
            <FeatureTile icon="heart" name="react in real time" desc="👎 Dislike, 🙂 Vibe, or 😍 Love each song as it plays. You also get one 👑 Crown per session. Save it for the track that deserves it most. It counts 8x." />
            <FeatureTile icon="crown" name="scored reveal" desc="When the session ends, songs are ranked by weighted reactions. The Auxecutive (whoever queued the best set) gets crowned." />
          </div>
        </section>

        {/* CTA */}
        <section style={{
          margin: "72px 0",
          padding: "48px 40px",
          background: "linear-gradient(90deg, #f2f2f2 0%, #edf9ef 100%)",
          borderRadius: 28,
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: 40,
          alignItems: "center",
        }}>
          <div>
            <span style={{
              display: "inline-block", padding: "4px 10px",
              background: "rgba(23,163,74,0.08)", color: "#17a34a",
              border: "1px solid rgba(23,163,74,0.35)", borderRadius: 9999,
              fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
            }}>New</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 56, fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.05, margin: "16px 0 0", display: "flex", alignItems: "baseline", gap: "0.18em", flexWrap: "wrap" }}>
              <span>Nero</span>
              <span style={{ display: "inline-block", padding: "0.12em 0.42em 0.18em", background: "#0a0a0a", color: "#fff", fontWeight: 700, borderRadius: 9999, lineHeight: 1 }}>Party</span>
            </h2>
            <p style={{ fontSize: 18, color: "var(--fg-3)", maxWidth: 420, marginTop: 16 }}>
              Listen together. Queue together. Crown the best song and the best taste in the room.
            </p>
            <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
              <Button variant="primary" size="md" onClick={onStartParty}>Start a Listening Party</Button>
              <Button variant="ghost" size="md" iconRight="arrowUR" onClick={onJoinParty}>Join a party</Button>
            </div>
          </div>
          <div style={{ opacity: 0.4, display: "flex", justifyContent: "flex-end" }}>
            <FlameMark size={180} />
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer style={{ marginTop: 96, padding: "56px 48px 64px", borderTop: "1px solid var(--border-default)" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 48, flexWrap: "wrap" }}>
          <div style={{ fontSize: 13, color: "var(--fg-1)", lineHeight: 1.5 }}>
            <div>support@nero.fan</div>
            <div style={{ color: "var(--fg-2)" }}>Powering Nero Party.</div>
          </div>
          <div style={{ fontSize: 13, color: "var(--fg-1)" }}>© 2026 Nero Tech Inc.</div>
        </div>
      </footer>
    </div>
  );
}
