import { useMemo, useState } from "react";
import { useGame } from "../game/GameContext";
import { addLog, clampAll } from "../game/gameEngine";
import { generatePerson } from "../game/nameGenerator";

function Box({ title, children }) {
  return (
    <div style={{
      padding: 16,
      borderRadius: 18,
      background:"rgba(255,255,255,0.06)",
      border:"1px solid rgba(255,255,255,0.10)"
    }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {children}
    </div>
  );
}

function StatLine({ label, value }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", opacity: 0.92 }}>
      <span style={{ opacity: 0.75 }}>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function Pill({ children }) {
  return (
    <span style={{
      display:"inline-block",
      padding:"4px 10px",
      borderRadius: 999,
      background:"rgba(255,255,255,0.08)",
      border:"1px solid rgba(255,255,255,0.10)",
      fontSize: 12,
      opacity: 0.95
    }}>
      {children}
    </span>
  );
}

export default function Government() {
  const { game, setGame } = useGame();
  const [selectedMinistryId, setSelectedMinistryId] = useState("economy");

  if (!game) {
    return (
      <div style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
        <h2>Government</h2>
        <p style={{ opacity: 0.75 }}>Pick a country first.</p>
      </div>
    );
  }

  const gs = game.governmentSystem;
  const ministries = gs.ministries || [];

  const ministry = useMemo(
    () => ministries.find(m => m.id === selectedMinistryId) || ministries[0],
    [ministries, selectedMinistryId]
  );

  function replaceMinister() {
    if (game.choseDecisionThisTurn) return;

    const g = structuredClone(game);
    const min = g.governmentSystem.ministries.find(m => m.id === selectedMinistryId);
    if (!min) return;

    g.choseDecisionThisTurn = true;

    const cost = 120;
    if (g.stats.money < cost) {
      addLog(g, "Government: Not enough money to replace minister.");
      g.choseDecisionThisTurn = false;
      setGame(g);
      return;
    }

    g.stats.money -= cost;

    const oldName = min.minister?.name || "Unknown";
    min.minister = generatePerson("Minister");

    // effects (reshuffle)
    g.stats.parliament -= 2; // some backlash
    g.stats.stability -= 1;

    addLog(g, `Government: Replaced minister of ${min.name}.`);
    addLog(g, `Outgoing: ${oldName}. Incoming: ${min.minister.name}.`);

    clampAll(g);
    setGame(g);
  }

  function hireSecretary() {
    if (game.choseDecisionThisTurn) return;

    const g = structuredClone(game);
    const min = g.governmentSystem.ministries.find(m => m.id === selectedMinistryId);
    if (!min) return;

    g.choseDecisionThisTurn = true;

    const cost = 60;
    if (g.stats.money < cost) {
      addLog(g, "Government: Not enough money to hire secretary.");
      g.choseDecisionThisTurn = false;
      setGame(g);
      return;
    }

    g.stats.money -= cost;
    const sec = generatePerson("Secretary");
    min.secretaries.push(sec);

    // tiny efficiency improvement
    g.stats.stability += 1;

    addLog(g, `Government: Hired new secretary (${sec.name}) in ${min.name}.`);

    clampAll(g);
    setGame(g);
  }

  function fireSecretary(index) {
    if (game.choseDecisionThisTurn) return;

    const g = structuredClone(game);
    const min = g.governmentSystem.ministries.find(m => m.id === selectedMinistryId);
    if (!min) return;

    g.choseDecisionThisTurn = true;

    if (!min.secretaries[index]) {
      g.choseDecisionThisTurn = false;
      setGame(g);
      return;
    }

    const old = min.secretaries[index];
    min.secretaries.splice(index, 1);

    // backlash risk
    if (Math.random() < 0.25) {
      g.stats.parliament -= 2;
      addLog(g, "Backlash: Fired staff causes political criticism in parliament.");
    } else {
      g.stats.corruption -= 1; // cleaner admin
    }

    addLog(g, `Government: Removed secretary (${old.name}) from ${min.name}.`);

    clampAll(g);
    setGame(g);
  }

  function appointAdvisor() {
    if (game.choseDecisionThisTurn) return;

    const g = structuredClone(game);
    g.choseDecisionThisTurn = true;

    const cost = 70;
    if (g.stats.money < cost) {
      addLog(g, "Government: Not enough money to appoint advisor.");
      g.choseDecisionThisTurn = false;
      setGame(g);
      return;
    }

    g.stats.money -= cost;
    const adv = generatePerson("Advisor");
    g.governmentSystem.advisors.push(adv);

    // advisor effect: +capital small
    g.stats.capital = Math.min(10, g.stats.capital + 1);

    addLog(g, `Government: Appointed advisor ${adv.name}. Political capital +1.`);

    clampAll(g);
    setGame(g);
  }

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
      <h2 style={{ marginTop: 10 }}>Government</h2>
      <p style={{ opacity: 0.75, marginTop: 6 }}>
        Ministries, ministers, secretaries, and high-level appointments.
      </p>

      {game.choseDecisionThisTurn && (
        <div style={{
          marginTop: 10,
          padding: 12,
          borderRadius: 14,
          border: "1px solid rgba(0,180,255,0.35)",
          background: "rgba(0,180,255,0.10)",
        }}>
          You already made a decision this month. Go to Dashboard → Next Month.
        </div>
      )}

      <div style={{ marginTop: 14, display:"grid", gridTemplateColumns:"1fr 1fr", gap: 14 }}>
        <Box title="State Leadership">
          <StatLine label="Treasury" value={game.stats.money} />
          <StatLine label="Parliament Support" value={game.stats.parliament} />
          <StatLine label="Stability" value={game.stats.stability} />
          <StatLine label="Corruption" value={game.stats.corruption} />
          <StatLine label="Political Capital" value={game.stats.capital} />
        </Box>

        <Box title="Advisors">
          {gs.advisors?.length ? (
            <div style={{ display:"grid", gap: 8 }}>
              {gs.advisors.slice(-6).reverse().map((a, i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", gap: 10 }}>
                  <span style={{ opacity: 0.9 }}>{a.name}</span>
                  <span style={{ opacity: 0.75, fontSize: 12 }}>
                    Skill {a.skill}/5 • Loyalty {a.loyalty}/5
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ opacity: 0.7 }}>No advisors yet.</div>
          )}

          <div style={{ marginTop: 10 }}>
            <button disabled={game.choseDecisionThisTurn} onClick={appointAdvisor}>
              Appoint Advisor
            </button>
          </div>
        </Box>
      </div>

      <div style={{ marginTop: 14, display:"grid", gridTemplateColumns:"360px 1fr", gap: 14 }}>
        <Box title="Ministries">
          <div style={{ display:"grid", gap: 8 }}>
            {ministries.map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedMinistryId(m.id)}
                style={{
                  textAlign:"left",
                  padding:"10px 12px",
                  borderRadius: 14,
                  border: m.id === selectedMinistryId
                    ? "1px solid rgba(255,255,255,0.25)"
                    : "1px solid rgba(255,255,255,0.10)",
                  background: m.id === selectedMinistryId
                    ? "rgba(255,255,255,0.10)"
                    : "rgba(0,0,0,0.12)",
                }}
              >
                <div style={{ fontWeight: 800 }}>{m.name}</div>
                <div style={{ opacity: 0.75, fontSize: 12 }}>
                  Minister: {m.minister?.name || "None"}
                </div>
              </button>
            ))}
          </div>
        </Box>

        <Box title={ministry ? ministry.name : "Ministry"}>
          {!ministry ? (
            <div style={{ opacity: 0.7 }}>No ministry selected.</div>
          ) : (
            <>
              <div style={{ display:"flex", gap: 10, flexWrap:"wrap", alignItems:"center" }}>
                <Pill>Minister: {ministry.minister?.name || "None"}</Pill>
                {ministry.minister && (
                  <Pill>Skill {ministry.minister.skill}/5</Pill>
                )}
                {ministry.minister && (
                  <Pill>Loyalty {ministry.minister.loyalty}/5</Pill>
                )}
              </div>

              <div style={{ marginTop: 10, display:"flex", gap: 10, flexWrap:"wrap" }}>
                <button disabled={game.choseDecisionThisTurn} onClick={replaceMinister}>
                  Replace Minister
                </button>
                <button disabled={game.choseDecisionThisTurn} onClick={hireSecretary}>
                  Hire Secretary
                </button>
              </div>

              <div style={{ marginTop: 14 }}>
                <h4 style={{ margin: 0, opacity: 0.9 }}>Secretaries</h4>
                {ministry.secretaries?.length ? (
                  <div style={{ display:"grid", gap: 10, marginTop: 10 }}>
                    {ministry.secretaries.map((s, idx) => (
                      <div key={s.id || idx} style={{
                        padding: 12,
                        borderRadius: 14,
                        background:"rgba(0,0,0,0.18)",
                        border:"1px solid rgba(255,255,255,0.10)",
                        display:"flex",
                        justifyContent:"space-between",
                        alignItems:"center",
                        gap: 10
                      }}>
                        <div>
                          <div style={{ fontWeight: 800 }}>{s.name}</div>
                          <div style={{ opacity: 0.75, fontSize: 12 }}>
                            Skill {s.skill}/5 • Loyalty {s.loyalty}/5 • {s.trait}
                          </div>
                        </div>
                        <button disabled={game.choseDecisionThisTurn} onClick={() => fireSecretary(idx)}>
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ opacity: 0.7, marginTop: 10 }}>No secretaries assigned.</div>
                )}
              </div>
            </>
          )}
        </Box>
      </div>
    </div>
  );
}
