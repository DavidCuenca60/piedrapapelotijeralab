import { useEffect, useRef, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import type { RoomInfo } from "../types";

interface Props {
  onJoin: (roomId: string, alias: string) => void;
}

export default function Landing({ onJoin }: Props) {
  const socket = useSocket();
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [roomId, setRoomId] = useState("");
  const [alias, setAlias] = useState("");
  const [error, setError] = useState("");

  const aliasRef = useRef(alias);
  const roomIdRef = useRef(roomId);

  useEffect(() => { aliasRef.current = alias; }, [alias]);
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);

  useEffect(() => {
    // Pedir salas al montar el componente
    socket.emit("rooms:get");

    socket.on("rooms:update", (updatedRooms: RoomInfo[]) => {
      setRooms(updatedRooms);
    });

    socket.on("room:created", (id: string) => {
      socket.emit("room:join", { roomId: id, alias: aliasRef.current });
    });

    socket.on("room:joined", () => {
      onJoin(roomIdRef.current, aliasRef.current);
    });

    socket.on("room:error", (msg: string) => {
      setError(msg);
    });

    socket.on("room:deleted", () => {
      setError("La sala fue eliminada");
      socket.emit("rooms:get");
    });

    return () => {
      socket.off("rooms:update");
      socket.off("room:created");
      socket.off("room:joined");
      socket.off("room:error");
      socket.off("room:deleted");
    };
  }, [socket, onJoin]);

  const handleCreate = () => {
    if (!roomId.trim() || !alias.trim()) {
      setError("Ingresa un nombre de sala y un alias");
      return;
    }
    setError("");
    socket.emit("room:create", roomId.trim());
  };

  const handleJoin = (id: string) => {
    if (!alias.trim()) {
      setError("Ingresa tu alias primero");
      return;
    }
    setError("");
    setRoomId(id);
    roomIdRef.current = id;
    socket.emit("room:join", { roomId: id, alias: alias.trim() });
  };

  const handleDelete = (id: string) => {
    socket.emit("room:delete", id);
  };

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", padding: "0 20px", fontFamily: "sans-serif" }}>
      <h1 style={{ textAlign: "center" }}>🪨📄✂ Rock Paper Scissors</h1>

      <div style={{ marginBottom: 24 }}>
        <h2>Crear o unirse a sala</h2>

        <input
          placeholder="Tu alias"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          style={inputStyle}
        />

        <input
          placeholder="Nombre de la sala"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          style={inputStyle}
        />

        <button onClick={handleCreate} style={buttonStyle}>
          Crear sala
        </button>

        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>

      <div>
        <h2>Salas disponibles</h2>
        {rooms.length === 0 ? (
          <p style={{ color: "#888" }}>No hay salas disponibles</p>
        ) : (
          rooms.map((room) => (
            <div key={room.id} style={roomCardStyle}>
              <div>
                <strong>{room.id}</strong>
                <span style={{ marginLeft: 8, color: room.status === "waiting" ? "green" : "red" }}>
                  {room.status === "waiting" ? "⏳ Esperando" : "🔒 Llena"}
                </span>
                <span style={{ marginLeft: 8, color: "#888" }}>
                  ({room.players}/2 jugadores)
                </span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => handleJoin(room.id)}
                  disabled={room.status === "full"}
                  style={{
                    ...smallButtonStyle,
                    backgroundColor: "#4f46e5",
                    opacity: room.status === "full" ? 0.5 : 1,
                    cursor: room.status === "full" ? "not-allowed" : "pointer",
                  }}
                >
                  Unirse
                </button>
                <button
                  onClick={() => handleDelete(room.id)}
                  style={{
                    ...smallButtonStyle,
                    backgroundColor: "#ef4444",
                    cursor: "pointer",
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "10px",
  marginBottom: 10,
  fontSize: 16,
  borderRadius: 8,
  border: "1px solid #ccc",
  boxSizing: "border-box",
};

const buttonStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "10px",
  marginTop: 8,
  fontSize: 16,
  borderRadius: 8,
  border: "none",
  backgroundColor: "#4f46e5",
  color: "white",
  cursor: "pointer",
};

const smallButtonStyle: React.CSSProperties = {
  padding: "8px 16px",
  fontSize: 14,
  borderRadius: 8,
  border: "none",
  color: "white",
};

const roomCardStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px",
  marginBottom: 10,
  borderRadius: 8,
  border: "1px solid #ddd",
  backgroundColor: "#f9f9f9",
};