import { useMemo, useState } from "react";
import { useGame } from "../game/GameContext";
import { addLog, clampAll, parliamentVote, canJoinInstitution } from "../game/gameEngine";
import { useAllCountries } from "../game/useAllCountries";
import { getMinisterBonus, ministerRisk } from "../game/gameEngine";
import { getBudgetMultiplier } from "../game/gameEngine";

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

function CountryPicker({ label, countries, value, onChange }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return countries.slice(0, 60);
    return countries
      .filter(c => c.name.toLowerCase().includes(qq) || c.iso2.toLowerCase().includes(qq))
      .slice(0, 60);
  }, [countries, q]);

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ opacity: 0.8, marginBottom: 6 }}>{label}</div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search country (Germany, Albania, US...)"
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(0,0,0,0.18)",
          color: "rgba(255,255,255,0.92)",
          outline: "none"
        }}
      />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          marginTop: 8,
          padding: "10px 12px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(0,0,0,0.18)",
          color: "rgba(255,255,255,0.92)",
        }}
      >
        {filtered.map(c => (
          <option key={c.id} value={c.name}>
            {c.name} ({c.iso2})
          </option>
        ))}
      </select>
      <div style={{ opacity: 0.65, marginTop: 6, fontSize: 12 }}>
        Showing up to 60 matches. Type more to narrow.
      </div>
    </div>
  );
}

export default function Embassies() {
  const { game, setGame } = useGame();
  const { countries, loading, error } = useAllCountries();

  const [openTarget, setOpenTarget] = useState("Germany");
  const [missionTarget, setMissionTarget] = useState("United Kingdom");
  const [agreementPartner, setAgreementPartner] = useState("France");
  const [agreementFocus, setAgreementFocus] = useState("Economy");

  if (!game) {
    return (
      <div style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
        <h2><h2>Embassies</h2></h2>
        <p style={{ opacity: 0.75 }}>Pick a country first.</p>
      </div>
    );
  }

  const fa = game.foreignAffairs;

  function openEmbassy(targetCountry) {
    const g = structuredClone(game);
    const mult = getBudgetMultiplier(g, "health"); // example

const { skill } = getMinisterBonus(g, "foreign");
g.diplomacy.reputation += 1 + Math.floor(skill / 2);

    // prevent duplicates
    if (g.foreignAffairs.embassiesAbroad.some(e => e.country === targetCountry)) {
      addLog(g, `External Affairs: Embassy in ${targetCountry} already exists.`);
      setGame(g);
      return;
    }

    g.stats.money -= 150;
    g.diplomacy.reputation += 3;
    g.diplomacy.embassies += 1;

    g.foreignAffairs.embassiesAbroad.push({
      country: targetCountry,
      city: "Capital",
      ambassador: "TBD",
    });

    ministerRisk(g, "foreign", addLog);
    addLog(g, `External Affairs: Opened an embassy in ${targetCountry}.`);
    clampAll(g);
    setGame(g);
  }

  function acceptMission(fromCountry) {
    const g = structuredClone(game);

    if (g.foreignAffairs.missionsInCountry.some(m => m.country === fromCountry)) {
      addLog(g, `External Affairs: Mission from ${fromCountry} already exists.`);
      setGame(g);
      return;
    }

    g.stats.money -= 40;
    g.diplomacy.reputation += 1;

    g.foreignAffairs.missionsInCountry.push({
      country: fromCountry,
      city: game.country?.capital || "Capital",
      ambassador: "TBD",
    });

    addLog(g, `External Affairs: Accepted foreign mission from ${fromCountry}.`);
    clampAll(g);
    setGame(g);
  }

  function toggleMembership(key, label) {
  const g = structuredClone(game);
  const current = g.foreignAffairs.memberships[key];

  // Leaving is always allowed (but has penalty)
  if (current) {
    g.foreignAffairs.memberships[key] = false;
    g.diplomacy.reputation -= 6;
    addLog(g, `External Affairs: Left ${label}. Reputation -6.`);
    clampAll(g);
    setGame(g);
    return;
  }

  // Joining: enforce requirements
  const rule = canJoinInstitution(g, key);
  if (!rule) {
    addLog(g, `External Affairs: Unknown institution "${label}".`);
    setGame(g);
    return;
  }

  // Check requirements
  const failed = rule.checks.filter(c => !c.ok);
  if (failed.length) {
    addLog(g, `JOIN FAILED: Cannot join ${rule.label}.`);
    failed.forEach(f => addLog(g, `- ${f.msg}`));
    setGame(g);
    return;
  }

  // Parliament vote if needed
  if (rule.needsVote) {
    const res = parliamentVote(g, rule.voteDifficulty);
    addLog(g, `Parliament vote for ${rule.label}: ${res.passed ? "PASSED" : "FAILED"} (${res.chance}%)`);
    g.stats.capital = Math.max(0, g.stats.capital - 1);

    if (!res.passed) {
      g.stats.happiness -= 1;
      g.stats.stability -= 2;
      clampAll(g);
      setGame(g);
      return;
    }
  }

  // Cost + effects
  if (g.stats.money < rule.costMoney) {
    addLog(g, `JOIN FAILED: Not enough money to join ${rule.label} (needs ${rule.costMoney}).`);
    setGame(g);
    return;
  }

  g.stats.money -= rule.costMoney;
  g.diplomacy.reputation += rule.repGain;
  g.foreignAffairs.memberships[key] = true;

  addLog(g, `External Affairs: Joined ${rule.label}! Money -${rule.costMoney}, Reputation +${rule.repGain}.`);

  clampAll(g);
  setGame(g);
}


  function signAgreement(partner, focus) {
    const g = structuredClone(game);

    g.stats.money -= 60;
    g.diplomacy.reputation += 2;
    if (focus === "Economy") g.stats.jobs += 2;
    if (focus === "Education") g.stats.happiness += 2;
    if (focus === "Defense") g.stats.security += 2;

    g.foreignAffairs.agreements.push({ type: "Agreement", partner, focus });

    addLog(g, `External Affairs: Signed ${focus} agreement with ${partner}.`);
    clampAll(g);
    setGame(g);
  }

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
      <h2 style={{ marginTop: 10 }}>External Affairs</h2>
      <p style={{ opacity: 0.75, marginTop: 6 }}>
        Embassies, missions, international institutions, and agreements.
      </p>
<div style={{ opacity: 0.7, marginTop: 10, fontSize: 12 }}>
  EU requires: Rep≥60, Cor≤40, Stability≥55, Parliament vote. NATO requires: Rep≥55, Security≥55, vote.
</div>

      {error && (
        <div style={{
          marginTop: 12,
          padding: 12,
          borderRadius: 14,
          border: "1px solid rgba(255,80,100,0.4)",
          background: "rgba(255,80,100,0.12)"
        }}>
          Failed to load countries list: {error}
        </div>
      )}

      <div style={{ marginTop: 14, display:"grid", gridTemplateColumns:"1fr 1fr", gap: 14 }}>
        <Box title="Your Embassies Abroad">
          {fa.embassiesAbroad.length === 0 ? (
            <div style={{ opacity: 0.7 }}>No embassies opened yet.</div>
          ) : (
            <div style={{ display:"grid", gap: 8, opacity: 0.9 }}>
              {fa.embassiesAbroad.map((e, i) => (
                <div key={i}>• {e.country} — Ambassador: {e.ambassador}</div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 10 }}>
            {loading ? (
              <div style={{ opacity: 0.7 }}>Loading country list…</div>
            ) : (
              <CountryPicker
                label="Open embassy in:"
                countries={countries}
                value={openTarget}
                onChange={setOpenTarget}
              />
            )}
            <div style={{ marginTop: 10 }}>
              <button disabled={loading} onClick={() => openEmbassy(openTarget)}>
                Open Embassy
              </button>
            </div>
          </div>
        </Box>

        <Box title="Foreign Missions in Your Country">
          {fa.missionsInCountry.length === 0 ? (
            <div style={{ opacity: 0.7 }}>No foreign missions accepted yet.</div>
          ) : (
            <div style={{ display:"grid", gap: 8, opacity: 0.9 }}>
              {fa.missionsInCountry.map((m, i) => (
                <div key={i}>• {m.country} — Ambassador: {m.ambassador}</div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 10 }}>
            {loading ? (
              <div style={{ opacity: 0.7 }}>Loading country list…</div>
            ) : (
              <CountryPicker
                label="Accept mission from:"
                countries={countries}
                value={missionTarget}
                onChange={setMissionTarget}
              />
            )}
            <div style={{ marginTop: 10 }}>
              <button disabled={loading} onClick={() => acceptMission(missionTarget)}>
                Accept Mission
              </button>
            </div>
          </div>
        </Box>
      </div>

      <div style={{ marginTop: 14, display:"grid", gridTemplateColumns:"1fr 1fr", gap: 14 }}>
        <Box title="International Institutions">
          <div style={{ display:"grid", gap: 10 }}>
            <label><input type="checkbox" checked={fa.memberships.eu} onChange={() => toggleMembership("eu","EU")} /> Join EU</label>
            <label><input type="checkbox" checked={fa.memberships.nato} onChange={() => toggleMembership("nato","NATO")} /> Join NATO</label>
            <label><input type="checkbox" checked={fa.memberships.worldBank} onChange={() => toggleMembership("worldBank","World Bank")} /> Join World Bank</label>
            <label><input type="checkbox" checked={fa.memberships.icj} onChange={() => toggleMembership("icj","ICJ (The Hague)")} /> Accept ICJ (The Hague)</label>
            <label><input type="checkbox" checked={fa.memberships.icc} onChange={() => toggleMembership("icc","ICC")} /> Join ICC</label>
          </div>
          <div style={{ opacity: 0.7, marginTop: 8, fontSize: 12 }}>
            Next step: joining requires conditions (reputation, corruption, parliament vote).
          </div>
        </Box>

        <Box title="Agreements">
          {fa.agreements.length === 0 ? (
            <div style={{ opacity: 0.7 }}>No agreements signed yet.</div>
          ) : (
            <div style={{ display:"grid", gap: 8, opacity: 0.9 }}>
              {fa.agreements.slice(-10).reverse().map((a, i) => (
                <div key={i}>• {a.focus} agreement with {a.partner}</div>
              ))}
            </div>
          )}

          {loading ? (
            <div style={{ opacity: 0.7, marginTop: 10 }}>Loading country list…</div>
          ) : (
            <>
              <CountryPicker
                label="Partner country:"
                countries={countries}
                value={agreementPartner}
                onChange={setAgreementPartner}
              />

              <div style={{ marginTop: 10 }}>
                <div style={{ opacity: 0.8, marginBottom: 6 }}>Focus:</div>
                <select
                  value={agreementFocus}
                  onChange={(e) => setAgreementFocus(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(0,0,0,0.18)",
                    color: "rgba(255,255,255,0.92)",
                  }}
                >
                  <option>Economy</option>
                  <option>Education</option>
                  <option>Defense</option>
                  <option>Technology</option>
                </select>
              </div>

              <div style={{ marginTop: 10 }}>
                <button disabled={loading} onClick={() => signAgreement(agreementPartner, agreementFocus)}>
                  Sign Agreement
                </button>
              </div>
            </>
          )}
        </Box>
      </div>
    </div>
  );
}
