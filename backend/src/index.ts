import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3232",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());


type Choice = "rock" | "paper" | "scissors";

interface Player {
  id: string;
  alias: string;
  choice: Choice | null;
}

interface Room {
  id: string;
  players: Player[];
  status: "waiting" | "full" | "finished";
}


const rooms = new Map<string, Room>();


function getWinner(p1: Player, p2: Player): string {
  if (p1.choice === p2.choice) return "tie";

  const wins: Record<Choice, Choice> = {
    rock: "scissors",
    paper: "rock",
    scissors: "paper",
  };

  return wins[p1.choice!] === p2.choice ? p1.alias : p2.alias;
}

function broadcastRooms() {
  const roomList = Array.from(rooms.values()).map((r) => ({
    id: r.id,
    status: r.status,
    players: r.players.length,
  }));
  io.emit("rooms:update", roomList);
}


io.on("connection", (socket) => {
  console.log(`Cliente conectado: ${socket.id}`);

  broadcastRooms();

  
  socket.on("rooms:get", () => {
    broadcastRooms();
  });

  
  socket.on("room:create", (roomId: string) => {
    if (rooms.has(roomId)) {
      socket.emit("room:error", "La sala ya existe");
      return;
    }

    const room: Room = { id: roomId, players: [], status: "waiting" };
    rooms.set(roomId, room);
    socket.join(roomId);
    socket.emit("room:created", roomId);
    broadcastRooms();
  });

  
  socket.on("room:join", ({ roomId, alias }: { roomId: string; alias: string }) => {
    const room = rooms.get(roomId);

    if (!room) {
      socket.emit("room:error", "La sala no existe");
      return;
    }

    
    const alreadyIn = room.players.find((p) => p.id === socket.id);
    if (alreadyIn) {
      socket.emit("room:joined", {
        roomId,
        players: room.players.map((p) => ({ alias: p.alias })),
        status: room.status,
      });
      return;
    }

    if (room.status === "full" || room.players.length >= 2) {
      socket.emit("room:error", "La sala está llena");
      return;
    }

    const player: Player = { id: socket.id, alias, choice: null };
    room.players.push(player);

    if (room.players.length === 2) {
      room.status = "full";
    }

    socket.join(roomId);
    io.to(roomId).emit("room:joined", {
      roomId,
      players: room.players.map((p) => ({ alias: p.alias })),
      status: room.status,
    });

    broadcastRooms();
  });

  
  socket.on("game:choice", ({ roomId, choice }: { roomId: string; choice: Choice }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const player = room.players.find((p) => p.id === socket.id);
    if (!player || player.choice) return;

    player.choice = choice;

    io.to(roomId).emit("game:playerReady", { alias: player.alias });

    const [p1, p2] = room.players;
    if (p1?.choice && p2?.choice) {
      const winner = getWinner(p1, p2);
      io.to(roomId).emit("game:result", {
        players: [
          { alias: p1.alias, choice: p1.choice },
          { alias: p2.alias, choice: p2.choice },
        ],
        winner,
      });
      room.status = "finished";
      broadcastRooms();
    }
  });

  
  socket.on("game:restart", (roomId: string) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.players.forEach((p) => (p.choice = null));
    room.status = room.players.length === 2 ? "full" : "waiting";
    io.to(roomId).emit("game:restarted");
    broadcastRooms();
  });

  
  socket.on("room:delete", (roomId: string) => {
    const room = rooms.get(roomId);
    if (!room) return;

    io.to(roomId).emit("room:deleted");
    rooms.delete(roomId);
    broadcastRooms();
  });

  
  socket.on("disconnect", () => {
    console.log(`Cliente desconectado: ${socket.id}`);

    for (const [roomId, room] of rooms.entries()) {
      const index = room.players.findIndex((p) => p.id === socket.id);
      if (index !== -1) {
        const alias = room.players[index]?.alias;
        room.players.splice(index, 1);

        if (room.players.length === 0) {
          rooms.delete(roomId);
        } else {
          room.status = "waiting";
          io.to(roomId).emit("room:playerLeft", { alias });
        }

        broadcastRooms();
        break;
      }
    }
  });


  
socket.on("room:leave", (roomId: string) => {
  const room = rooms.get(roomId);
  if (!room) return;

  const index = room.players.findIndex((p) => p.id === socket.id);
  if (index !== -1) {
    const alias = room.players[index]?.alias;
    room.players.splice(index, 1);
    socket.leave(roomId);

    if (room.players.length === 0) {
      rooms.delete(roomId);
    } else {
      room.status = "waiting";
      io.to(roomId).emit("room:playerLeft", { alias });
    }

    broadcastRooms();
  }
});
});


const PORT = process.env.PORT ?? 2727;
httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});