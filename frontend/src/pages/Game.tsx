import { useEffect, useRef, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import type { Choice, GameResult, PlayerInfo } from "../types";

interface Props {
  roomId: string;
  alias: string;
  onResult: (result: GameResult) => void;
  onLeave: () => void;
}

const choices: { value: Choice; emoji: string; label: string }[] = [
  { value: "rock", emoji: "🪨", label: "Rock" },
  { value: "paper", emoji: "📄", label: "Paper" },
  { value: "scissors", emoji: "✂️", label: "Sissors" },
];

export default function Game({ roomId, alias, onResult, onLeave }: Props) {
  const socket = useSocket();
  const [players, setPlayers] = useState<PlayerInfo[]>([{ alias }]);
  const [selected, setSelected] = useState<Choice | null>(null);
  const [status, setStatus] = useState("Waiting for the oponent...");
  const [readyPlayers, setReadyPlayers] = useState<string[]>([]);
  const onResultRef = useRef(onResult);

  useEffect(() => { onResultRef.current = onResult; }, [onResult]);

  useEffect(() => {
    socket.emit("room:join", { roomId, alias });

    socket.on("room:joined", ({ players: p }: { players: PlayerInfo[]; status: string }) => {
      setPlayers(p);
      if (p.length === 2) {
        setStatus("Both players are Ready!.");
      } else {
        setStatus("Waiting for the oponent...");
      }
    });

    socket.on("room:playerLeft", ({ alias: leftAlias }: { alias: string }) => {
      setPlayers((prev) => prev.filter((p) => p.alias !== leftAlias));
      setStatus(`❌ ${leftAlias} left the Room`);
    });

    socket.on("game:playerReady", ({ alias: readyAlias }: { alias: string }) => {
      setReadyPlayers((prev) => {
        if (prev.includes(readyAlias)) return prev;
        return [...prev, readyAlias];
      });
      if (readyAlias === alias) {
        setStatus("Waiting for the oponent to choose...");
      } else {
        setStatus("The oponent already chose. Hurry up!");
      }
    });

    socket.on("game:result", (result: GameResult) => {
      onResultRef.current(result);
    });

    socket.on("game:restarted", () => {
      setSelected(null);
      setReadyPlayers([]);
      setStatus("¡Nueva ronda! Elige tu opción.");
    });

    socket.on("room:deleted", () => {
      onLeave();
    });

    return () => {
      socket.off("room:joined");
      socket.off("room:playerLeft");
      socket.off("game:playerReady");
      socket.off("game:result");
      socket.off("game:restarted");
      socket.off("room:deleted");
    };
  }, [socket, roomId, alias, onLeave]);

  const handleLeave = () => {
    socket.emit("room:leave", roomId);
    onLeave();
  };

  const handleChoice = (choice: Choice) => {
    if (selected) return;
    setSelected(choice);
    socket.emit("game:choice", { roomId, choice });
  };

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", padding: "0 20px", fontFamily: "sans-serif" }}>
      <h1 style={{ textAlign: "center" }}>Rock Paper Scissors</h1>

      <div style={cardStyle}>
        <p>Room: <strong>{roomId}</strong></p>
        <p>You: <strong>{alias}</strong></p>
        <p style={{ color: "#4f46e5" }}>{status}</p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <h3>Players in the room:</h3>
        {players.map((p) => (
          <div key={p.alias} style={playerRowStyle}>
            <span>{p.alias === alias ? `${p.alias} (You)` : p.alias}</span>
            <span>
              {readyPlayers.includes(p.alias) ? "Ready" : "Choosing..."}
            </span>
          </div>
        ))}
      </div>

      <h3>Choose your option:</h3>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 24 }}>
        {choices.map((c) => (
          <button
            key={c.value}
            onClick={() => handleChoice(c.value)}
            disabled={!!selected || players.length < 2}
            style={{
              ...choiceButtonStyle,
              backgroundColor: selected === c.value ? "#4f46e5" : "#f3f4f6",
              color: selected === c.value ? "white" : "black",
              opacity: (selected && selected !== c.value) || players.length < 2 ? 0.4 : 1,
              cursor: selected || players.length < 2 ? "not-allowed" : "pointer",
            }}
          >
            <span style={{ fontSize: 40 }}>{c.emoji}</span>
            <span style={{ fontSize: 14 }}>{c.label}</span>
          </button>
        ))}
      </div>

      {players.length < 2 && (
        <p style={{ textAlign: "center", color: "#888", marginBottom: 16 }}>
            Waiting for another player to join to play
        </p>
      )}

      <button onClick={handleLeave} style={leaveButtonStyle}>
        Leave Room
      </button>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  backgroundColor: "#f3f4f6",
  borderRadius: 8,
  padding: 16,
  marginBottom: 20,
};

const playerRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "8px 12px",
  marginBottom: 8,
  borderRadius: 8,
  border: "1px solid #ddd",
  backgroundColor: "#f9f9f9",
};

const choiceButtonStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "16px 20px",
  borderRadius: 12,
  border: "2px solid #ddd",
  fontSize: 16,
  transition: "all 0.2s",
};

const leaveButtonStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "10px",
  fontSize: 16,
  borderRadius: 8,
  border: "none",
  backgroundColor: "#ef4444",
  color: "white",
  cursor: "pointer",
};