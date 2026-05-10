export type Choice = "rock" | "paper" | "scissors";

export type RoomStatus = "waiting" | "full" | "finished";

export interface RoomInfo {
  id: string;
  status: RoomStatus;
  players: number;
}

export interface PlayerInfo {
  alias: string;
  choice?: Choice;
}

export interface GameResult {
  players: PlayerInfo[];
  winner: string; // alias del ganador o "tie"
}