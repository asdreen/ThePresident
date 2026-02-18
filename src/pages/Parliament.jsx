import { useMemo, useState } from "react";
import { useGame } from "../game/GameContext";
import { addLog, clampAll } from "../game/gameEngine";

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

function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }

const BILL_TEMPLATES = [
  {
    id: "anti_corruption_package",
    title: "Anti-Corruption Package",
    desc: "Tougher procurement rules and audits.",
    difficulty: 58,
    apply: (g) => {
      g.stats.corruption -= 5;
      g.stats.stability += 1;
      g.stats.happiness += 1;
    },
    lawAdd: { title: "Anti-Corruption Package", summary: "Procurement rules and audits strengthened." }
  },
  {
    id: "education_reform_act",
    title: "Education Reform Act",
    desc: "Curriculum reform and teacher standards.",
    difficulty: 55,
    apply: (g) => {
      g.stats.money -= 120;
      g.education.reformsLevel += 6;
      g.stats.jobs += 1;
      g.stats.happiness += 1;
    },
    lawAdd: { title: "Education Reform Act", summary: "Curriculum and teacher standards updated." }
  },
  {
    id: "health_insurance_expansion",
    title: "Health Insurance Expansion",
    desc: "Increase insurance coverage and hospital funding.",
    difficulty: 56,
    apply: (g) => {
      g.stats.money -= 140;
      g.health.insuranceCoverage += 6;
      g.stats.happiness += 2;
    },
    lawAdd: { title: "Health Insurance Expansion", summary: "Insurance expanded; funding allocated." }
  },
  {
    id: "border_security_act",
    title: "Border Security Act",
    desc: "Increase border controls and screening.",
    difficulty: 60,
    apply: (g) => {
      g.stats.money -= 120;
      g.stats.security += 3;
      g.migration.borderPressure -= 4;
      g.stats.happiness -= 1;
    },
    lawAdd: { title: "Border Security Act", summary: "Border controls expanded; screening increased." }
  },
];

export default function Parliament() {
  const { game, setGame } = useGame();
  const [tab, setTab] = useState("coalition"); // coalition | bills | members
  const [selectedTemplateId, setSelectedTemplateId] = useState(BILL_TEMPLATES[0].id);

  if (!game) {
    return (
      <div style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
        <h2>Parliament</h2>
        <p style={{ opacity: 0.75 }}>Pick a country first.</p>
      </div>
    );
  }

  const ps = game.parliamentSystem;

  const partyMap = useMemo(() => {
    const m = new Map();
    ps.parties.forEach(p => m.set(p.id, p));
    return m;
  }, [ps.parties]);

  const totalSeats = useMemo(() => ps.parties.reduce((a,p)=>a+p.seats, 0), [ps.parties]);
  const majority = Math.floor(totalSeats / 2) + 1;

  const coalitionSeats = useMemo(() => {
    return ps.coalition.reduce((sum, id) => sum + (partyMap.get(id)?.seats || 0), 0);
  }, [ps.coalition, partyMap]);

  function toggleCoalition(partyId) {
    const g = structuredClone(game);
    const list = new Set(g.parliamentSystem.coalition);
    if (list.has(partyId)) list.delete(partyId);
    else list.add(partyId);
    g.parliamentSystem.coalition = Array.from(list);
    addLog(g, `Parliament: Coalition updated (${g.parliamentSystem.coalition.join(", ") || "none"}).`);
    clampAll(g);
    setGame(g);
  }

  function draftBill() {
    if (game.choseDecisionThisTurn) return;

    const tpl = BILL_TEMPLATES.find(x => x.id === selectedTemplateId);
    if (!tpl) return;

    const g = structuredClone(game);

    g.parliamentSystem.bills.push({
      id: crypto.randomUUID(),
      title: tpl.title,
      desc: tpl.desc,
      difficulty: tpl.difficulty,
      templateId: tpl.id,
      createdTurn: g.turn,
    });

    addLog(g, `Parliament: Drafted bill "${tpl.title}" and added to agenda.`);
    clampAll(g);
    setGame(g);
  }

  function voteBill(billId) {
    if (game.choseDecisionThisTurn) return;

    const g = structuredClone(game);
    const bills = g.parliamentSystem.bills;
    const bill = bills.find(b => b.id === billId);
    if (!bill) return;

    g.choseDecisionThisTurn = true;

    // Voting chance based on:
    // - coalition seats (big effect)
    // - parliament support stat
    // - political capital
    const seats = g.parliamentSystem.coalition.reduce((sum, id) => sum + (g.parliamentSystem.parties.find(p => p.id === id)?.seats || 0), 0);
    const seatPct = seats / totalSeats; // 0..1

    const base = g.stats.parliament;      // 0..100
    const capBoost = g.stats.capital * 5; // 0..50
    const seatBoost = Math.round(seatPct * 40); // 0..40

    const chance = clamp(base + capBoost + seatBoost - bill.difficulty, 5, 95);
    const roll = Math.random() * 100;

    addLog(g, `Parliament Vote: "${bill.title}"`);
    addLog(g, `Chance ${Math.round(chance)}% (Seats ${seats}/${totalSeats}, Capital ${g.stats.capital}).`);

    // Spend capital
    g.stats.capital = Math.max(0, g.stats.capital - 1);

    if (roll >= chance) {
      addLog(g, `RESULT: FAILED. Opposition blocked the bill.`);
      g.stats.happiness -= 1;
      g.stats.stability -= 1;
      clampAll(g);
      setGame(g);
      return;
    }

    // PASSED: apply effects
    const tpl = BILL_TEMPLATES.find(x => x.id === bill.templateId);
    if (tpl?.apply) tpl.apply(g);

    // Add to law list (Law page)
    if (!Array.isArray(g.law.laws)) g.law.laws = [];
    if (tpl?.lawAdd) {
      g.law.laws.push({
        title: tpl.lawAdd.title,
        summary: tpl.lawAdd.summary,
        dateTurn: g.turn,
      });
    } else {
      g.law.laws.push({ title: bill.title, summary: bill.desc, dateTurn: g.turn });
    }

    // Move bill to passed history
    g.parliamentSystem.passed.push({ ...bill, passedTurn: g.turn });
    g.parliamentSystem.bills = g.parliamentSystem.bills.filter(b => b.id !== billId);

    addLog(g, `RESULT: PASSED. Law enacted: "${bill.title}".`);

    clampAll(g);
    setGame(g);
  }

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
      <h2 style={{ marginTop: 10 }}>Parliament</h2>
      <p style={{ opacity: 0.75, marginTop: 6 }}>
        Build coalitions, draft bills, and vote laws into existence.
      </p>

      <div style={{ marginTop: 10, display:"flex", gap: 10, flexWrap:"wrap" }}>
        <button onClick={() => setTab("coalition")} style={{ opacity: tab==="coalition"?1:0.75 }}>Coalition</button>
        <button onClick={() => setTab("bills")} style={{ opacity: tab==="bills"?1:0.75 }}>Bills</button>
        <button onClick={() => setTab("members")} style={{ opacity: tab==="members"?1:0.75 }}>Members</button>
      </div>

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
        <Box title="Parliament Status">
          <StatLine label="Support (stat)" value={game.stats.parliament} />
          <StatLine label="Political Capital" value={game.stats.capital} />
          <StatLine label="Coalition Seats" value={`${coalitionSeats} / ${totalSeats} (majority ${majority})`} />
          <StatLine label="Bills in Agenda" value={ps.bills.length} />
          <StatLine label="Laws Passed" value={ps.passed.length} />
        </Box>

        <Box title="Parties">
          {ps.parties.map(p => {
            const inCoalition = ps.coalition.includes(p.id);
            return (
              <div key={p.id} style={{
                padding: 10,
                borderRadius: 14,
                marginBottom: 8,
                background:"rgba(0,0,0,0.18)",
                border:"1px solid rgba(255,255,255,0.10)",
                display:"flex",
                justifyContent:"space-between",
                alignItems:"center"
              }}>
                <div>
                  <div style={{ fontWeight: 800 }}>{p.name}</div>
                  <div style={{ opacity: 0.75, fontSize: 12 }}>{p.ideology} • Seats: {p.seats}</div>
                </div>
                <button onClick={() => toggleCoalition(p.id)}>
                  {inCoalition ? "Remove" : "Add"}
                </button>
              </div>
            );
          })}
        </Box>
      </div>

      {tab === "coalition" && (
        <div style={{ marginTop: 14 }}>
          <Box title="Coalition Builder">
            <div style={{ opacity: 0.85 }}>
              Your coalition parties: <b>{ps.coalition.map(id => partyMap.get(id)?.name).filter(Boolean).join(", ") || "None"}</b>
            </div>
            <div style={{ opacity: 0.75, marginTop: 6 }}>
              Coalition seats are used to improve vote chances. Aim for majority.
            </div>
          </Box>
        </div>
      )}

      {tab === "bills" && (
        <div style={{ marginTop: 14, display:"grid", gridTemplateColumns:"1fr 1fr", gap: 14 }}>
          <Box title="Draft a Bill">
            <div style={{ opacity: 0.8, marginBottom: 6 }}>Choose bill type:</div>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(0,0,0,0.18)",
                color: "rgba(255,255,255,0.92)",
              }}
            >
              {BILL_TEMPLATES.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>

            <div style={{ marginTop: 10, opacity: 0.75, fontSize: 13 }}>
              Drafting a bill does NOT consume the monthly decision.
              Voting a bill DOES consume it.
            </div>

            <div style={{ marginTop: 10 }}>
              <button onClick={draftBill}>Add to Agenda</button>
            </div>
          </Box>

          <Box title="Agenda (Vote Bills)">
            {ps.bills.length === 0 ? (
              <div style={{ opacity: 0.7 }}>No bills drafted yet.</div>
            ) : (
              <div style={{ display:"grid", gap: 10 }}>
                {ps.bills.slice(-10).reverse().map(b => (
                  <div key={b.id} style={{
                    padding: 12,
                    borderRadius: 14,
                    background:"rgba(0,0,0,0.18)",
                    border:"1px solid rgba(255,255,255,0.10)"
                  }}>
                    <div style={{ fontWeight: 800 }}>{b.title}</div>
                    <div style={{ opacity: 0.75, marginTop: 6 }}>{b.desc}</div>
                    <div style={{ opacity: 0.65, marginTop: 8, fontSize: 12 }}>
                      Difficulty: {b.difficulty}
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <button disabled={game.choseDecisionThisTurn} onClick={() => voteBill(b.id)}>
                        Vote Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Box>
        </div>
      )}

      {tab === "members" && (
        <div style={{ marginTop: 14 }}>
          <Box title="Members of Parliament (MPs)">
            <div style={{ opacity: 0.7, marginBottom: 10, fontSize: 12 }}>
              Showing first 80 MPs (you can add search later).
            </div>
            <div style={{ display:"grid", gap: 8 }}>
              {ps.members.slice(0, 80).map(m => (
                <div key={m.id} style={{
                  padding: 10,
                  borderRadius: 14,
                  background:"rgba(0,0,0,0.18)",
                  border:"1px solid rgba(255,255,255,0.10)",
                  display:"flex",
                  justifyContent:"space-between",
                  gap: 10
                }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>{m.name}</div>
                    <div style={{ opacity: 0.75, fontSize: 12 }}>
                      Party: {partyMap.get(m.partyId)?.name || m.partyId}
                    </div>
                  </div>
                  <div style={{ textAlign:"right", opacity: 0.85 }}>
                    <div>Influence: <b>{m.influence}</b></div>
                    <div>Loyalty: <b>{m.loyalty}</b></div>
                  </div>
                </div>
              ))}
            </div>
          </Box>
        </div>
      )}
    </div>
  );
}
