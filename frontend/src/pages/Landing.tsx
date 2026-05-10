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
      setError("Enter your alias name and create a room");
      return;
    }
    setError("");
    socket.emit("room:create", roomId.trim());
  };

  const handleJoin = (id: string) => {
    if (!alias.trim()) {
      setError("Enter your alias first");
      return;
    }
    setError("");
    setRoomId(id);
    roomIdRef.current = id;
    socket.emit("room:join", { roomId: id, alias: alias.trim() });
  };

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", padding: "0 20px" }}>
      <h1>Rock Paper Scissors</h1>

      <hr />

      <div style={{ marginBottom: 24 }}>
        <h2>Create or join a room</h2>

        <br />

        <input
          placeholder="Your Alias"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          style={{ display: "block", width: "100%", marginBottom: 8, padding: 6, fontSize: 16 }}
        />

        <input
          placeholder="Name of the Room"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          style={{ display: "block", width: "100%", marginBottom: 8, padding: 6, fontSize: 16 }}
        />

        <button onClick={handleCreate} style={{ padding: "6px 16px", fontSize: 16 }}>
          Create Room
        </button>

        {error && <p style={{ color: "red", marginTop: 8 }}>{error}</p>}
      </div>

      <hr />

      <div>
        <h2>Available Rooms</h2>
        <br />
        {rooms.length === 0 ? (
          <p>There are no available rooms</p>
        ) : (
          rooms.map((room) => (
            <div key={room.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, padding: "8px 0", borderBottom: "1px solid #ccc" }}>
              <div>
                <strong>{room.id}</strong>
                {" — "}
                <span style={{ color: room.status === "waiting" ? "green" : "red" }}>
                  {room.status === "waiting" ? "Waiting" : "Full"}
                </span>
                {" "}
                <span style={{ color: "#888" }}>({room.players}/2 players)</span>
              </div>
              <button
                onClick={() => handleJoin(room.id)}
                disabled={room.status === "full"}
                style={{ padding: "4px 12px", fontSize: 14 }}
              >
                Join
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}