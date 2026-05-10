import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:2727";

// Socket singleton fuera del componente para que no se recree
const socket: Socket = io(SOCKET_URL, {
  autoConnect: true,
});

export function useSocket() {
  const socketRef = useRef<Socket>(socket);

  useEffect(() => {
    if (!socketRef.current.connected) {
      socketRef.current.connect();
    }
  }, []);

  return socketRef.current;
}