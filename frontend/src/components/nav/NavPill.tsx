import { useEffect, useState } from "react";

interface NavPillProps {
  onHome: () => void;
}

export function NavPill({ onHome }: NavPillProps) {
  const [visible, setVisible] = useState(true);
  const lastY = { current: 0 };

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const onScroll = () => {
      const currentY = window.scrollY;
      setVisible(currentY < lastScrollY || currentY < 10);
      lastScrollY = currentY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{
      position: "sticky", top: 16, zIndex: 10, margin: "16px auto 0", maxWidth: 420,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "12px 28px",
      background: "rgba(235,235,235,0.72)",
      backdropFilter: "blur(20px) saturate(1.4)",
      WebkitBackdropFilter: "blur(20px) saturate(1.4)",
      borderRadius: 9999,
      border: "1px solid rgba(0,0,0,0.04)",
      boxShadow: "0 1px 0 0 rgba(255,255,255,0.6) inset, 0 2px 8px rgba(0,0,0,0.04)",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(-12px)",
      transition: "opacity 240ms var(--ease-nero), transform 240ms var(--ease-nero)",
      pointerEvents: visible ? "auto" : "none",
    }}>
      <button
        onClick={onHome}
        style={{ cursor: "pointer", background: "transparent", border: "none", padding: 0, display: "block" }}
        aria-label="Go home"
      >
        <img src="/nero-lockup.png" alt="nero" style={{ height: 46, display: "block" }} />
      </button>
    </div>
  );
}
