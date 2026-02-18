import { useMemo } from "react";
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

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export default function Migration() {
  const { game, setGame } = useGame();

  if (!game) {
    return (
      <div style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
        <h2>Migration</h2>
        <p style={{ opacity: 0.75 }}>Pick a country first.</p>
      </div>
    );
  }

  const m = game.migration;

  const policyEffects = useMemo(() => {
    if (m.visaPolicy === "Strict")
      return { jobs: -1, happiness: -1, security: +2, borderPressure: -4 };
    if (m.visaPolicy === "Open")
      return { jobs: +2, happiness: +1, security: -2, borderPressure: +4 };
    return { jobs: +1, happiness: 0, security: 0, borderPressure: 0 }; // Balanced
  }, [m.visaPolicy]);

  function setPolicy(policy) {
    const g = structuredClone(game);
    const mult = getBudgetMultiplier(g, "health"); // example

    const { skill } = getMinisterBonus(g, "migration");
    g.migration.visaPolicy = policy;

    addLog(g, `Migration: Visa policy set to "${policy}".`);

    // Apply a small immediate drift when policy changes
    g.stats.jobs += policyEffects.jobs;
    g.stats.happiness += policyEffects.happiness;
    g.stats.security += policyEffects.security;
    g.migration.borderPressure += policyEffects.borderPressure;

    g.migration.borderPressure = clamp(g.migration.borderPressure, 0, 100);

    clampAll(g);
    setGame(g);
  }

  function process(type, mode) {
    if (game.choseDecisionThisTurn) return;

    const g = structuredClone(game);
    g.choseDecisionThisTurn = true;

    const q = g.migration.queues[type];
    if (!q) return;

    // how many you can process in one decision
    const amount =
      mode === "fast" ? 250 :
      mode === "approve" ? 200 :
      mode === "reject" ? 200 :
      150;

    const processed = Math.min(q.applicants, amount);
    if (processed <= 0) {
      addLog(g, `Migration: No applicants to process for ${type} visas.`);
      g.choseDecisionThisTurn = false;
      setGame(g);
      return;
    }

    if (mode === "approve") {
      q.applicants -= processed;
      q.approvals += processed;

      // effects depend on visa type
      if (type === "work") {
        g.stats.jobs += 2;
        g.stats.money += 40;
        g.migration.integrationLevel += 1;
      }
      if (type === "student") {
        g.stats.happiness += 1;
        g.stats.money -= 10;
        g.migration.integrationLevel += 2 + Math.floor(skill / 2);

      }
      if (type === "asylum") {
        g.stats.happiness += 1;
        g.migration.integrationLevel += 2 + Math.floor(skill / 2);

        g.stats.money -= 30;
        g.migration.borderPressure += 1;
      }

      addLog(g, `Migration: Approved ${processed} ${type} visas.`);
    }

    if (mode === "reject") {
      q.applicants -= processed;
      q.rejected += processed;

      // effects
      g.stats.security += 1;
      g.stats.happiness -= 1;
      g.migration.borderPressure -= 2;

      addLog(g, `Migration: Rejected ${processed} ${type} visa applications.`);
    }

    if (mode === "fast") {
      // fast processing costs money but reduces border pressure
      q.applicants -= processed;
      q.approvals += Math.round(processed * 0.6);
      q.rejected += processed - Math.round(processed * 0.6);

      g.stats.money -= 70;
      g.migration.borderPressure -= 4;
      g.migration.integrationLevel += 1;

      addLog(g, `Migration: Fast-tracked ${processed} ${type} applications (mixed outcome).`);
    }

    // clamp internal values
    g.migration.borderPressure = clamp(g.migration.borderPressure, 0, 100);
    g.migration.integrationLevel = clamp(g.migration.integrationLevel, 0, 100);

    ministerRisk(g, "migration", addLog);
    clampAll(g);
    setGame(g);
  }

  function investIntegration() {
    if (game.choseDecisionThisTurn) return;

    const g = structuredClone(game);
    g.choseDecisionThisTurn = true;

    g.stats.money -= 110;
    g.migration.integrationLevel += 8;
    g.stats.happiness += 2;
    g.stats.stability += 1;

    addLog(g, "Migration: Funded integration programs (language, jobs, housing).");

    g.migration.integrationLevel = clamp(g.migration.integrationLevel, 0, 100);

    clampAll(g);
    setGame(g);
  }

  function reinforceBorders() {
    if (game.choseDecisionThisTurn) return;

    const g = structuredClone(game);
    g.choseDecisionThisTurn = true;

    g.stats.money -= 130;
    g.stats.security += 3;
    g.migration.borderPressure -= 6;
    g.stats.happiness -= 1;

    addLog(g, "Migration: Reinforced border control and screening.");

    g.migration.borderPressure = clamp(g.migration.borderPressure, 0, 100);

    clampAll(g);
    setGame(g);
  }

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
      <h2 style={{ marginTop: 10 }}>Migration</h2>
      <p style={{ opacity: 0.75, marginTop: 6 }}>
        Visa policies, queues, border pressure, and integration programs.
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
        <Box title="Status">
          <StatLine label="Visa Policy" value={m.visaPolicy} />
          <StatLine label="Border Pressure" value={m.borderPressure} />
          <StatLine label="Integration Level" value={m.integrationLevel} />
          <StatLine label="Security (country stat)" value={game.stats.security} />
          <StatLine label="Happiness (country stat)" value={game.stats.happiness} />
          <StatLine label="Jobs (country stat)" value={game.stats.jobs} />
        </Box>

        <Box title="Visa Policy">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button disabled={m.visaPolicy === "Strict"} onClick={() => setPolicy("Strict")}>Strict</button>
            <button disabled={m.visaPolicy === "Balanced"} onClick={() => setPolicy("Balanced")}>Balanced</button>
            <button disabled={m.visaPolicy === "Open"} onClick={() => setPolicy("Open")}>Open</button>
          </div>
          <div style={{ opacity: 0.7, marginTop: 10, fontSize: 12 }}>
            Strict: +Security, -Jobs, -Happiness. Open: +Jobs, +Happiness, -Security, +Border pressure.
          </div>
        </Box>
      </div>

      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <QueueBox
          title="Work Visas"
          q={m.queues.work}
          disabled={game.choseDecisionThisTurn}
          onApprove={() => process("work", "approve")}
          onReject={() => process("work", "reject")}
          onFast={() => process("work", "fast")}
        />
        <QueueBox
          title="Student Visas"
          q={m.queues.student}
          disabled={game.choseDecisionThisTurn}
          onApprove={() => process("student", "approve")}
          onReject={() => process("student", "reject")}
          onFast={() => process("student", "fast")}
        />
        <QueueBox
          title="Asylum"
          q={m.queues.asylum}
          disabled={game.choseDecisionThisTurn}
          onApprove={() => process("asylum", "approve")}
          onReject={() => process("asylum", "reject")}
          onFast={() => process("asylum", "fast")}
        />
      </div>

      <div style={{ marginTop: 14, display:"grid", gridTemplateColumns:"1fr 1fr", gap: 14 }}>
        <Box title="Programs">
          <button disabled={game.choseDecisionThisTurn} onClick={investIntegration}>
            Fund Integration Programs
          </button>
          <div style={{ opacity: 0.7, marginTop: 8, fontSize: 12 }}>
            Improves integration, happiness, and stability.
          </div>
        </Box>

        <Box title="Border Control">
          <button disabled={game.choseDecisionThisTurn} onClick={reinforceBorders}>
            Reinforce Borders
          </button>
          <div style={{ opacity: 0.7, marginTop: 8, fontSize: 12 }}>
            Reduces border pressure, increases security, slightly decreases happiness.
          </div>
        </Box>
      </div>
    </div>
  );
}

function QueueBox({ title, q, disabled, onApprove, onReject, onFast }) {
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
      <div style={{ display:"grid", gap: 6, opacity: 0.92 }}>
        <div>Applicants: <b>{q.applicants}</b></div>
        <div>Approved: <b>{q.approvals}</b></div>
        <div>Rejected: <b>{q.rejected}</b></div>
      </div>

      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        <button disabled={disabled} onClick={onApprove}>Approve batch</button>
        <button disabled={disabled} onClick={onReject}>Reject batch</button>
        <button disabled={disabled} onClick={onFast}>Fast-track processing</button>
      </div>

      <div style={{ opacity: 0.7, marginTop: 10, fontSize: 12 }}>
        Each action counts as your monthly decision.
      </div>
    </div>
  );
}
