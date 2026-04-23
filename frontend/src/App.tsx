import { useState, useEffect } from "react";
import { Home } from "./components/home/Home";
import { NavPill } from "./components/nav/NavPill";
import { CreatePartyModal } from "./components/party/CreatePartyModal";
import { JoinPartyModal } from "./components/party/JoinPartyModal";
import { PartyLive } from "./components/party/PartyLive";
import { PartyTally } from "./components/party/PartyTally";
import { PartyWinner } from "./components/party/PartyWinner";
import { joinPartyRoom } from "./lib/socket";

type Screen = "home" | "live" | "tally" | "winner";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [party, setParty] = useState<any>(null);
  const [participant, setParticipant] = useState<any>(null);
  const [results, setResults] = useState<any>(null);

  // Check for party code in URL on load
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/party\/([A-Z0-9]{6})$/i);
    if (!match) return;

    const code = match[1].toUpperCase();
    // sessionStorage is per-tab — so a new tab always shows the join modal
    // even if the host has a session open in another tab
    const stored = sessionStorage.getItem(`nero-party-${code}`);

    async function restoreOrJoin() {
      if (stored) {
        try {
          const { party: p, participant: part } = JSON.parse(stored);
          // Verify the party still exists on the server
          const { party: fresh } = await import("./lib/api").then((m) =>
            m.api.getParty(code)
          );
          setParty(fresh);
          setParticipant(part);
          joinPartyRoom(fresh.id, part.id);
          setScreen("live");
          return;
        } catch {
          // Party gone or stale — clear and fall through to join
          sessionStorage.removeItem(`nero-party-${code}`);
          window.history.replaceState({}, "", "/");
        }
      }
      // No session in this tab — show join modal with code pre-filled
      setJoinCode(code);
      setJoinOpen(true);
    }

    restoreOrJoin();
  }, []);

  const onCreated = (p: any, part: any) => {
    setParty(p);
    setParticipant(part);
    setCreateOpen(false);
    sessionStorage.setItem(`nero-party-${p.code}`, JSON.stringify({ party: p, participant: part }));
    joinPartyRoom(p.id, part.id);
    // Update URL
    window.history.pushState({}, "", `/party/${p.code}`);
    setScreen("live");
  };

  const onJoined = (p: any, part: any) => {
    setParty(p);
    setParticipant(part);
    setJoinOpen(false);
    sessionStorage.setItem(`nero-party-${p.code}`, JSON.stringify({ party: p, participant: part }));
    joinPartyRoom(p.id, part.id);
    window.history.pushState({}, "", `/party/${p.code}`);
    setScreen("live");
  };

  const onEnd = (res: any) => {
    setResults(res);
    setScreen("tally");
  };

  const onTallyDone = () => {
    setScreen("winner");
  };

  // Keep body background dark during tally + winner so there's no white flash on transition
  useEffect(() => {
    if (screen === "tally" || screen === "winner") {
      document.body.style.background = "#0a0a0a";
    } else {
      document.body.style.background = "";
    }
  }, [screen]);

  const goHome = () => {
    setScreen("home");
    setParty(null);
    setParticipant(null);
    setResults(null);
    window.history.pushState({}, "", "/");
  };

  // Don't show NavPill on winner screen (it has its own dark theme)
  const showNav = screen !== "winner";

  return (
    <div>
      {showNav && <NavPill onHome={goHome} />}

      {screen === "home" && (
        <Home
          onStartParty={() => setCreateOpen(true)}
          onJoinParty={() => setJoinOpen(true)}
        />
      )}

      {screen === "live" && party && participant && (
        <PartyLive
          party={party}
          participant={participant}
          onEnd={onEnd}
          onLeave={goHome}
        />
      )}

      {(screen === "tally" || screen === "winner") && <PartyTally onDone={onTallyDone} />}

      {screen === "winner" && results && (
        <PartyWinner
          results={results}
          onRestart={() => { goHome(); setCreateOpen(true); }}
          onHome={goHome}
        />
      )}

      <CreatePartyModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={onCreated}
      />

      <JoinPartyModal
        open={joinOpen}
        onClose={() => { setJoinOpen(false); setJoinCode(""); }}
        onJoined={onJoined}
        initialCode={joinCode}
      />
    </div>
  );
}
