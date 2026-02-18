import { DECISIONS } from "../game/decisions";
import { useGame } from "../game/GameContext";
import { addLog, clampAll, parliamentVote, pushDecisionToFeed } from "../game/gameEngine";

export default function DecisionPage({ title, category }) {
  const { game, setGame } = useGame();

  if (!game) {
    return (
      <div style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
        <h2>{title}</h2>
        <p style={{ opacity: 0.75 }}>Pick a country first.</p>
      </div>
    );
  }

  const list = DECISIONS.filter((d) => d.category === category);

  function choose(d) {
    if (game.choseDecisionThisTurn) return;

    const g = structuredClone(game);
    addLog(g, `Decision (${category}): ${d.title}`);

    if (d.needsVote) {
      const res = parliamentVote(g, 55);
      addLog(g, `Parliament vote: ${res.passed ? "PASSED" : "FAILED"} (${res.chance}%)`);
      g.stats.capital = Math.max(0, g.stats.capital - 1);
      if (!res.passed) {
        g.stats.happiness -= 2;
        g.stats.stability -= 2;
        g.choseDecisionThisTurn = true;
        clampAll(g);
        setGame(g);
        return;
      }
    }

    d.apply(g);
    pushDecisionToFeed(g, d.title, category);
    g.choseDecisionThisTurn = true;
    clampAll(g);
    setGame(g);
  }

  return (
    <div style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
      <h2 style={{ marginTop: 10 }}>{title}</h2>
      <p style={{ opacity: 0.75, marginTop: 6 }}>
        Make one decision per month. Then go to Dashboard → Next Month.
      </p>

      <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
        {list.map((d) => (
          <div key={d.id} style={{
            padding: 14,
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(0,0,0,0.16)"
          }}>
            <div style={{ fontWeight: 800 }}>{d.title}</div>
            <div style={{ opacity: 0.75, marginTop: 6 }}>{d.desc}</div>

            <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              {d.needsVote && <span style={{ opacity: 0.7 }}>Requires Parliament vote</span>}
              <button disabled={game.choseDecisionThisTurn} onClick={() => choose(d)}>
                Choose
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
