import { useState, useEffect } from "react";
import { Icon } from "../primitives/Icon";
import { AlbumCover } from "../primitives/AlbumCover";

const T = {
  intro:   300,
  tag:     900,
  third:   1800,
  second:  2700,
  drumIn:  3600,
  winner:  4300,
  stats:   5200,
  bridge:  6400,
  act2:    7800,
  act3:    12800,
  cta:     13600,
};
const ORDER = ["intro","tag","third","second","drumIn","winner","stats","bridge","act2","act3","cta"];
const stageAt = (cur: string, target: string) => ORDER.indexOf(cur) >= ORDER.indexOf(target);

function Confetti({ on }: { on: boolean }) {
  if (!on) return null;
  const pieces = [...Array(48)].map((_, i) => ({
    id: i,
    x: (i * 137) % 100,
    delay: (i % 12) * 40,
    dur: 1800 + (i % 7) * 120,
    rot: (i * 53) % 360,
    color: ["#17a34a","#dbe7dd","#fff","#0a0a0a","#edf9ef"][i % 5],
    size: 6 + (i % 3) * 3,
  }));
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 2 }}>
      {pieces.map((p) => (
        <span key={p.id} style={{
          position: "absolute", top: -20, left: `${p.x}%`,
          width: p.size, height: p.size * 0.4,
          background: p.color, borderRadius: 1,
          transform: `rotate(${p.rot}deg)`,
          animation: `neroConfetti ${p.dur}ms cubic-bezier(.2,.6,.3,1) ${p.delay}ms forwards`,
          opacity: 0,
        }} />
      ))}
    </div>
  );
}

function useCountUp(target: number, ms: number, on: boolean) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!on) return;
    let start: number | null = null;
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    let raf: number;
    const step = (ts: number) => {
      if (start == null) start = ts;
      const t = Math.min(1, (ts - start) / ms);
      setV(Math.round(easeOut(t) * target));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [on, target, ms]);
  return v;
}

function Podium({ rank, track, stage, reveal }: { rank: number; track: any; stage: string; reveal: boolean }) {
  const visible = stageAt(stage, rank === 1 ? "winner" : rank === 2 ? "second" : "third");
  const height = { 1: 220, 2: 160, 3: 120 }[rank]!;
  const cover = { 1: 120, 2: 80, 3: 68 }[rank]!;
  const titleSize = { 1: 28, 2: 17, 3: 15 }[rank]!;
  const accent = rank === 1;
  const count = useCountUp(track.score ?? 0, 1200, visible);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(40px)",
      transition: "opacity 600ms var(--ease-nero), transform 700ms cubic-bezier(.2,.7,.3,1.2)",
    }}>
      <div style={{
        width: rank === 1 ? 56 : 40, height: rank === 1 ? 56 : 40, borderRadius: "50%",
        background: accent ? "#17a34a" : "rgba(255,255,255,0.08)",
        color: accent ? "#0a0a0a" : "rgba(255,255,255,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-display)", fontWeight: 700, fontSize: rank === 1 ? 22 : 15,
        border: accent ? "none" : "1px solid rgba(255,255,255,0.15)",
        boxShadow: accent ? "0 0 32px rgba(23,163,74,0.6)" : "none",
      }}>
        {rank === 1 ? <Icon name="crown" size={24} strokeWidth={1.8} color="#0a0a0a" /> : `#${rank}`}
      </div>

      <div style={{ filter: accent ? "drop-shadow(0 12px 32px rgba(23,163,74,0.5))" : "none" }}>
        <AlbumCover title={track.title} thumbnail={track.thumbnail} size={cover} radius={rank === 1 ? 18 : 10} />
      </div>

      <div style={{ textAlign: "center", color: "#fff", minHeight: rank === 1 ? 66 : 54 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: titleSize, fontWeight: accent ? 700 : 600, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          {track.title}
        </div>
        <div style={{ fontSize: rank === 1 ? 14 : 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{track.artist}</div>
        <div style={{ fontSize: 11, marginTop: 6, fontFamily: "var(--font-mono)", color: "rgba(255,255,255,0.4)" }}>
          added by <span style={{
            display: "inline",
            color: reveal ? "#4ade80" : "rgba(255,255,255,0.2)",
            background: reveal ? "transparent" : "rgba(255,255,255,0.08)",
            borderRadius: 4, padding: reveal ? 0 : "1px 6px",
            fontWeight: 600, transition: "all 400ms var(--ease-nero)",
          }}>
            {reveal ? track.addedBy : "???"}
          </span>
        </div>
      </div>

      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: rank === 1 ? "8px 16px" : "5px 11px",
        background: accent ? "#fff" : "rgba(255,255,255,0.06)",
        color: accent ? "#0a0a0a" : "rgba(255,255,255,0.7)",
        border: accent ? "none" : "1px solid rgba(255,255,255,0.12)",
        borderRadius: 9999, fontSize: rank === 1 ? 14 : 12, fontWeight: 600,
      }}>
        <span style={{ fontSize: rank === 1 ? 16 : 13 }}>👑</span>
        <span style={{ fontFamily: "var(--font-mono)" }}>{count}</span>
      </div>

      <div style={{
        width: rank === 1 ? 200 : 140, height, marginTop: 4,
        background: accent
          ? "linear-gradient(180deg, rgba(23,163,74,0.35) 0%, rgba(23,163,74,0.08) 100%)"
          : "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
        border: `1px solid ${accent ? "rgba(23,163,74,0.4)" : "rgba(255,255,255,0.08)"}`,
        borderBottom: "none",
        borderRadius: "12px 12px 0 0",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: 16,
        transform: visible ? "scaleY(1)" : "scaleY(0)",
        transformOrigin: "bottom",
        transition: `transform 700ms cubic-bezier(.2,.7,.3,1.2) ${accent ? 200 : 0}ms`,
      }}>
        <span style={{
          color: accent ? "#17a34a" : "rgba(255,255,255,0.25)",
          fontFamily: "var(--font-display)", fontSize: rank === 1 ? 64 : 42,
          fontWeight: 700, lineHeight: 1,
        }}>
          {rank}
        </span>
      </div>
    </div>
  );
}

function AuxecutiveReveal({ visible, auxecutive }: { visible: boolean; auxecutive: any }) {
  const [subStage, setSubStage] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const ids = [
      setTimeout(() => setSubStage(1), 1200),
      setTimeout(() => setSubStage(2), 2200),
      setTimeout(() => setSubStage(3), 3600),
    ];
    return () => ids.forEach(clearTimeout);
  }, [visible]);

  if (!visible || !auxecutive) return null;

  return (
    <div style={{ position: "relative", marginTop: 80, paddingTop: 64, borderTop: "1px solid rgba(255,255,255,0.08)", animation: "neroActIn 600ms var(--ease-nero) both" }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
        ✦  And the Auxecutive of the night is…  ✦
      </div>

      <div style={{ textAlign: "center", marginTop: 28 }}>
        <div style={{
          display: "inline-block",
          opacity: subStage >= 1 ? 1 : 0,
          transform: subStage >= 1 ? "scale(1)" : "scale(1.5)",
          transition: "opacity 280ms ease, transform 380ms cubic-bezier(.2,.8,.2,1.3)",
        }}>
          <div style={{
            width: 120, height: 120, borderRadius: "50%",
            background: "linear-gradient(135deg, #17a34a, #4ade80)",
            margin: "0 auto 16px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-display)", fontSize: 52, fontWeight: 700, color: "#0a0a0a",
            boxShadow: "0 0 60px rgba(23,163,74,0.7), 0 0 120px rgba(23,163,74,0.3)",
            animation: subStage >= 1 ? "neroAvatarPop 600ms cubic-bezier(.2,.8,.2,1.4) both" : "none",
          }}>
            {auxecutive.name.charAt(0)}
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(48px, 7vw, 84px)", fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1, color: "#fff", textShadow: "0 0 40px rgba(23,163,74,0.5)" }}>
            {auxecutive.name}
          </div>
          <div style={{ marginTop: 12, fontSize: 14, color: "rgba(255,255,255,0.6)", fontFamily: "var(--font-mono)" }}>
            score <span style={{ color: "#4ade80", fontWeight: 700 }}>{auxecutive.score?.toFixed(1)}</span>
            <span style={{ opacity: 0.4, margin: "0 8px" }}>·</span>
            {auxecutive.songs} songs queued
          </div>
        </div>
      </div>

      {auxecutive.topTracks?.length > 0 && (
        <div style={{ marginTop: 40, maxWidth: 540, margin: "40px auto 0", opacity: subStage >= 2 ? 1 : 0, transform: subStage >= 2 ? "translateY(0)" : "translateY(20px)", transition: "opacity 500ms ease, transform 600ms var(--ease-nero)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", textAlign: "center", marginBottom: 18 }}>Their set tonight</div>
          <div style={{ display: "grid", gap: 10, textAlign: "left" }}>
            {auxecutive.topTracks.map((t: any, i: number) => (
              <div key={t.title} style={{
                display: "grid", gridTemplateColumns: "18px 44px minmax(0,1fr)", gap: 14, alignItems: "center",
                padding: "10px 16px 10px 10px",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14,
                opacity: subStage >= 2 ? 1 : 0,
                transform: subStage >= 2 ? "translateX(0)" : "translateX(-20px)",
                transition: `opacity 400ms ease ${i * 120}ms, transform 500ms var(--ease-nero) ${i * 120}ms`,
              }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,0.4)", textAlign: "right" }}>{i + 1}</span>
                <AlbumCover title={t.title} thumbnail={t.thumbnail} size={44} radius={8} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{t.artist}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 32, textAlign: "center", opacity: subStage >= 3 ? 1 : 0, transform: subStage >= 3 ? "translateY(0)" : "translateY(12px)", transition: "opacity 500ms ease, transform 600ms var(--ease-nero)" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          padding: "10px 20px", borderRadius: 9999,
          background: "#fff", color: "#0a0a0a",
          fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14,
          boxShadow: "0 0 32px rgba(255,255,255,0.2)",
        }}>
          <Icon name="crown" size={16} strokeWidth={2} />
          First on aux next session
        </div>
      </div>
    </div>
  );
}

function Leaderboard({ rows, winnerName }: { rows: any[]; winnerName: string }) {
  return (
    <div style={{ padding: "22px 24px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>Full leaderboard</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(23,163,74,0.6)" }}>avg × ln(songs)</div>
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        {rows.map((r: any, i: number) => {
          const isWinner = r.name === winnerName;
          return (
            <div key={r.name} style={{
              display: "grid", gridTemplateColumns: "28px 1fr auto auto", gap: 12, alignItems: "center",
              padding: "10px 14px", borderRadius: 10,
              background: isWinner ? "rgba(23,163,74,0.1)" : "transparent",
              border: isWinner ? "1px solid rgba(23,163,74,0.3)" : "1px solid transparent",
            }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: isWinner ? "#4ade80" : "rgba(255,255,255,0.4)", textAlign: "right" }}>{i + 1}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: isWinner ? "#17a34a" : "rgba(255,255,255,0.08)", color: isWinner ? "#0a0a0a" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700 }}>
                  {r.name.charAt(0)}
                </div>
                <span style={{ fontSize: 14, fontWeight: isWinner ? 600 : 500, color: "#fff" }}>
                  {r.name}
                  {isWinner && <span style={{ marginLeft: 8, fontSize: 10, color: "#4ade80", letterSpacing: "0.1em", textTransform: "uppercase" }}>auxecutive</span>}
                </span>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{r.songs} song{r.songs !== 1 ? "s" : ""}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "#fff", minWidth: 42, textAlign: "right" }}>{r.score?.toFixed(1)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface PartyWinnerProps {
  results: any;
  onRestart: () => void;
  onHome: () => void;
}

export function PartyWinner({ results, onRestart, onHome }: PartyWinnerProps) {
  const [stage, setStage] = useState("intro");

  useEffect(() => {
    const seq: [string, number][] = [
      ["tag", T.tag], ["third", T.third], ["second", T.second],
      ["drumIn", T.drumIn], ["winner", T.winner], ["stats", T.stats],
      ["bridge", T.bridge], ["act2", T.act2], ["act3", T.act3], ["cta", T.cta],
    ];
    const ids = seq.map(([s, ms]) => setTimeout(() => setStage(s), ms));
    return () => ids.forEach(clearTimeout);
  }, []);

  const at = (s: string) => stageAt(stage, s);
  const { songPodium = [], auxecutive, leaderboard = [] } = results || {};
  const [winner, second, third] = songPodium;

  return (
    <div style={{
      position: "relative", minHeight: "100vh", overflow: "hidden",
      background: "radial-gradient(ellipse at 50% 20%, #14331f 0%, #0a0a0a 55%, #000 100%)",
      color: "#fff",
      animation: "neroWinnerIn 700ms ease both",
    }}>
      <div style={{
        position: "absolute", left: "50%", top: 620, transform: "translate(-50%,-50%)",
        width: 820, height: 820, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(23,163,74,0.22) 0%, transparent 60%)",
        animation: "neroGlowRot 18s linear infinite",
        pointerEvents: "none",
      }} />
      <Confetti on={at("winner")} />

      <div style={{ position: "relative", zIndex: 3, maxWidth: 980, margin: "0 auto", padding: "48px 24px 80px", textAlign: "center" }}>
        {/* Session chip */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 9999,
          background: "rgba(23,163,74,0.15)", color: "#4ade80",
          fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
          border: "1px solid rgba(23,163,74,0.3)",
          opacity: at("intro") ? 1 : 0, transition: "opacity 400ms ease",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", animation: "neroBlink 1.2s ease-in-out infinite" }} />
          Session complete
        </div>

        <div style={{ marginTop: 18, fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", opacity: at("tag") ? 1 : 0, transition: "opacity 500ms ease" }}>
          Act I · The Song
        </div>

        <h1 style={{
          fontFamily: "var(--font-display)", fontSize: "clamp(40px, 6.5vw, 76px)", fontWeight: 400,
          letterSpacing: "-0.035em", lineHeight: 1.02, margin: "8px 0 0", color: "#fff",
          opacity: at("tag") ? 1 : 0, transform: at("tag") ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 600ms ease, transform 700ms cubic-bezier(.2,.7,.3,1.1)",
        }}>
          Song of the Night.
        </h1>

        <div style={{ marginTop: 20, fontSize: 12, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#4ade80", opacity: stage === "drumIn" ? 1 : 0, transition: "opacity 300ms ease", height: 16 }}>
          <span style={{ display: "inline-block", animation: stage === "drumIn" ? "neroShake 180ms linear infinite" : "none" }}>
            ✦  Crowning the track  ✦
          </span>
        </div>

        {/* Podium */}
        {songPodium.length > 0 && (
          <div style={{ marginTop: 36, display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr", gap: 16, alignItems: "end", justifyItems: "center" }}>
            {second ? <Podium rank={2} track={second} stage={stage} reveal={at("bridge")} /> : <div />}
            {winner && <Podium rank={1} track={winner} stage={stage} reveal={at("bridge")} />}
            {third ? <Podium rank={3} track={third} stage={stage} reveal={at("bridge")} /> : <div />}
          </div>
        )}

        {/* Act II */}
        {at("bridge") && (
          <>
            <div style={{ marginTop: 64, fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", animation: "neroActIn 500ms var(--ease-nero) both" }}>
              Act II · The Aux
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4.5vw, 44px)", fontWeight: 400, letterSpacing: "-0.025em", lineHeight: 1.15, margin: "12px auto 0", maxWidth: 640, color: "rgba(255,255,255,0.85)", animation: "neroActIn 600ms var(--ease-nero) 120ms both" }}>
              But great songs don't pick themselves.
            </h2>
          </>
        )}

        <AuxecutiveReveal visible={at("act2")} auxecutive={auxecutive} />

        {/* Act III */}
        {at("act3") && (
          <>
            <div style={{ marginTop: 56, fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", animation: "neroActIn 500ms var(--ease-nero) both" }}>
              Act III · The Room
            </div>
            <div style={{ marginTop: 36, display: "grid", gap: 36, animation: "neroActIn 600ms var(--ease-nero) both" }}>
              {leaderboard.length > 0 && <Leaderboard rows={leaderboard} winnerName={auxecutive?.name} />}
            </div>
          </>
        )}

        {/* CTAs */}
        <div style={{
          marginTop: 40, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap",
          opacity: at("cta") ? 1 : 0, transform: at("cta") ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 500ms ease, transform 600ms var(--ease-nero)",
        }}>
          <button onClick={onRestart} style={{ padding: "14px 24px", borderRadius: 9999, border: "none", cursor: "pointer", background: "#17a34a", color: "#0a0a0a", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 0 24px rgba(23,163,74,0.4)" }}>
            <Icon name="plus" size={16} strokeWidth={2} /> Start Another
          </button>
          <button onClick={onHome} style={{ padding: "14px 24px", borderRadius: 9999, cursor: "pointer", background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 15, display: "inline-flex", alignItems: "center", gap: 8 }}>
            Back to Home <Icon name="arrowUR" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

