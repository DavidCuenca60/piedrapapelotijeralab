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
  { value: "scissors", emoji: "✂️", label: "Scissors" },
];

export default function Game({ roomId, alias, onResult, onLeave }: Props) {
  const socket = useSocket();
  const [players, setPlayers] = useState<PlayerInfo[]>([{ alias }]);
  const [selected, setSelected] = useState<Choice | null>(null);
  const [status, setStatus] = useState("Waiting for the opponent...");
  const [readyPlayers, setReadyPlayers] = useState<string[]>([]);
  const onResultRef = useRef(onResult);

  useEffect(() => { onResultRef.current = onResult; }, [onResult]);

  useEffect(() => {
    socket.emit("room:join", { roomId, alias });

    socket.on("room:joined", ({ players: p }: { players: PlayerInfo[]; status: string }) => {
      setPlayers(p);
      if (p.length === 2) {
        setStatus("Both players are ready!");
      } else {
        setStatus("Waiting for the opponent...");
      }
    });

    socket.on("room:playerLeft", ({ alias: leftAlias }: { alias: string }) => {
      setPlayers((prev) => prev.filter((p) => p.alias !== leftAlias));
      setStatus(`${leftAlias} left the room`);
    });

    socket.on("game:playerReady", ({ alias: readyAlias }: { alias: string }) => {
      setReadyPlayers((prev) => {
        if (prev.includes(readyAlias)) return prev;
        return [...prev, readyAlias];
      });
      if (readyAlias === alias) {
        setStatus("Waiting for the opponent to choose...");
      } else {
        setStatus("The opponent already chose. Hurry up!");
      }
    });

    socket.on("game:result", (result: GameResult) => {
      onResultRef.current(result);
    });

    socket.on("game:restarted", () => {
      setSelected(null);
      setReadyPlayers([]);
      setStatus("New round! Choose your option.");
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
    <div style={{ maxWidth: 500, margin: "40px auto", padding: "0 20px" }}>
      <h1>Rock Paper Scissors</h1>

      <hr />

      <p>Room: <strong>{roomId}</strong></p>
      <p>You: <strong>{alias}</strong></p>
      <p><em>{status}</em></p>

      <hr />

      <h3>Players in the room:</h3>
      <ul>
        {players.map((p) => (
          <li key={p.alias}>
            {p.alias === alias ? `${p.alias} (You)` : p.alias}
            {" — "}
            {readyPlayers.includes(p.alias) ? "Ready" : "Choosing..."}
          </li>
        ))}
      </ul>

      <br />

      <h3>Choose your option:</h3>
      <div style={{ display: "flex", gap: 16, margin: "12px 0" }}>
        {choices.map((c) => (
          <button
            key={c.value}
            onClick={() => handleChoice(c.value)}
            disabled={!!selected || players.length < 2}
            style={{
              padding: "10px 16px",
              fontSize: 14,
              cursor: selected || players.length < 2 ? "not-allowed" : "pointer",
              fontWeight: selected === c.value ? "bold" : "normal",
              outline: selected === c.value ? "2px solid black" : "none",
            }}
          >
            <div style={{ fontSize: 36 }}>{c.emoji}</div>
            {c.label}
          </button>
        ))}
      </div>

      {players.length < 2 && (
        <p><em>Waiting for another player to join to play</em></p>
      )}

      <br />

      <button onClick={handleLeave} style={{ padding: "6px 16px", fontSize: 16 }}>
        Leave Room
      </button>
    </div>
  );
}