import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loadGame, saveGame, clearGame } from "./storage";
import { newGame } from "./gameEngine";

const GameCtx = createContext(null);

export function GameProvider({ children }) {
  const [game, setGame] = useState(() => loadGame() || null);

  useEffect(() => {
    if (game) saveGame(game);
  }, [game]);

  const api = useMemo(() => ({
    game,
    setGame,
    startNew: (country) => setGame(newGame(country)),
    clear: () => {
      clearGame();
      setGame(null);
    },
  }), [game]);

  return <GameCtx.Provider value={api}>{children}</GameCtx.Provider>;
}

export function useGame() {
  const ctx = useContext(GameCtx);
  if (!ctx) throw new Error("useGame must be used inside GameProvider");
  return ctx;
}
