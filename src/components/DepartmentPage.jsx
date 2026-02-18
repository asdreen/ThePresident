import { DECISIONS } from "../game/decisions";
import { useGame } from "../game/GameContext";
import { addLog, clampAll, parliamentVote, pushDecisionToFeed } from "../game/gameEngine";

function Panel({ title, children }) {
  return (
    <div style={{
      padding: 16,
      borderRadius: 18,
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.10)"
    }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {children}
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div style={{
      display:"flex", justifyContent:"space-between", alignItems:"center",
      padding:"10px 12px", borderRadius:14,
      background:"rgba(0,0,0,0.18)",
      border:"1px solid rgba(255,255,255,0.08)"
    }}>
      <span style={{ opacity: 0.75 }}>{label}</span>
      <span style={{
        fontWeight: 800,
        padding: "4px 10px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.10)"
      }}>{value}</span>
    </div>
  );
}

export default function DepartmentPage({ title, category, highlights = [] }) {
  const { game, setGame } = useGame();

  if (!game) {
    return (
      <div style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
        <h2>{title}</h2>
        <p style={{ opacity: 0.75 }}>Pick a country first.</p>
      </div>
    );
  }

  const list = DECISIONS.filter(d => d.category === category);
  const s = game.stats;

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
    <div style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
      <h2 style={{ marginTop: 10 }}>{title}</h2>
      <p style={{ opacity: 0.75, marginTop: 6 }}>
        Choose 1 decision per month (from any department), then go to Dashboard → Next Month.
      </p>

      <div style={{ marginTop: 14, display:"grid", gridTemplateColumns:"1fr 1fr", gap: 14 }}>
        <Panel title="Key Indicators">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 10 }}>
            {highlights.map(h => (
              <StatRow key={h.label} label={h.label} value={h.value({ game, stats: s })} />
            ))}
          </div>
        </Panel>

        <Panel title="Available Actions">
          <div style={{ display:"grid", gap: 10 }}>
            {list.map(d => (
              <div key={d.id} style={{
                padding: 14,
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(0,0,0,0.16)"
              }}>
                <div style={{ fontWeight: 800 }}>{d.title}</div>
                <div style={{ opacity: 0.75, marginTop: 6 }}>{d.desc}</div>
                <div style={{ marginTop: 10, display:"flex", gap: 10, flexWrap:"wrap", alignItems:"center" }}>
                  {d.needsVote && <span style={{ opacity: 0.7 }}>Requires Parliament vote</span>}
                  <button disabled={game.choseDecisionThisTurn} onClick={() => choose(d)}>Choose</button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
