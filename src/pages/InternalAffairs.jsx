import { useState } from "react";
import { useGame } from "../game/GameContext";
import { addLog, clampAll, getBudgetMultiplier } from "../game/gameEngine";

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

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        opacity: active ? 1 : 0.75,
        border: active
          ? "1px solid rgba(255,255,255,0.25)"
          : "1px solid rgba(255,255,255,0.10)",
        background: active ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.12)",
      }}
    >
      {children}
    </button>
  );
}

function StatLine({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", opacity: 0.9, padding: "6px 0" }}>
      <span style={{ opacity: 0.75 }}>{label}</span>
      <b>{value}</b>
    </div>
  );
}

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export default function InternalAffairs() {
  const { game, setGame } = useGame();
  const [tab, setTab] = useState("security"); // "security" | "intel" | "labs"

  if (!game) {
    return (
      <div style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
        <h2>Internal Affairs</h2>
        <p style={{ opacity: 0.75 }}>Pick a country first.</p>
      </div>
    );
  }

  // Safety for older saves:
  const sec = game.securityState || {
    bordersLevel: 40,
    policeLevel: 40,
    intelLevel: 35,
    army: { airForce: 30, navalForce: 20, groundForce: 35, militaryPolice: 25, specialForces: 20 },
    equipment: { drones: 0, fighters: 0, patrolBoats: 0, armoredVehicles: 0 },
    labs: { bio: 20, nuclear: 10, physics: 25, chemistry: 22, safety: 45, secrecy: 35 },
  };

  const intel = game.intelligence || {
    threatLevel: 50,
    counterIntel: 30,
    foreignIntel: 30,
    budget: 70,
    agents: [],
  };

  // -------- SECURITY INVESTMENTS --------
  function invest(type) {
    if (game.choseDecisionThisTurn) return;

    const g = structuredClone(game);
    const mult = getBudgetMultiplier(g, "interior"); // ✅ interior budget affects this whole page
    g.choseDecisionThisTurn = true;

    // ensure nested exists
    g.securityState ??= structuredClone(sec);
    g.securityState.army ??= structuredClone(sec.army);
    g.securityState.equipment ??= structuredClone(sec.equipment);
    g.securityState.labs ??= structuredClone(sec.labs);

    // Underfunding increases real cost a bit
    const costMult = mult < 1 ? 1.1 : 1.0;

    if (type === "drones") {
      g.stats.money -= Math.round(140 * costMult);
      g.securityState.equipment.drones += Math.round(5 * mult);
      g.securityState.army.airForce += Math.round(3 * mult);
      g.stats.security += Math.round(2 * mult);
      addLog(g, "Security: Purchased drones for border and air surveillance.");
    }

    if (type === "fighters") {
      g.stats.money -= Math.round(260 * costMult);
      g.securityState.equipment.fighters += Math.max(1, Math.round(2 * mult));
      g.securityState.army.airForce += Math.round(5 * mult);
      g.stats.security += Math.round(2 * mult);
      addLog(g, "Security: Procured fighter aircraft and trained pilots.");
    }

    if (type === "borderTech") {
      g.stats.money -= Math.round(120 * costMult);
      g.securityState.bordersLevel += Math.round(6 * mult);
      g.stats.security += Math.round(2 * mult);
      g.stats.stability += Math.max(0, Math.round(1 * mult));
      addLog(g, "Security: Installed border sensors and surveillance systems.");
    }

    if (type === "specialForces") {
      g.stats.money -= Math.round(180 * costMult);
      g.securityState.army.specialForces += Math.round(6 * mult);
      g.securityState.intelLevel += Math.max(0, Math.round(2 * mult));
      g.stats.security += Math.round(2 * mult);
      addLog(g, "Security: Expanded special forces and rapid response units.");
    }

    if (type === "police") {
      g.stats.money -= Math.round(100 * costMult);
      g.securityState.policeLevel += Math.round(6 * mult);
      g.stats.security += Math.round(2 * mult);

      // underfunded police can create heavier-handed measures / public anger
      g.stats.happiness -= mult < 1 ? 2 : 1;

      addLog(g, "Security: Increased police funding and recruitment.");
    }

    // clamps
    g.securityState.bordersLevel = clamp(g.securityState.bordersLevel, 0, 100);
    g.securityState.policeLevel = clamp(g.securityState.policeLevel, 0, 100);
    g.securityState.intelLevel = clamp(g.securityState.intelLevel, 0, 100);

    g.securityState.army.airForce = clamp(g.securityState.army.airForce, 0, 100);
    g.securityState.army.navalForce = clamp(g.securityState.army.navalForce, 0, 100);
    g.securityState.army.groundForce = clamp(g.securityState.army.groundForce, 0, 100);
    g.securityState.army.militaryPolice = clamp(g.securityState.army.militaryPolice, 0, 100);
    g.securityState.army.specialForces = clamp(g.securityState.army.specialForces, 0, 100);

    g.securityState.equipment.drones = Math.max(0, g.securityState.equipment.drones);
    g.securityState.equipment.fighters = Math.max(0, g.securityState.equipment.fighters);

    clampAll(g);
    setGame(g);
  }

  // -------- INTELLIGENCE OPS --------
  function runIntelOperation(type) {
    if (game.choseDecisionThisTurn) return;

    const g = structuredClone(game);
    const mult = getBudgetMultiplier(g, "interior"); // interior budget impacts intel capacity here
    g.choseDecisionThisTurn = true;

    g.intelligence ??= structuredClone(intel);
    g.intelligence.agents ??= [];

    const costMult = mult < 1 ? 1.1 : 1.0;

    if (type === "counter") {
      g.stats.money -= Math.round(80 * costMult);
      g.intelligence.counterIntel += Math.round(6 * mult);
      g.intelligence.threatLevel -= Math.round(4 * mult);
      addLog(g, "Intelligence: Counter-intelligence operation launched.");
    }

    if (type === "foreign") {
      g.stats.money -= Math.round(90 * costMult);
      g.intelligence.foreignIntel += Math.round(6 * mult);
      g.diplomacy.reputation += mult >= 1.1 ? 2 : 1;
      addLog(g, "Intelligence: Foreign intelligence operation conducted.");
    }

    if (type === "surveillance") {
      g.stats.money -= Math.round(60 * costMult);
      g.intelligence.threatLevel -= Math.round(3 * mult);
      addLog(g, "Intelligence: Domestic surveillance expanded.");
    }

    // Leak risk higher when underfunded + low loyalty agents
    const risky = g.intelligence.agents?.some((a) => a.loyalty <= 2);
    const leakChance = mult < 1 ? 0.22 : 0.15;
    if (risky && Math.random() < leakChance) {
      g.stats.happiness -= 3;
      g.stats.stability -= 2;
      addLog(g, "SCANDAL: Intelligence leak exposed by the media.");
    }

    // clamps
    g.intelligence.threatLevel = clamp(g.intelligence.threatLevel, 0, 100);
    g.intelligence.counterIntel = clamp(g.intelligence.counterIntel, 0, 100);
    g.intelligence.foreignIntel = clamp(g.intelligence.foreignIntel, 0, 100);

    clampAll(g);
    setGame(g);
  }

  // -------- LAB ACTIONS --------
  function labAction(type) {
    if (game.choseDecisionThisTurn) return;

    const g = structuredClone(game);
    const mult = getBudgetMultiplier(g, "interior");
    g.choseDecisionThisTurn = true;

    // ensure labs exist
    g.securityState ??= structuredClone(sec);
    g.securityState.labs ??= { bio: 20, nuclear: 10, physics: 25, chemistry: 22, safety: 45, secrecy: 35 };
    const labs = g.securityState.labs;

    const costMult = mult < 1 ? 1.1 : 1.0;

    if (type === "fund_bio") {
      g.stats.money -= Math.round(120 * costMult);
      labs.bio += Math.round(8 * mult);
      labs.physics += Math.round(2 * mult);
      g.stats.stability += Math.max(0, Math.round(1 * mult));
      addLog(g, "Labs: Funded bio laboratories and medical research.");
    }

    if (type === "fund_nuclear") {
      g.stats.money -= Math.round(180 * costMult);
      labs.nuclear += Math.round(7 * mult);
      labs.chemistry += Math.round(2 * mult);
      g.stats.security += Math.max(0, Math.round(1 * mult));
      addLog(g, "Labs: Funded nuclear research program.");

      if (Math.random() < 0.18) {
        g.diplomacy.reputation -= 2;
        addLog(g, "International concern: Neighbors demand nuclear transparency.");
      }
    }

    if (type === "safety_inspection") {
      g.stats.money -= Math.round(90 * costMult);
      labs.safety += Math.round(10 * mult);
      g.stats.happiness += 1;
      addLog(g, "Labs: Increased safety inspections and compliance.");
    }

    if (type === "increase_secrecy") {
      g.stats.money -= Math.round(70 * costMult);
      labs.secrecy += Math.round(10 * mult);
      g.stats.security += 1;
      addLog(g, "Labs: Increased secrecy and counter-espionage measures.");

      if (Math.random() < 0.20) {
        g.stats.happiness -= 1;
        addLog(g, "Media criticism: Government accused of hiding lab activities.");
      }
    }

    // accident risk if safety low (worse if underfunded)
    const accidentChance = labs.safety < 25 ? (mult < 1 ? 0.22 : 0.15) : 0;
    if (accidentChance > 0 && Math.random() < accidentChance) {
      g.stats.happiness -= 3;
      g.stats.stability -= 2;
      g.stats.money -= 120;
      addLog(g, "ACCIDENT: Laboratory incident causes public fear and repair costs.");
    }

    // clamps
    labs.bio = clamp(labs.bio, 0, 100);
    labs.nuclear = clamp(labs.nuclear, 0, 100);
    labs.physics = clamp(labs.physics, 0, 100);
    labs.chemistry = clamp(labs.chemistry, 0, 100);
    labs.safety = clamp(labs.safety, 0, 100);
    labs.secrecy = clamp(labs.secrecy, 0, 100);

    clampAll(g);
    setGame(g);
  }

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
      <h2 style={{ marginTop: 10 }}>Internal Affairs</h2>
      <p style={{ opacity: 0.75, marginTop: 6 }}>
        Police, borders, army branches, intelligence services, and labs.
      </p>

      <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <TabButton active={tab === "security"} onClick={() => setTab("security")}>
          Security & Army
        </TabButton>
        <TabButton active={tab === "intel"} onClick={() => setTab("intel")}>
          Intelligence
        </TabButton>
        <TabButton active={tab === "labs"} onClick={() => setTab("labs")}>
          Labs
        </TabButton>
      </div>

      {/* SECURITY TAB */}
      {tab === "security" && (
        <>
          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Box title="Internal Security">
              <StatLine label="Borders Level" value={sec.bordersLevel} />
              <StatLine label="Police Level" value={sec.policeLevel} />
              <StatLine label="Intel Services (security)" value={sec.intelLevel} />
              <StatLine label="Security (country stat)" value={game.stats.security} />

              <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button disabled={game.choseDecisionThisTurn} onClick={() => invest("borderTech")}>
                  Invest in Borders
                </button>
                <button disabled={game.choseDecisionThisTurn} onClick={() => invest("police")}>
                  Invest in Police
                </button>
              </div>
            </Box>

            <Box title="Army Branches">
              <StatLine label="Air Force" value={sec.army.airForce} />
              <StatLine label="Naval Force" value={sec.army.navalForce} />
              <StatLine label="Ground Force" value={sec.army.groundForce} />
              <StatLine label="Military Police" value={sec.army.militaryPolice} />
              <StatLine label="Special Forces" value={sec.army.specialForces} />

              <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button disabled={game.choseDecisionThisTurn} onClick={() => invest("drones")}>
                  Buy Drones
                </button>
                <button disabled={game.choseDecisionThisTurn} onClick={() => invest("fighters")}>
                  Buy Fighters
                </button>
                <button disabled={game.choseDecisionThisTurn} onClick={() => invest("specialForces")}>
                  Expand Special Forces
                </button>
              </div>
            </Box>
          </div>

          <div style={{ marginTop: 14 }}>
            <Box title="Equipment Inventory">
              <div style={{ display: "grid", gap: 6, opacity: 0.9 }}>
                <div>
                  • Drones: <b>{sec.equipment.drones}</b>
                </div>
                <div>
                  • Fighters: <b>{sec.equipment.fighters}</b>
                </div>
                <div>
                  • Patrol Boats: <b>{sec.equipment.patrolBoats}</b>
                </div>
                <div>
                  • Armored Vehicles: <b>{sec.equipment.armoredVehicles}</b>
                </div>
              </div>
            </Box>
          </div>
        </>
      )}

      {/* INTEL TAB */}
      {tab === "intel" && (
        <>
          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Box title="Agency Status">
              <StatLine label="Threat Level" value={intel.threatLevel} />
              <StatLine label="Counter-Intel" value={intel.counterIntel} />
              <StatLine label="Foreign Intel" value={intel.foreignIntel} />
              <StatLine label="Budget" value={intel.budget} />
            </Box>

            <Box title="Operations">
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button disabled={game.choseDecisionThisTurn} onClick={() => runIntelOperation("counter")}>
                  Counter-Intelligence
                </button>
                <button disabled={game.choseDecisionThisTurn} onClick={() => runIntelOperation("surveillance")}>
                  Domestic Surveillance
                </button>
                <button disabled={game.choseDecisionThisTurn} onClick={() => runIntelOperation("foreign")}>
                  Foreign Operation
                </button>
              </div>
              <div style={{ opacity: 0.7, marginTop: 10, fontSize: 12 }}>
                Low loyalty agents may leak information.
              </div>
            </Box>
          </div>

          <div style={{ marginTop: 14 }}>
            <Box title="Agents">
              {(intel.agents || []).length === 0 ? (
                <div style={{ opacity: 0.7 }}>No agents listed yet.</div>
              ) : (
                (intel.agents || []).map((a, i) => (
                  <div
                    key={i}
                    style={{ padding: "8px 0", borderBottom: "1px dashed rgba(255,255,255,0.10)" }}
                  >
                    {a.name} — Skill {a.skill}/5 • Loyalty {a.loyalty}/5 • {a.trait}
                  </div>
                ))
              )}
            </Box>
          </div>
        </>
      )}

      {/* LABS TAB */}
      {tab === "labs" && (
        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Box title="National Laboratories">
            <StatLine label="Bio Labs" value={sec.labs?.bio ?? 0} />
            <StatLine label="Nuclear Labs" value={sec.labs?.nuclear ?? 0} />
            <StatLine label="Physics Labs" value={sec.labs?.physics ?? 0} />
            <StatLine label="Chemistry Labs" value={sec.labs?.chemistry ?? 0} />
            <StatLine label="Safety / Inspections" value={sec.labs?.safety ?? 0} />
            <StatLine label="Secrecy Level" value={sec.labs?.secrecy ?? 0} />
          </Box>

          <Box title="Lab Decisions">
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button disabled={game.choseDecisionThisTurn} onClick={() => labAction("fund_bio")}>
                Fund Bio Labs
              </button>
              <button disabled={game.choseDecisionThisTurn} onClick={() => labAction("fund_nuclear")}>
                Fund Nuclear
              </button>
              <button disabled={game.choseDecisionThisTurn} onClick={() => labAction("safety_inspection")}>
                Safety Inspections
              </button>
              <button disabled={game.choseDecisionThisTurn} onClick={() => labAction("increase_secrecy")}>
                Increase Secrecy
              </button>
            </div>

            <div style={{ opacity: 0.7, marginTop: 10, fontSize: 12 }}>
              Labs improve technology and security. Low safety can trigger accidents.
            </div>
          </Box>
        </div>
      )}
    </div>
  );
}
