import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import type { GameResult } from "../types";

interface Props {
  result: GameResult;
  roomId: string;
  alias: string;
  onRestart: () => void;
  onLeave: () => void;
}

const emojiMap = {
  rock: "🪨",
  paper: "📄",
  scissors: "✂️",
};

export default function Result({ result, roomId, alias, onRestart, onLeave }: Props) {
  const socket = useSocket();
  const [countdown, setCountdown] = useState(3);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(interval);
          setRevealed(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleRestart = () => {
    socket.emit("game:restart", roomId);
    onRestart();
  };

  const handleLeave = () => {
    socket.emit("room:leave", roomId);
    onLeave();
  };

  const isWinner = result.winner === alias;
  const isTie = result.winner === "tie";

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", padding: "0 20px", textAlign: "center" }}>
      <h1>Results</h1>

      <hr />

      {!revealed ? (
        <div style={{ margin: "40px 0" }}>
          <p>Revealing in...</p>
          <p style={{ fontSize: 80 }}>{countdown}</p>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-around", margin: "24px 0" }}>
            {result.players.map((p) => (
              <div key={p.alias}>
                <p><strong>{p.alias === alias ? `${p.alias} (You)` : p.alias}</strong></p>
                <p style={{ fontSize: 60 }}>{emojiMap[p.choice!]}</p>
                <p>{p.choice}</p>
              </div>
            ))}
          </div>

          <hr />

          <div style={{ margin: "16px 0" }}>
            {isTie ? (
              <p style={{ fontSize: 24 }}>It's a Tie!</p>
            ) : isWinner ? (
              <p style={{ fontSize: 24 }}>You Won!</p>
            ) : (
              <p style={{ fontSize: 24 }}>You Lost</p>
            )}
            {!isTie && (
              <p>Winner: <strong>{result.winner}</strong></p>
            )}
          </div>

          <hr />

          <div style={{ display: "flex", gap: 12, marginTop: 16, justifyContent: "center" }}>
            <button onClick={handleRestart} style={{ padding: "6px 16px", fontSize: 16 }}>
              Play Again
            </button>
            <button onClick={handleLeave} style={{ padding: "6px 16px", fontSize: 16 }}>
              Back to Lobby
            </button>
          </div>
        </>
      )}
    </div>
  );
}