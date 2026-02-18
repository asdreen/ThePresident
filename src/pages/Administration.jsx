import { useState } from "react";
import { useGame } from "../game/GameContext";
import { addLog, clampAll } from "../game/gameEngine";
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

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function Decision({ title, desc, disabled, onClick }) {
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

export default function Administration() {
  const { game, setGame } = useGame();
  const [selectedRegion, setSelectedRegion] = useState(0);

  if (!game) {
    return (
      <div style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
        <h2>Administration</h2>
        <p style={{ opacity: 0.75 }}>Pick a country first.</p>
      </div>
    );
  }

  const a = game.administration;
  const regions = a.regions || [];
  const region = regions[selectedRegion] || regions[0];

  function doAction(type) {
    if (game.choseDecisionThisTurn) return;

    const g = structuredClone(game);
    const mult = getBudgetMultiplier(g, "health"); // example

    g.choseDecisionThisTurn = true;

    const admin = g.administration;
    const regs = admin.regions || [];
    const r = regs[selectedRegion] || regs[0];

    if (!r) {
      addLog(g, "Administration: No regions configured.");
      g.choseDecisionThisTurn = false;
      setGame(g);
      return;
    }

    if (type === "region_grant_small") {
      g.stats.money -= 90;
      r.budget += 20;
      r.satisfaction += 3;
      g.stats.stability += 1;
      addLog(g, `Administration: Small grant sent to ${r.name}.`);
    }

    if (type === "region_grant_big") {
      g.stats.money -= 160;
      r.budget += 40;
      r.satisfaction += 6;
      g.stats.stability += 2;
      addLog(g, `Administration: Major development grant sent to ${r.name}.`);
    }

    if (type === "municipal_support") {
      g.stats.money -= 120;
      r.municipalities += 1; // abstract: more municipal capacity/services
      r.satisfaction += 4;
      g.stats.happiness += 1;
      addLog(g, `Administration: Municipal support program expanded in ${r.name}.`);
    }

    if (type === "anti_bureaucracy") {
      g.stats.money -= 80;
      admin.bureaucracy -= 8;
      admin.digitalization += 2;
      g.stats.corruption -= 2;
      g.stats.stability += 1;
      addLog(g, "Administration: Anti-bureaucracy reform launched (permits, procedures simplified).");
    }

    if (type === "e_government") {
      g.stats.money -= 140;
      admin.digitalization += 10;
      admin.bureaucracy -= 4;
      g.stats.corruption -= 2;
      g.stats.happiness += 1;
      addLog(g, "Administration: E-government platform launched (digital services, online permits).");
    }

    if (type === "audit_municipalities") {
      g.stats.money -= 70;

      const chance = clamp(30 + (100 - admin.bureaucracy) * 0.3 + admin.digitalization * 0.2, 25, 85);
      const roll = Math.random() * 100;

      if (roll < chance) {
        g.stats.corruption -= 4;
        r.satisfaction += 2;
        addLog(g, `Audit SUCCESS in ${r.name} (${Math.round(chance)}%). Corruption -4.`);
      } else {
        r.satisfaction -= 2;
        g.stats.parliament -= 2;
        addLog(g, `Audit FAILED in ${r.name} (${Math.round(chance)}%). Local backlash.`);
      }
    }

    // Clamp admin
    admin.digitalization = clamp(admin.digitalization, 0, 100);
    admin.bureaucracy = clamp(admin.bureaucracy, 0, 100);

    // Clamp region
    r.budget = Math.max(0, r.budget);
    r.municipalities = Math.max(0, r.municipalities);
    r.satisfaction = clamp(r.satisfaction, 0, 100);

    // Optional: bureaucracy harms economy/happiness slightly if too high
    if (admin.bureaucracy >= 80 && Math.random() < 0.25) {
      g.stats.jobs -= 1;
      addLog(g, "Administration drag: High bureaucracy reduced business activity. Jobs -1.");
    }

    clampAll(g);
    setGame(g);
  }

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
      <h2 style={{ marginTop: 10 }}>Administration</h2>
      <p style={{ opacity: 0.75, marginTop: 6 }}>
        Municipalities, regions, capital city administration, budgets, and governance capacity.
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
        <Box title="National Administration">
          <StatLine label="Capital City" value={a.capitalCity} />
          <StatLine label="Digitalization" value={a.digitalization} />
          <StatLine label="Bureaucracy (higher = worse)" value={a.bureaucracy} />
          <StatLine label="Money (Treasury)" value={game.stats.money} />
          <StatLine label="Corruption" value={game.stats.corruption} />
        </Box>

        <Box title="Regions Overview">
          <div style={{ opacity: 0.8, marginBottom: 6 }}>Select region:</div>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(Number(e.target.value))}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(0,0,0,0.18)",
              color: "rgba(255,255,255,0.92)",
            }}
          >
            {regions.map((r, idx) => (
              <option key={idx} value={idx}>
                {r.name}
              </option>
            ))}
          </select>

          {region ? (
            <div style={{ marginTop: 10 }}>
              <StatLine label="Municipalities" value={region.municipalities} />
              <StatLine label="Budget" value={region.budget} />
              <StatLine label="Satisfaction" value={region.satisfaction} />
            </div>
          ) : (
            <div style={{ opacity: 0.7, marginTop: 10 }}>No region selected.</div>
          )}
        </Box>
      </div>

      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Box title="Regional Decisions">
          <div style={{ display: "grid", gap: 10 }}>
            <Decision
              title="Small Regional Grant"
              desc="Improve satisfaction and stability; moderate cost."
              disabled={game.choseDecisionThisTurn}
              onClick={() => doAction("region_grant_small")}
            />
            <Decision
              title="Major Development Grant"
              desc="Bigger boost to satisfaction and stability; higher cost."
              disabled={game.choseDecisionThisTurn}
              onClick={() => doAction("region_grant_big")}
            />
            <Decision
              title="Municipal Support Program"
              desc="Improves local services and happiness."
              disabled={game.choseDecisionThisTurn}
              onClick={() => doAction("municipal_support")}
            />
          </div>
        </Box>

        <Box title="State Capacity Decisions">
          <div style={{ display: "grid", gap: 10 }}>
            <Decision
              title="Anti-Bureaucracy Reform"
              desc="Reduce bureaucracy, reduce corruption slightly."
              disabled={game.choseDecisionThisTurn}
              onClick={() => doAction("anti_bureaucracy")}
            />
            <Decision
              title="E-Government Platform"
              desc="Increase digitalization, reduce bureaucracy and corruption."
              disabled={game.choseDecisionThisTurn}
              onClick={() => doAction("e_government")}
            />
            <Decision
              title="Audit Municipalities"
              desc="Chance to reduce corruption; risk of backlash."
              disabled={game.choseDecisionThisTurn}
              onClick={() => doAction("audit_municipalities")}
            />
          </div>
        </Box>
      </div>
    </div>
  );
}
