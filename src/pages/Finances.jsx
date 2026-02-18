import { useMemo, useState } from "react";
import { useGame } from "../game/GameContext";
import { addLog, clampAll, applyForLoan } from "../game/gameEngine";

function Box({ title, children }) {
  return (
    <div style={{ padding:16, borderRadius:18, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.10)" }}>
      <h3 style={{ marginTop:0 }}>{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value, children }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:14, background:"rgba(0,0,0,0.18)", border:"1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ opacity:0.8 }}>{label}</div>
      <div style={{ display:"flex", gap:10, alignItems:"center" }}>
        {children}
        <b style={{ opacity:0.95 }}>{value}</b>
      </div>
    </div>
  );
}

function NumInput({ value, onChange }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{
        width: 110,
        padding: "8px 10px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(0,0,0,0.18)",
        color: "rgba(255,255,255,0.92)",
      }}
    />
  );
}

export default function Finance() {
  const { game, setGame } = useGame();
  const [loanAmount, setLoanAmount] = useState(500);

  if (!game) return <div style={{ padding:16 }}>Pick a country first.</div>;

  const f = game.financeSystem;

  const totals = useMemo(() => {
    const a = f.allocations;
    const ministriesTotal = Object.values(a.ministries || {}).reduce((sum, x) => sum + (x || 0), 0);
    const spendingTotal =
      (a.government || 0) +
      ministriesTotal +
      (a.regions || 0) +
      (a.diplomacy || 0) +
      (a.culture || 0) +
      (a.sportsClubs || 0) +
      (a.research || 0);

    const incomeTotal = (f.income.baseTaxes || 0) + (f.income.customs || 0) + (f.income.stateCompanies || 0) + (f.income.other || 0);

    return { ministriesTotal, spendingTotal, incomeTotal };
  }, [f]);

  function setIncomeField(key, val) {
    const g = structuredClone(game);
    g.financeSystem.income[key] = Math.max(0, val);
    setGame(g);
  }

  function setAlloc(key, val) {
    const g = structuredClone(game);
    g.financeSystem.allocations[key] = Math.max(0, val);
    setGame(g);
  }

  function setMinistryAlloc(id, val) {
    const g = structuredClone(game);
    g.financeSystem.allocations.ministries[id] = Math.max(0, val);
    setGame(g);
  }

  function requestLoan() {
    if (game.choseDecisionThisTurn) return;

    const g = structuredClone(game);
    g.choseDecisionThisTurn = true;

    const amt = Math.max(100, Math.min(5000, loanAmount));
    const res = applyForLoan(g, amt, addLog);

    clampAll(g);
    setGame(g);

    if (!res.ok) {
      // keep decision consumed to prevent spam
      return;
    }
  }

  return (
    <div style={{ padding:16, maxWidth:1200, margin:"0 auto" }}>
      <h2 style={{ marginTop:10 }}>Finance</h2>
      <p style={{ opacity:0.75 }}>Plan income & spending, distribute budgets, apply for state credit.</p>

      {game.choseDecisionThisTurn && (
        <div style={{ marginTop:10, padding:12, borderRadius:14, border:"1px solid rgba(0,180,255,0.35)", background:"rgba(0,180,255,0.10)" }}>
          You already used your monthly decision. Budget editing is allowed, but loans require a decision.
        </div>
      )}

      <div style={{ marginTop:14, display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <Box title="Treasury & Debt">
          <Row label="Treasury" value={game.stats.money} />
          <Row label="Debt Outstanding" value={f.debt.outstanding} />
          <Row label="Interest Rate (yearly)" value={`${(f.debt.interestRate*100).toFixed(1)}%`} />
          <Row label="Credit Score" value={`${f.debt.creditScore}/100`} />
          <div style={{ opacity:0.7, marginTop:10, fontSize:12 }}>
            Credit score is influenced by stability, happiness, corruption, deficits, and debt level.
          </div>
        </Box>

        <Box title="Last Month Report">
          <Row label="Income" value={f.lastMonth.income} />
          <Row label="Spending" value={f.lastMonth.spending} />
          <Row label="Debt Service" value={f.lastMonth.debtService} />
          <Row label="Balance" value={f.lastMonth.balance} />
        </Box>
      </div>

      <div style={{ marginTop:14, display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <Box title="Income (Monthly)">
          <Row label="Base Taxes" value={f.income.baseTaxes}>
            <NumInput value={f.income.baseTaxes} onChange={(v) => setIncomeField("baseTaxes", v)} />
          </Row>
          <Row label="Customs" value={f.income.customs}>
            <NumInput value={f.income.customs} onChange={(v) => setIncomeField("customs", v)} />
          </Row>
          <Row label="State Companies" value={f.income.stateCompanies}>
            <NumInput value={f.income.stateCompanies} onChange={(v) => setIncomeField("stateCompanies", v)} />
          </Row>
          <Row label="Other" value={f.income.other}>
            <NumInput value={f.income.other} onChange={(v) => setIncomeField("other", v)} />
          </Row>

          <div style={{ opacity:0.7, marginTop:10, fontSize:12 }}>
            Real taxes also grow with Jobs + Economy infrastructure each month (auto).
          </div>
        </Box>

        <Box title="Spending (Monthly)">
          <Row label="Government" value={f.allocations.government}>
            <NumInput value={f.allocations.government} onChange={(v) => setAlloc("government", v)} />
          </Row>
          <Row label="Regions" value={f.allocations.regions}>
            <NumInput value={f.allocations.regions} onChange={(v) => setAlloc("regions", v)} />
          </Row>
          <Row label="Diplomacy" value={f.allocations.diplomacy}>
            <NumInput value={f.allocations.diplomacy} onChange={(v) => setAlloc("diplomacy", v)} />
          </Row>
          <Row label="Culture" value={f.allocations.culture}>
            <NumInput value={f.allocations.culture} onChange={(v) => setAlloc("culture", v)} />
          </Row>
          <Row label="Sports Clubs" value={f.allocations.sportsClubs}>
            <NumInput value={f.allocations.sportsClubs} onChange={(v) => setAlloc("sportsClubs", v)} />
          </Row>
          <Row label="Research" value={f.allocations.research}>
            <NumInput value={f.allocations.research} onChange={(v) => setAlloc("research", v)} />
          </Row>

          <div style={{ marginTop:10, opacity:0.85 }}>
            <b>Totals:</b> Income {totals.incomeTotal} • Spending {totals.spendingTotal}
          </div>
        </Box>
      </div>

      <div style={{ marginTop:14 }}>
        <Box title="Ministry Budgets (Monthly)">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {Object.entries(f.allocations.ministries).map(([id, val]) => (
              <Row key={id} label={id.toUpperCase()} value={val}>
                <NumInput value={val} onChange={(v) => setMinistryAlloc(id, v)} />
              </Row>
            ))}
          </div>
        </Box>
      </div>

      <div style={{ marginTop:14 }}>
        <Box title="Apply for State Credit (Loan)">
          <div style={{ opacity:0.75 }}>
            Loan amount (100–5000):
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center", marginTop:10, flexWrap:"wrap" }}>
            <NumInput value={loanAmount} onChange={setLoanAmount} />
            <button disabled={game.choseDecisionThisTurn} onClick={requestLoan}>
              Apply for Loan
            </button>
          </div>
          <div style={{ opacity:0.7, marginTop:10, fontSize:12 }}>
            Loan approval depends on credit score and corruption. Loan consumes your monthly decision.
          </div>
        </Box>
      </div>
    </div>
  );
}
