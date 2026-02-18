import { useGame } from "../game/GameContext";
import { addLog, clampAll } from "../game/gameEngine";
import { getMinisterBonus, ministerRisk } from "../game/gameEngine";
import { getBudgetMultiplier } from "../game/gameEngine";

function Box({ title, children }) {
  return (
    <div style={{
      padding: 16,
      borderRadius: 18,
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.10)",
    }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {children}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", padding:"6px 0" }}>
      <span style={{ opacity:0.75 }}>{label}</span>
      <b>{value}</b>
    </div>
  );
}

export default function Sports() {
  const { game, setGame } = useGame();

  if (!game) {
    return (
      <div style={{ padding:16 }}>
        <h2>Sports</h2>
        <p>Select a country first.</p>
      </div>
    );
  }

  const s = game.sports;

  function doAction(type, teamIndex) {
    if (game.choseDecisionThisTurn) return;

    const g = structuredClone(game);
    const mult = getBudgetMultiplier(g, "health"); // example

    g.choseDecisionThisTurn = true;

    // ---- Federation memberships ----
    if (type === "join_fifa") {
      g.stats.money -= 80;
      g.sports.memberships.fifa = true;
      g.stats.happiness += 2;
      g.diplomacy.reputation += 1;
      addLog(g, "Sports: Joined FIFA.");
    }

    if (type === "join_fiba") {
      g.stats.money -= 60;
      g.sports.memberships.fiba = true;
      g.stats.happiness += 1;
      g.diplomacy.reputation += 1;
      addLog(g, "Sports: Joined FIBA.");
    }

    // ---- Team actions ----
    if (type === "hire_coach") {
      const coach = g.sports.staffPool.pop();
      if (coach) {
        g.sports.nationalTeams[teamIndex].coach = coach.name;
        g.sports.nationalTeams[teamIndex].ranking -= coach.skill * 2;
        g.stats.happiness += 1;
        addLog(g, `Sports: Hired coach ${coach.name}.`);
      }
    }
const { skill } = getMinisterBonus(g, "sports");
team.ranking -= skill;

    if (type === "invest_academy") {
      g.stats.money -= 90;
      g.sports.nationalTeams[teamIndex].academy += 6;
      g.stats.happiness += 1;
      addLog(g, "Sports: Invested in youth academy.");
    }

    // ---- Infrastructure ----
    if (type === "build_stadium") {
      g.stats.money -= 150;
      g.sports.facilities.stadiums += 1;
      g.stats.happiness += 2;
      addLog(g, "Sports: Built a new national stadium.");
    }

    ministerRisk(g, "sports", addLog);
    clampAll(g);
    setGame(g);
  }

  return (
    <div style={{ padding:16, maxWidth:1200, margin:"0 auto" }}>
      <h2>Sports</h2>
      <p style={{ opacity:0.75 }}>
        National teams, federations, coaches, and sports infrastructure.
      </p>

      {game.choseDecisionThisTurn && (
        <div style={{
          marginTop:10,
          padding:10,
          borderRadius:12,
          background:"rgba(0,180,255,0.12)"
        }}>
          One sports decision per month.
        </div>
      )}

      <div style={{ marginTop:14, display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <Box title="Federations">
          <Stat label="FIFA Member" value={s.memberships.fifa ? "Yes" : "No"} />
          <Stat label="FIBA Member" value={s.memberships.fiba ? "Yes" : "No"} />

          <div style={{ marginTop:10, display:"flex", gap:10 }}>
            {!s.memberships.fifa && (
              <button disabled={game.choseDecisionThisTurn} onClick={() => doAction("join_fifa")}>
                Join FIFA
              </button>
            )}
            {!s.memberships.fiba && (
              <button disabled={game.choseDecisionThisTurn} onClick={() => doAction("join_fiba")}>
                Join FIBA
              </button>
            )}
          </div>
        </Box>

        <Box title="Facilities">
          <Stat label="Stadiums" value={s.facilities.stadiums} />
          <Stat label="Arenas" value={s.facilities.arenas} />
          <Stat label="Training Centers" value={s.facilities.trainingCenters} />

          <div style={{ marginTop:10 }}>
            <button disabled={game.choseDecisionThisTurn} onClick={() => doAction("build_stadium")}>
              Build Stadium
            </button>
          </div>
        </Box>
      </div>

      <div style={{ marginTop:14 }}>
        <Box title="National Teams">
          {s.nationalTeams.map((t, i) => (
            <div key={i} style={{
              padding:12,
              borderBottom:"1px dashed rgba(255,255,255,0.12)"
            }}>
              <b>{t.sport}</b>
              <div style={{ opacity:0.85, marginTop:6 }}>
                Ranking: {t.ranking} | Academy: {t.academy}
              </div>
              <div style={{ opacity:0.85 }}>
                Coach: {t.coach || "None"}
              </div>

              <div style={{ marginTop:8, display:"flex", gap:10 }}>
                <button
                  disabled={game.choseDecisionThisTurn || !!t.coach}
                  onClick={() => doAction("hire_coach", i)}
                >
                  Hire Coach
                </button>
                <button
                  disabled={game.choseDecisionThisTurn}
                  onClick={() => doAction("invest_academy", i)}
                >
                  Invest Academy
                </button>
              </div>
            </div>
          ))}
        </Box>
      </div>
    </div>
  );
}
