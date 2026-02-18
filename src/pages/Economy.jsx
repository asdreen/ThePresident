import { useState } from "react";
import { useGame } from "../game/GameContext";
import { addLog, clampAll, getMinisterBonus, ministerRisk } from "../game/gameEngine";
import { getBudgetMultiplier } from "../game/gameEngine";

function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }

function Box({ title, children }) {
  return (
    <div style={{ padding:16, borderRadius:18, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.10)" }}>
      <h3 style={{ marginTop:0 }}>{title}</h3>
      {children}
    </div>
  );
}

export default function Economy() {
  const { game, setGame } = useGame();
  const [tab, setTab] = useState("transport");

  if (!game) return <div style={{ padding:16 }}>Pick a country first.</div>;

  const econ = game.economySystem;

  function act(type) {
    if (game.choseDecisionThisTurn) return;

    const g = structuredClone(game);
    const mult = getBudgetMultiplier(g, "health"); // example

    g.choseDecisionThisTurn = true;

    const { skill } = getMinisterBonus(g, "economy"); // economy minister bonus

    // ---- TRANSPORT ----
    if (type === "air_upgrade") {
      g.stats.money -= 180;
      g.economySystem.transport.air += 6 + skill;
      g.stats.jobs += 1 + Math.floor(skill/2);
      g.stats.happiness += 1;
      addLog(g, "Economy/Transport: Upgraded airports + air logistics.");
    }
    if (type === "rail_upgrade") {
      g.stats.money -= 160;
      g.economySystem.transport.rail += 7 + skill;
      g.stats.jobs += 1;
      g.stats.stability += 1;
      addLog(g, "Economy/Transport: Modernized rail network.");
    }
    if (type === "highway_upgrade") {
      g.stats.money -= 150;
      g.economySystem.transport.highway += 7 + skill;
      g.stats.jobs += 1;
      addLog(g, "Economy/Transport: Expanded highways.");
    }
    if (type === "sea_port") {
      g.stats.money -= 170;
      g.economySystem.transport.sea += 7 + skill;
      g.stats.money += 30;
      addLog(g, "Economy/Transport: Expanded seaport capacity.");
    }

    // ---- UTILITIES ----
    if (type === "power_grid") {
      g.stats.money -= 160;
      g.economySystem.utilities.electricity += 8 + skill;
      g.stats.stability += 1;
      g.stats.jobs += 1;
      addLog(g, "Economy/Utilities: Upgraded electricity grid.");
    }
    if (type === "water_system") {
      g.stats.money -= 140;
      g.economySystem.utilities.water += 8 + skill;
      g.stats.happiness += 2;
      addLog(g, "Economy/Utilities: Improved water & sanitation systems.");
    }

    // ---- STATE BUILDINGS / PARKS ----
    if (type === "state_buildings") {
      g.stats.money -= 120;
      g.economySystem.stateBuildings += 7 + Math.floor(skill/2);
      g.stats.stability += 1;
      addLog(g, "Economy: Renovated state buildings and services.");
    }
    if (type === "parks") {
      g.stats.money -= 90;
      g.economySystem.parksNature += 8;
      g.stats.happiness += 2;
      addLog(g, "Economy/Nature: Built parks and protected nature zones.");
    }

    // ---- INDUSTRIES ----
    if (type === "industry_manufacturing") {
      g.stats.money -= 180;
      g.economySystem.industries.manufacturing += 7 + skill;
      g.stats.jobs += 2 + Math.floor(skill/2);
      addLog(g, "Economy/Industry: Manufacturing investment package.");
    }
    if (type === "industry_tech") {
      g.stats.money -= 200;
      g.economySystem.industries.tech += 8 + skill;
      g.stats.jobs += 2;
      g.stats.happiness += 1;
      addLog(g, "Economy/Industry: Tech & innovation investment package.");
    }

    // ---- STATE COMPANIES ----
    if (type === "reform_state_companies") {
      g.stats.money -= 120;
      g.economySystem.stateCompanies.efficiency += 8 + skill;
      g.stats.corruption -= 2;
      g.stats.money += 40;
      addLog(g, "Economy/State Companies: Efficiency reforms + audits.");
    }

    // ---- INVESTMENTS (simple) ----
    if (type === "buy_gold") {
      g.stats.money -= 100;
      g.economySystem.investments.gold += 100;
      addLog(g, "Economy/Investments: Bought gold reserves.");
    }
    if (type === "buy_crypto") {
      g.stats.money -= 80;
      g.economySystem.investments.crypto += 80;
      addLog(g, "Economy/Investments: Bought crypto (high risk).");
      if (Math.random() < 0.25) { g.stats.happiness -= 1; addLog(g, "Media criticism: Crypto investment controversy."); }
    }
    if (type === "buy_stocks") {
      g.stats.money -= 90;
      g.economySystem.investments.stocks += 90;
      addLog(g, "Economy/Investments: Bought stock market index.");
    }

    // clamp all substats
    const t = g.economySystem.transport;
    t.air = clamp(t.air,0,100); t.rail = clamp(t.rail,0,100); t.sea = clamp(t.sea,0,100); t.highway = clamp(t.highway,0,100);
    g.economySystem.utilities.electricity = clamp(g.economySystem.utilities.electricity,0,100);
    g.economySystem.utilities.water = clamp(g.economySystem.utilities.water,0,100);
    g.economySystem.stateBuildings = clamp(g.economySystem.stateBuildings,0,100);
    g.economySystem.parksNature = clamp(g.economySystem.parksNature,0,100);
    g.economySystem.industries.manufacturing = clamp(g.economySystem.industries.manufacturing,0,100);
    g.economySystem.industries.agriculture = clamp(g.economySystem.industries.agriculture,0,100);
    g.economySystem.industries.tech = clamp(g.economySystem.industries.tech,0,100);
    g.economySystem.stateCompanies.efficiency = clamp(g.economySystem.stateCompanies.efficiency,0,100);

    ministerRisk(g, "economy", addLog);
    clampAll(g);
    setGame(g);
  }

  return (
    <div style={{ padding:16, maxWidth:1200, margin:"0 auto" }}>
      <h2 style={{ marginTop:10 }}>Economy</h2>
      <p style={{ opacity:0.75 }}>Transport, utilities, industries, state companies, investments.</p>

      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginTop:10 }}>
        <button onClick={() => setTab("transport")} style={{ opacity: tab==="transport"?1:0.75 }}>Transport</button>
        <button onClick={() => setTab("utilities")} style={{ opacity: tab==="utilities"?1:0.75 }}>Electricity & Water</button>
        <button onClick={() => setTab("state")} style={{ opacity: tab==="state"?1:0.75 }}>State Buildings</button>
        <button onClick={() => setTab("parks")} style={{ opacity: tab==="parks"?1:0.75 }}>Parks & Nature</button>
        <button onClick={() => setTab("industry")} style={{ opacity: tab==="industry"?1:0.75 }}>Industries</button>
        <button onClick={() => setTab("companies")} style={{ opacity: tab==="companies"?1:0.75 }}>State Companies</button>
        <button onClick={() => setTab("invest")} style={{ opacity: tab==="invest"?1:0.75 }}>Investments</button>
      </div>

      <div style={{ marginTop:14 }}>
        {tab === "transport" && (
          <Box title="Transport">
            <div style={{ opacity:0.9 }}>Air: <b>{econ.transport.air}</b> • Rail: <b>{econ.transport.rail}</b> • Sea: <b>{econ.transport.sea}</b> • Highway: <b>{econ.transport.highway}</b></div>
            <div style={{ marginTop:10, display:"flex", gap:10, flexWrap:"wrap" }}>
              <button disabled={game.choseDecisionThisTurn} onClick={() => act("air_upgrade")}>Upgrade Air</button>
              <button disabled={game.choseDecisionThisTurn} onClick={() => act("rail_upgrade")}>Upgrade Rail</button>
              <button disabled={game.choseDecisionThisTurn} onClick={() => act("highway_upgrade")}>Upgrade Highways</button>
              <button disabled={game.choseDecisionThisTurn} onClick={() => act("sea_port")}>Expand Seaport</button>
            </div>
          </Box>
        )}

        {tab === "utilities" && (
          <Box title="Electricity & Water">
            <div style={{ opacity:0.9 }}>Electricity: <b>{econ.utilities.electricity}</b> • Water: <b>{econ.utilities.water}</b></div>
            <div style={{ marginTop:10, display:"flex", gap:10, flexWrap:"wrap" }}>
              <button disabled={game.choseDecisionThisTurn} onClick={() => act("power_grid")}>Upgrade Power Grid</button>
              <button disabled={game.choseDecisionThisTurn} onClick={() => act("water_system")}>Upgrade Water System</button>
            </div>
          </Box>
        )}

        {tab === "state" && (
          <Box title="State Buildings">
            <div style={{ opacity:0.9 }}>State buildings level: <b>{econ.stateBuildings}</b></div>
            <div style={{ marginTop:10 }}>
              <button disabled={game.choseDecisionThisTurn} onClick={() => act("state_buildings")}>Renovate & Modernize</button>
            </div>
          </Box>
        )}

        {tab === "parks" && (
          <Box title="Parks & Nature">
            <div style={{ opacity:0.9 }}>Nature & parks: <b>{econ.parksNature}</b></div>
            <div style={{ marginTop:10 }}>
              <button disabled={game.choseDecisionThisTurn} onClick={() => act("parks")}>Build Parks</button>
            </div>
          </Box>
        )}

        {tab === "industry" && (
          <Box title="Industries">
            <div style={{ opacity:0.9 }}>
              Manufacturing: <b>{econ.industries.manufacturing}</b> • Agriculture: <b>{econ.industries.agriculture}</b> • Tech: <b>{econ.industries.tech}</b>
            </div>
            <div style={{ marginTop:10, display:"flex", gap:10, flexWrap:"wrap" }}>
              <button disabled={game.choseDecisionThisTurn} onClick={() => act("industry_manufacturing")}>Invest Manufacturing</button>
              <button disabled={game.choseDecisionThisTurn} onClick={() => act("industry_tech")}>Invest Tech</button>
            </div>
          </Box>
        )}

        {tab === "companies" && (
          <Box title="State Companies">
            <div style={{ opacity:0.9 }}>Count: <b>{econ.stateCompanies.count}</b> • Efficiency: <b>{econ.stateCompanies.efficiency}</b></div>
            <div style={{ marginTop:10 }}>
              <button disabled={game.choseDecisionThisTurn} onClick={() => act("reform_state_companies")}>Reform & Audit</button>
            </div>
          </Box>
        )}

        {tab === "invest" && (
          <Box title="Investments">
            <div style={{ opacity:0.9 }}>
              Gold: <b>{econ.investments.gold}</b> • Crypto: <b>{econ.investments.crypto}</b> • Stocks: <b>{econ.investments.stocks}</b>
            </div>
            <div style={{ marginTop:10, display:"flex", gap:10, flexWrap:"wrap" }}>
              <button disabled={game.choseDecisionThisTurn} onClick={() => act("buy_gold")}>Buy Gold</button>
              <button disabled={game.choseDecisionThisTurn} onClick={() => act("buy_crypto")}>Buy Crypto</button>
              <button disabled={game.choseDecisionThisTurn} onClick={() => act("buy_stocks")}>Buy Stocks</button>
            </div>
          </Box>
        )}
      </div>
    </div>
  );
}
