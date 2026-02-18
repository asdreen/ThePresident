import { useGame } from "../game/GameContext";
import { addLog, clampAll } from "../game/gameEngine";
import { getMinisterBonus, ministerRisk } from "../game/gameEngine";
import { getBudgetMultiplier } from "../game/gameEngine";

function Box({ title, children }) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 18,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.10)",
      }}
    >
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {children}
    </div>
  );
}

function StatLine({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", opacity: 0.92 }}>
      <span style={{ opacity: 0.75 }}>{label}</span>
      <b>{value}</b>
    </div>
  );
}

export default function Health() {
  const { game, setGame } = useGame();

  if (!game) {
    return (
      <div style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
        <h2>Health</h2>
        <p style={{ opacity: 0.75 }}>Pick a country first.</p>
      </div>
    );
  }

  const h = game.health;

  function doAction(type) {
    if (game.choseDecisionThisTurn) return;

    const g = structuredClone(game);
    const mult = getBudgetMultiplier(g, "health"); // example

    const { skill } = getMinisterBonus(g, "health");

    // One health action per month (counts as "decision")
    g.choseDecisionThisTurn = true;

    if (type === "build_hospital") {
      g.stats.money -= 220;
      g.health.hospitals += 1;
      g.health.healthInfrastructure += 4 + skill;
      g.stats.happiness += 2 + Math.floor(skill / 2);

      g.stats.stability += 1;
      addLog(g, "Health: Built a new public hospital.");
    }

    if (type === "expand_insurance") {
      g.stats.money -= 160;
      g.health.insuranceCoverage += 6;
      g.stats.happiness += 3;
      addLog(g, "Health: Expanded health insurance coverage.");
    }

    if (type === "vaccine_campaign") {
      g.stats.money -= 120;
      g.health.vaccinationRate += 10;
      g.stats.stability += 2;
      g.stats.happiness += 1;
      addLog(g, "Health: Launched a national vaccination campaign.");
    }

    if (type === "maternity_support") {
      g.stats.money -= 140;
      g.health.natalityPer1000 += 0.6;
      g.stats.happiness += 2;
      addLog(g, "Health: Introduced maternity & newborn support package.");
    }

    if (type === "anti_epidemic") {
      g.stats.money -= 110;
      g.health.vaccinationRate += 4;
      g.stats.stability += 1;
      g.stats.security += 1;
      addLog(g, "Health: Strengthened epidemic response (labs, stockpiles, protocols).");
    }

    // clamp health fields
    g.health.insuranceCoverage = clamp(g.health.insuranceCoverage, 0, 100);
    g.health.vaccinationRate = clamp(g.health.vaccinationRate, 0, 100);
    g.health.healthInfrastructure = clamp(g.health.healthInfrastructure, 0, 100);

    // Small corruption risk for big contracts
    if (type === "build_hospital" && Math.random() < 0.15) {
      g.stats.corruption += 2;
      addLog(g, "Health scandal: Hospital contract allegations appear in the media.");
    }

    clampAll(g);
    setGame(g);
    ministerRisk(g, "health", addLog);

  }

  // Births simulation (monthly): simple model
  // We'll calculate and show (not persist) births estimate + store newborns on Next Month later.
  const population = game.country?.population || 1_000_000;
  const estimatedMonthlyBirths = Math.round((population / 1000) * (h.natalityPer1000 / 12));

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
      <h2 style={{ marginTop: 10 }}>Health</h2>
      <p style={{ opacity: 0.75, marginTop: 6 }}>
        Hospitals, insurance, vaccination, natality, and health infrastructure.
      </p>

      {game.choseDecisionThisTurn && (
        <div
          style={{
            marginTop: 10,
            padding: 12,
            borderRadius: 14,
            border: "1px solid rgba(0,180,255,0.35)",
            background: "rgba(0,180,255,0.10)",
          }}
        >
          You already made a decision this month. Go to Dashboard → Next Month.
        </div>
      )}

      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Box title="Health Status">
          <StatLine label="Hospitals" value={h.hospitals} />
          <StatLine label="Beds per 1000" value={h.bedsPer1000} />
          <StatLine label="Doctors per 1000" value={h.doctorsPer1000} />
          <StatLine label="Insurance Coverage" value={`${h.insuranceCoverage}%`} />
          <StatLine label="Vaccination Rate" value={`${h.vaccinationRate}%`} />
          <StatLine label="Health Infrastructure" value={h.healthInfrastructure} />
          <StatLine label="Natality (per 1000)" value={h.natalityPer1000.toFixed(1)} />
          <StatLine label="Estimated monthly births" value={estimatedMonthlyBirths} />
        </Box>

        <Box title="Health Decisions">
          <div style={{ display: "grid", gap: 10 }}>
            <Decision
              title="Build Hospital"
              desc="Increase infrastructure and happiness. Expensive."
              disabled={game.choseDecisionThisTurn}
              onClick={() => doAction("build_hospital")}
            />
            <Decision
              title="Expand Health Insurance"
              desc="Increase insurance coverage and happiness."
              disabled={game.choseDecisionThisTurn}
              onClick={() => doAction("expand_insurance")}
            />
            <Decision
              title="Vaccination Campaign"
              desc="Raise vaccination rate and stability."
              disabled={game.choseDecisionThisTurn}
              onClick={() => doAction("vaccine_campaign")}
            />
            <Decision
              title="Maternity & Newborn Support"
              desc="Slightly increases natality and happiness."
              disabled={game.choseDecisionThisTurn}
              onClick={() => doAction("maternity_support")}
            />
            <Decision
              title="Epidemic Preparedness"
              desc="Better response capabilities; improves stability/security."
              disabled={game.choseDecisionThisTurn}
              onClick={() => doAction("anti_epidemic")}
            />
          </div>

          <div style={{ opacity: 0.7, marginTop: 10, fontSize: 12 }}>
            All decisions here are only health-related (as requested).
          </div>
        </Box>
      </div>
    </div>
  );
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function Decision({ title, desc, onClick, disabled }) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.16)",
      }}
    >
      <div style={{ fontWeight: 800 }}>{title}</div>
      <div style={{ opacity: 0.75, marginTop: 6 }}>{desc}</div>
      <div style={{ marginTop: 10 }}>
        <button disabled={disabled} onClick={onClick}>
          Choose
        </button>
      </div>
    </div>
  );
}
