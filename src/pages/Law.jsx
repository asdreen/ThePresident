import { useMemo, useState } from "react";
import { useGame } from "../game/GameContext";
import { addLog, clampAll, parliamentVote } from "../game/gameEngine";
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

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

const LAW_TEMPLATES = [
  {
    id: "anti_corruption_law",
    title: "Anti-Corruption Reform Act",
    desc: "Strengthen investigations and transparency rules.",
    difficulty: 58,
    apply: (g) => {
     g.stats.corruption -= Math.floor(skill / 2)
      g.law.antiCorruptionBureau.level += 6;
      g.law.antiCorruptionBureau.activeCases += 2;
      g.stats.stability += 1;
      g.stats.happiness += 1;
    },
  },
  {
    id: "court_funding",
    title: "Court Funding & Backlog Reduction",
    desc: "Hire judges, modernize courts, speed up cases.",
    difficulty: 52,
    apply: (g) => {
      g.stats.money -= 140;
      g.law.courts.supreme.backlog -= 8;
      g.law.courts.appeal.backlog -= 10;
      g.law.courts.district.backlog -= 12;
      g.law.courts.supreme.trust += 3;
      g.law.courts.appeal.trust += 3;
      g.law.courts.district.trust += skill;
      g.stats.stability += 2;
    },
  },
  {
    id: "digital_justice",
    title: "Digital Justice System",
    desc: "Case tracking + e-filing reduces bureaucracy and corruption.",
    difficulty: 55,
    apply: (g) => {
      g.stats.money -= 120;
     g.stats.corruption -= Math.floor(skill / 2)
      g.law.courts.district.backlog -= 8;
      g.law.courts.appeal.backlog -= 6;
      g.stats.stability += 1;
    },
  },
  {
    id: "civil_rights",
    title: "Civil Rights Protection Act",
    desc: "Increases public trust; some security pushback.",
    difficulty: 60,
    apply: (g) => {
      g.stats.happiness += 3;
      g.stats.stability += 1;
      g.stats.security -= 1;
      g.law.courts.supreme.trust += 2;
      g.law.courts.appeal.trust += 2;
    },
  },
  {
    id: "judicial_independence",
    title: "Judicial Independence Charter",
    desc: "Boosts courts trust; elites may resist.",
    difficulty: 62,
    apply: (g) => {
      g.stats.stability += 2;
      g.law.courts.supreme.trust += 4;
      g.law.courts.appeal.trust += 3;
      g.stats.corruption -= Math.floor(skill / 2)
      // political backlash risk
      if (Math.random() < 0.20) {
        g.stats.parliament -= 4;
        addLog(g, "Backlash: Some politicians accuse you of politicizing the judiciary.");
      }
    },
  },
];

export default function Law() {
  const { game, setGame } = useGame();
  const [draftId, setDraftId] = useState(LAW_TEMPLATES[0].id);

  if (!game) {
    return (
      <div style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
        <h2>Law & Justice</h2>
        <p style={{ opacity: 0.75 }}>Pick a country first.</p>
      </div>
    );
  }

  const l = game.law;
  const chosenDraft = useMemo(() => LAW_TEMPLATES.find(x => x.id === draftId), [draftId]);

  function passBill() {
    if (game.choseDecisionThisTurn) return;
    if (!chosenDraft) return;

    const g = structuredClone(game);
    const mult = getBudgetMultiplier(g, "health"); // example

    g.choseDecisionThisTurn = true;

    addLog(g, `Law Draft: ${chosenDraft.title}`);
    addLog(g, `Parliament vote requested.`);

    // Parliament vote
    const res = parliamentVote(g, chosenDraft.difficulty);
    addLog(g, `Vote result: ${res.passed ? "PASSED" : "FAILED"} (${res.chance}%)`);

    // Political capital spent
    g.stats.capital = Math.max(0, g.stats.capital - 1);

    if (!res.passed) {
      g.stats.happiness -= 1;
      g.stats.stability -= 1;
      clampAll(g);
      setGame(g);
      return;
    }

    // Apply law effects
    chosenDraft.apply(g);

    // Store as passed law
    g.law.laws.push({
      title: chosenDraft.title,
      dateTurn: g.turn,
      summary: chosenDraft.desc,
    });

    addLog(g, `Law PASSED: ${chosenDraft.title}`);

    // clamp law systems
    g.law.antiCorruptionBureau.level = clamp(g.law.antiCorruptionBureau.level, 0, 100);
    g.law.antiCorruptionBureau.activeCases = Math.max(0, g.law.antiCorruptionBureau.activeCases);

    const courts = g.law.courts;
    ["supreme","appeal","district"].forEach(k => {
      courts[k].backlog = clamp(courts[k].backlog, 0, 100);
      courts[k].trust = clamp(courts[k].trust, 0, 100);
    });

    ministerRisk(g, "justice", addLog);
    clampAll(g);
    setGame(g);
  }

  function runAntiCorruptionRaid() {
    if (game.choseDecisionThisTurn) return;

    const g = structuredClone(game);
    g.choseDecisionThisTurn = true;

    g.stats.money -= 60;
    g.law.antiCorruptionBureau.activeCases += 2;

    // Success chance based on bureau level
    const chance = clamp(30 + g.law.antiCorruptionBureau.level * 0.6, 25, 85);
    const roll = Math.random() * 100;

    if (roll < chance) {
      g.stats.corruption -= Math.floor(skill / 2)
      g.stats.stability += 1;
      addLog(g, `Anti-Corruption operation SUCCESS (${Math.round(chance)}%). Corruption -5.`);
    } else {
      g.stats.happiness -= 2;
      g.stats.parliament -= 2;
      addLog(g, `Anti-Corruption operation FAILED (${Math.round(chance)}%). Political backlash.`);
    }

    clampAll(g);
    setGame(g);
  }

  function investInCourts(level) {
    if (game.choseDecisionThisTurn) return;

    const g = structuredClone(game);
    g.choseDecisionThisTurn = true;

    const cost = level === "big" ? 170 : 90;
    g.stats.money -= cost;
    const { skill } = getMinisterBonus(g, "justice");

    const courts = g.law.courts;
    const drop = level === "big" ? 10 : 6;

    courts.district.backlog -= drop;
    courts.appeal.backlog -= Math.round(drop * 0.8);
    courts.supreme.backlog -= Math.round(drop * 0.6);

    courts.district.trust += 2;
    courts.appeal.trust += 2;
    courts.supreme.trust += 1;

    addLog(g, `Justice: Invested in courts (-${cost}). Backlogs reduced.`);

    ["supreme","appeal","district"].forEach(k => {
      courts[k].backlog = clamp(courts[k].backlog, 0, 100);
      courts[k].trust = clamp(courts[k].trust, 0, 100);
    });

    clampAll(g);
    setGame(g);
  }

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
      <h2 style={{ marginTop: 10 }}>Law & Justice</h2>
      <p style={{ opacity: 0.75, marginTop: 6 }}>
        Courts, anti-corruption bureau, and drafting laws for parliament votes.
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
        <Box title="Anti-Corruption Bureau">
          <StatLine label="Bureau Level" value={l.antiCorruptionBureau.level} />
          <StatLine label="Active Cases" value={l.antiCorruptionBureau.activeCases} />
          <div style={{ marginTop: 10 }}>
            <button disabled={game.choseDecisionThisTurn} onClick={runAntiCorruptionRaid}>
              Launch Investigation / Raid
            </button>
          </div>
          <div style={{ opacity: 0.7, marginTop: 8, fontSize: 12 }}>
            Higher bureau level increases success chance. Failure causes backlash.
          </div>
        </Box>

        <Box title="Courts">
          <div style={{ opacity: 0.9 }}>
            <div style={{ fontWeight: 800, marginTop: 6 }}>Supreme Court</div>
            <StatLine label="Backlog" value={l.courts.supreme.backlog} />
            <StatLine label="Trust" value={l.courts.supreme.trust} />

            <div style={{ fontWeight: 800, marginTop: 10 }}>Court of Appeal</div>
            <StatLine label="Backlog" value={l.courts.appeal.backlog} />
            <StatLine label="Trust" value={l.courts.appeal.trust} />

            <div style={{ fontWeight: 800, marginTop: 10 }}>District Courts</div>
            <StatLine label="Backlog" value={l.courts.district.backlog} />
            <StatLine label="Trust" value={l.courts.district.trust} />
          </div>

          <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button disabled={game.choseDecisionThisTurn} onClick={() => investInCourts("small")}>
              Invest in Courts (Small)
            </button>
            <button disabled={game.choseDecisionThisTurn} onClick={() => investInCourts("big")}>
              Invest in Courts (Big)
            </button>
          </div>
        </Box>
      </div>

      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Box title="Draft a Law (Prepare → Vote)">
          <div style={{ opacity: 0.8, marginBottom: 6 }}>Select draft:</div>
          <select
            value={draftId}
            onChange={(e) => setDraftId(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(0,0,0,0.18)",
              color: "rgba(255,255,255,0.92)",
            }}
          >
            {LAW_TEMPLATES.map(x => (
              <option key={x.id} value={x.id}>{x.title}</option>
            ))}
          </select>

          {chosenDraft && (
            <div style={{ marginTop: 10, opacity: 0.9 }}>
              <div style={{ fontWeight: 800 }}>{chosenDraft.title}</div>
              <div style={{ opacity: 0.75, marginTop: 6 }}>{chosenDraft.desc}</div>
              <div style={{ opacity: 0.7, marginTop: 8, fontSize: 12 }}>
                Vote difficulty: {chosenDraft.difficulty} (higher = harder)
              </div>
            </div>
          )}

          <div style={{ marginTop: 10 }}>
            <button disabled={game.choseDecisionThisTurn} onClick={passBill}>
              Send to Parliament Vote
            </button>
          </div>
        </Box>

        <Box title="Passed Laws">
          {l.laws.length === 0 ? (
            <div style={{ opacity: 0.7 }}>No laws passed yet.</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {l.laws.slice(-10).reverse().map((law, i) => (
                <div
                  key={i}
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    background: "rgba(0,0,0,0.18)",
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                >
                  <div style={{ fontWeight: 800 }}>{law.title}</div>
                  <div style={{ opacity: 0.75, marginTop: 6 }}>{law.summary}</div>
                  <div style={{ opacity: 0.65, marginTop: 8, fontSize: 12 }}>
                    Passed on Turn {law.dateTurn}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Box>
      </div>
    </div>
  );
}
