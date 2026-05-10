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

  const isWinner = result.winner === alias;
  const isTie = result.winner === "tie";

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", padding: "0 20px", fontFamily: "sans-serif", textAlign: "center" }}>
      <h1>🪨📄✂ Resultado</h1>

      {!revealed ? (
        <div style={countdownStyle}>
          <p style={{ fontSize: 20, color: "#888" }}>Revelando en...</p>
          <span style={{ fontSize: 80, fontWeight: "bold", color: "#4f46e5" }}>
            {countdown}
          </span>
        </div>
      ) : (
        <>
          <div style={resultCardStyle}>
            {result.players.map((p) => (
              <div key={p.alias} style={playerResultStyle}>
                <p style={{ fontSize: 18, fontWeight: "bold" }}>
                  {p.alias === alias ? `${p.alias} (tú)` : p.alias}
                </p>
                <span style={{ fontSize: 60 }}>
                  {emojiMap[p.choice!]}
                </span>
                <p style={{ color: "#888" }}>{p.choice}</p>
              </div>
            ))}
          </div>

          <div style={winnerBannerStyle(isTie, isWinner)}>
            {isTie ? (
              <p style={{ fontSize: 24 }}>🤝 ¡Empate!</p>
            ) : isWinner ? (
              <p style={{ fontSize: 24 }}>🎉 ¡Ganaste!</p>
            ) : (
              <p style={{ fontSize: 24 }}>😢 Perdiste</p>
            )}
            {!isTie && (
              <p style={{ color: "#555" }}>
                Ganador: <strong>{result.winner}</strong>
              </p>
            )}
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button onClick={handleRestart} style={restartButtonStyle}>
              🔄 Jugar de nuevo
            </button>
            <button onClick={onLeave} style={leaveButtonStyle}>
              🏠 Volver al inicio
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const countdownStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: 200,
};

const resultCardStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-around",
  padding: 20,
  backgroundColor: "#f3f4f6",
  borderRadius: 12,
  marginBottom: 20,
};

const playerResultStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 4,
};

const winnerBannerStyle = (isTie: boolean, isWinner: boolean): React.CSSProperties => ({
  padding: 16,
  borderRadius: 12,
  backgroundColor: isTie ? "#fef9c3" : isWinner ? "#dcfce7" : "#fee2e2",
  border: `2px solid ${isTie ? "#fde047" : isWinner ? "#86efac" : "#fca5a5"}`,
});

const restartButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: "12px",
  fontSize: 16,
  borderRadius: 8,
  border: "none",
  backgroundColor: "#4f46e5",
  color: "white",
  cursor: "pointer",
};

const leaveButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: "12px",
  fontSize: 16,
  borderRadius: 8,
  border: "none",
  backgroundColor: "#ef4444",
  color: "white",
  cursor: "pointer",
};