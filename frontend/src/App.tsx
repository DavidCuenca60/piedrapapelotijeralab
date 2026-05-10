import { useState } from "react";
import Landing from "./pages/Landing";
import Game from "./pages/Game";
import Result from "./pages/Result";
import type { GameResult } from "./types";

export type Page = "landing" | "game" | "result";

export interface AppState {
  page: Page;
  roomId: string;
  alias: string;
  result: GameResult | null;
}

function App() {
  const [state, setState] = useState<AppState>({
    page: "landing",
    roomId: "",
    alias: "",
    result: null,
  });

  const goToGame = (roomId: string, alias: string) => {
    setState((prev) => ({ ...prev, page: "game", roomId, alias }));
  };

  const goToResult = (result: GameResult) => {
    setState((prev) => ({ ...prev, page: "result", result }));
  };

  const goToLanding = () => {
    setState({ page: "landing", roomId: "", alias: "", result: null });
  };

  const goBackToGame = () => {
    setState((prev) => ({ ...prev, page: "game", result: null }));
  };

  return (
    <>
      {state.page === "landing" && (
        <Landing onJoin={goToGame} />
      )}
      {state.page === "game" && (
        <Game
          roomId={state.roomId}
          alias={state.alias}
          onResult={goToResult}
          onLeave={goToLanding}
        />
      )}
      {state.page === "result" && (
        <Result
          result={state.result!}
          roomId={state.roomId}
          alias={state.alias}
          onRestart={goBackToGame}
          onLeave={goToLanding}
        />
      )}
    </>
  );
}

export default App;