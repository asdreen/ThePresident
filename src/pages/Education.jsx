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

export default function Education() {
  const { game, setGame } = useGame();

  if (!game) {
    return (
      <div style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
        <h2>Education</h2>
        <p style={{ opacity: 0.75 }}>Pick a country first.</p>
      </div>
    );
  }

  const e = game.education;

  function doAction(type) {
    if (game.choseDecisionThisTurn) return;
    
    const { skill } = getMinisterBonus(g, "education");
    const g = structuredClone(game);
    const mult = getBudgetMultiplier(g, "health"); // example

    g.choseDecisionThisTurn = true;

    if (type === "school_infra") {
      g.stats.money -= 150;
      g.education.schoolsInfrastructure += 7;
      g.stats.happiness += 1;
      g.stats.stability += 1;
      addLog(g, "Education: Upgraded schools infrastructure (repairs, heating, labs).");
    }

    if (type === "university_modernize") {
      g.stats.money -= 170;
      g.education.universityQuality += skill;
      g.stats.jobs += 1;
      g.stats.happiness += 1;
      addLog(g, "Education: Modernized universities (research funding, quality standards).");
    }

    if (type === "teacher_salaries") {
      g.stats.money -= 120;
      g.education.teachersPer1000 += 0.4;
      g.education.reformsLevel += 6 + Math.floor(skill / 2);
      g.stats.happiness += 2;
      addLog(g, "Education: Increased teacher salaries and hiring.");
    }

    if (type === "education_reform") {
      g.stats.money -= 140;
      g.education.reformsLevel += 6;
      g.stats.jobs += 1;
      g.stats.stability += 1;
      addLog(g, "Education: Launched education reform (curriculum + standards).");

      // Reform can cause short-term controversy
      if (Math.random() < 0.15) {
        g.stats.happiness -= 2;
        addLog(g, "Backlash: Reform protests from unions/parents. Happiness -2.");
      }
    }

    if (type === "scholarships") {
      g.stats.money -= 90;
      g.education.universityQuality += 2;
      g.education.literacy += 0.5;
      g.stats.happiness += 1;
      addLog(g, "Education: Scholarship program expanded for low-income students.");
    }

    if (type === "digital_classrooms") {
      g.stats.money -= 110;
      g.education.schoolsInfrastructure += 3;
      g.education.reformsLevel += 3;
      g.stats.jobs += 1;
      addLog(g, "Education: Digital classrooms (devices, internet, teacher training).");
    }

    // clamp edu stats
    g.education.literacy = clamp(g.education.literacy, 40, 100);
    g.education.universityQuality = clamp(g.education.universityQuality, 0, 100);
    g.education.schoolsInfrastructure = clamp(g.education.schoolsInfrastructure, 0, 100);
    g.education.reformsLevel = clamp(g.education.reformsLevel, 0, 100);
    g.education.teachersPer1000 = Math.max(0, Number(g.education.teachersPer1000.toFixed(2)));

    // Long-term effect (small immediate): better education improves jobs slowly
    if (g.education.reformsLevel >= 60 && Math.random() < 0.25) {
      g.stats.jobs += 1;
      addLog(g, "Education impact: Workforce skills improved. Jobs +1.");
    }

    ministerRisk(g, "education", addLog);
    clampAll(g);
    setGame(g);
  }

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
      <h2 style={{ marginTop: 10 }}>Education</h2>
      <p style={{ opacity: 0.75, marginTop: 6 }}>
        Reform schools, universities, teachers, and education infrastructure.
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
        <Box title="Education Status">
          <StatLine label="Literacy" value={`${e.literacy}%`} />
          <StatLine label="University Quality" value={e.universityQuality} />
          <StatLine label="Schools Infrastructure" value={e.schoolsInfrastructure} />
          <StatLine label="Teachers per 1000" value={e.teachersPer1000} />
          <StatLine label="Reforms Level" value={e.reformsLevel} />
          <div style={{ opacity: 0.7, marginTop: 8, fontSize: 12 }}>
            Higher reforms + university quality boosts jobs over time.
          </div>
        </Box>

        <Box title="Education Decisions">
          <div style={{ display: "grid", gap: 10 }}>
            <Decision
              title="Upgrade Schools Infrastructure"
              desc="Better buildings, labs, and classrooms. Improves stability."
              disabled={game.choseDecisionThisTurn}
              onClick={() => doAction("school_infra")}
            />
            <Decision
              title="Modernize Universities"
              desc="Research funding and standards. Improves jobs and quality."
              disabled={game.choseDecisionThisTurn}
              onClick={() => doAction("university_modernize")}
            />
            <Decision
              title="Increase Teacher Salaries"
              desc="Hire/retain teachers. Improves happiness and reforms."
              disabled={game.choseDecisionThisTurn}
              onClick={() => doAction("teacher_salaries")}
            />
            <Decision
              title="Education Reform Package"
              desc="Curriculum reform + standards. Risk of short-term backlash."
              disabled={game.choseDecisionThisTurn}
              onClick={() => doAction("education_reform")}
            />
            <Decision
              title="Scholarship Expansion"
              desc="Boost access and literacy. Small cost, steady improvement."
              disabled={game.choseDecisionThisTurn}
              onClick={() => doAction("scholarships")}
            />
            <Decision
              title="Digital Classrooms"
              desc="Devices + internet + training. Improves reforms and jobs."
              disabled={game.choseDecisionThisTurn}
              onClick={() => doAction("digital_classrooms")}
            />
          </div>
        </Box>
      </div>
    </div>
  );
}
