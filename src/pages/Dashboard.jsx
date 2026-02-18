import { useMemo, useState } from "react";
import { useGame } from "../game/GameContext";
import { addLog, clampAll, embassyUpkeep, updateWeather } from "../game/gameEngine";
import { getEvents } from "../game/events";
import { applyMonthlyFinance } from "../game/gameEngine";
import { applyBudgetPressure } from "../game/gameEngine";

function Card({ title, children }) {
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

function StatRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "10px 12px",
        borderRadius: 14,
        background: "rgba(0,0,0,0.18)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <span style={{ opacity: 0.75 }}>{label}</span>
      <span
        style={{
          fontWeight: 800,
          padding: "4px 10px",
          borderRadius: 999,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function MiniBox({ title, children }) {
  return (
    <div
      style={{
        padding: "12px 12px",
        borderRadius: 14,
        background: "rgba(0,0,0,0.18)",
        border: "1px solid rgba(255,255,255,0.10)",
      }}
    >
      <div style={{ fontWeight: 800 }}>{title}</div>
      <div style={{ opacity: 0.85, marginTop: 8 }}>{children}</div>
    </div>
  );
}

export default function Dashboard() {
  const { game, setGame } = useGame();
  const [pendingEvent, setPendingEvent] = useState(null);

  const month = useMemo(() => {
    if (!game) return "";
    const months = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December"
    ];
    return months[game.monthIndex % 12];
  }, [game]);

  if (!game) {
    return (
      <div style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
        <h2>Dashboard</h2>
        <p style={{ opacity: 0.75 }}>Pick a country first.</p>
      </div>
    );
  }

  const s = game.stats;
  const nf = new Intl.NumberFormat();

  function nextMonth() {
    if (!game.choseDecisionThisTurn || pendingEvent) return;

    const g = structuredClone(game);

    // Ensure media exists (safety for old saves)
    if (!g.media) {
      g.media = { trust: 55, pressure: 35, reaction: 50, headlines: [] };
    }

    // Monthly drift
    g.stats.money -= 30;
    if (g.stats.corruption >= 60) g.stats.happiness -= 2;

    // Diplomacy upkeep
    embassyUpkeep(g);

    // Update weather snapshot
    updateWeather(g);
    // Finance monthly budget (income/spending/debt)
    applyMonthlyFinance(g, addLog);
    applyBudgetPressure(g, addLog);

    // Event appears (interactive)
    const pool = getEvents(g);
    const ev = pool[Math.floor(Math.random() * pool.length)];
    addLog(g, `Event: ${ev.name} — ${ev.text}`);

    // ---- MEDIA REACTION (monthly) ----
    const approval = Math.round(
      (g.stats.happiness + g.stats.stability + g.stats.security + g.stats.jobs) / 4
    );
    const corruptionHit = Math.round(g.stats.corruption * 0.35);
    const base = approval - corruptionHit;

    const mediaBias = Math.round((50 - g.media.trust) * 0.2); // low trust makes reaction worse
    const pressureBias = Math.round((g.media.pressure - 50) * 0.2); // aggressive media amplifies negativity

    g.media.reaction = Math.max(0, Math.min(100, base - mediaBias - pressureBias));

    // headline generator (simple)
    let head = "Government continues steady course.";
    if (g.media.reaction >= 70) head = "Public mood positive: President gains momentum.";
    if (g.media.reaction <= 40) head = "Media backlash grows amid public frustration.";
    if (g.stats.corruption >= 60) head = "Corruption accusations dominate headlines.";

    g.media.headlines = [...(g.media.headlines || []), { turn: g.turn, text: head }].slice(-10);
    addLog(g, `MEDIA: ${head} (Reaction ${g.media.reaction}/100)`);

    clampAll(g);
    setGame(g);
    setPendingEvent(ev);
  }

  function chooseEventOption(idx) {
    const ev = pendingEvent;
    if (!ev) return;

    const g = structuredClone(game);
    const opt = ev.options[idx];

    // Ensure health/media exist (safety)
    if (!g.health) {
      g.health = {
        hospitals: 12, bedsPer1000: 3.2, doctorsPer1000: 2.6,
        insuranceCoverage: 62, natalityPer1000: 10.5, newbornsThisMonth: 0,
        vaccinationRate: 55, healthInfrastructure: 48,
      };
    }
    if (!g.media) {
      g.media = { trust: 55, pressure: 35, reaction: 50, headlines: [] };
    }

    addLog(g, `Response: ${opt.label}`);
    opt.apply(g);

    // Advance time
    g.turn += 1;
    g.monthIndex += 1;
    g.choseDecisionThisTurn = false;

    // Update upcoming events countdown
    g.dashboard.upcomingEvents = (g.dashboard.upcomingEvents || []).map((e) => ({
      ...e,
      inMonths: Math.max(0, e.inMonths - 1),
    }));

    // Health: newborns this month (simple model)
    const pop = g.country?.population || 1_000_000;
    const monthlyBirths = Math.round((pop / 1000) * (g.health.natalityPer1000 / 12));
    g.health.newbornsThisMonth = monthlyBirths;
    addLog(g, `Health report: ${monthlyBirths} babies born this month.`);

    clampAll(g);
    setGame(g);
    setPendingEvent(null);
  }

  const weather = game.dashboard?.currentWeather || { tempC: null, condition: "—" };
  const upcoming = (game.dashboard?.upcomingEvents || []).slice(0, 6);
  const feed = (game.dashboard?.decisionsFeed || []).slice(0, 5);

  const media = game.media || { trust: 55, pressure: 35, reaction: 50, headlines: [] };
  const latestHeadline = media.headlines?.slice(-1)[0]?.text || "No headline yet.";

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Situation Room</h2>
          <div style={{ opacity: 0.75, marginTop: 6 }}>
            Turn {game.turn}/{game.termTurns} • {month}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
            {game.country?.flagUrl ? (
              <img
                src={game.country.flagUrl}
                alt="flag"
                style={{ width: 44, height: 30, borderRadius: 6, objectFit: "cover" }}
              />
            ) : null}
            <div>
              <div style={{ fontWeight: 800 }}>{game.country?.name || "Unknown country"}</div>
              <div style={{ opacity: 0.75, fontSize: 13 }}>
                Population: {game.country?.population ? nf.format(game.country.population) : "—"} •{" "}
                Area: {game.country?.areaKm2 ? `${nf.format(Math.round(game.country.areaKm2))} km²` : "—"} •{" "}
                Region: {game.country?.region || "—"}
              </div>
            </div>
          </div>
        </div>

        <button disabled={!game.choseDecisionThisTurn || !!pendingEvent} onClick={nextMonth}>
          Next Month
        </button>
      </div>

      {/* Top Row: Stats + Right Column (Weather/Upcoming + Media) */}
      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 14 }}>
        <Card title="Country Stats">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <StatRow label="Money" value={s.money} />
            <StatRow label="Jobs" value={s.jobs} />
            <StatRow label="Happiness" value={s.happiness} />
            <StatRow label="Stability" value={s.stability} />
            <StatRow label="Security" value={s.security} />
            <StatRow label="Corruption" value={s.corruption} />
            <StatRow label="Parliament" value={s.parliament} />
            <StatRow label="Capital" value={s.capital} />
            <StatRow label="Reputation" value={game.diplomacy?.reputation ?? 0} />
            <StatRow label="Embassies" value={game.diplomacy?.embassies ?? 0} />
            <StatRow label="Media Reaction" value={media.reaction} />
            <StatRow label="Newborns (last month)" value={game.health?.newbornsThisMonth ?? 0} />
          </div>
        </Card>

        <div style={{ display: "grid", gap: 14 }}>
          <Card title="Weather & Upcoming">
            <div style={{ display: "grid", gap: 10 }}>
              <MiniBox title="Temperature">
                {weather.tempC == null ? "—" : `${weather.tempC}°C`} • {weather.condition}
              </MiniBox>

              <MiniBox title="Upcoming Events">
                <div style={{ display: "grid", gap: 6 }}>
                  {upcoming.length === 0 ? <div style={{ opacity: 0.7 }}>None planned.</div> : null}
                  {upcoming.map((e, i) => (
                    <div key={i}>
                      • {e.title} {e.inMonths === 0 ? "(Now)" : `(in ${e.inMonths} mo)`}
                    </div>
                  ))}
                </div>
              </MiniBox>

              <MiniBox title="New Decisions (Feed)">
                <div style={{ display: "grid", gap: 6 }}>
                  {feed.length === 0 ? <div style={{ opacity: 0.7 }}>No decisions taken yet.</div> : null}
                  {feed.map((f, i) => (
                    <div key={i}>• [{f.category}] {f.title}</div>
                  ))}
                </div>
                <div style={{ opacity: 0.7, marginTop: 8, fontSize: 12 }}>
                  Decisions are made inside departments (navbar).
                </div>
              </MiniBox>
            </div>
          </Card>

          <Card title="Media Reaction">
            <div style={{ display: "grid", gap: 10 }}>
              <StatRow label="Reaction" value={`${media.reaction}/100`} />
              <StatRow label="Media Trust" value={`${media.trust}/100`} />
              <StatRow label="Media Pressure" value={`${media.pressure}/100`} />

              <div
                style={{
                  padding: 12,
                  borderRadius: 14,
                  background: "rgba(0,0,0,0.18)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                <div style={{ fontWeight: 800 }}>Latest Headline</div>
                <div style={{ opacity: 0.85, marginTop: 6 }}>{latestHeadline}</div>
              </div>

              <div style={{ opacity: 0.7, fontSize: 12 }}>
                Reaction updates every month based on approval + corruption + media environment.
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* News & Event choices */}
      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
        <Card title="News & Current Situation">
          <div
            style={{
              maxHeight: 320,
              overflow: "auto",
              padding: 12,
              borderRadius: 14,
              background: "rgba(0,0,0,0.18)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            {game.log.slice(-16).map((x, i) => (
              <div
                key={i}
                style={{
                  padding: "8px 0",
                  borderBottom: "1px dashed rgba(255,255,255,0.10)",
                  opacity: 0.9,
                }}
              >
                {x}
              </div>
            ))}
          </div>

          {pendingEvent && (
            <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
              {pendingEvent.options.map((o, idx) => (
                <button key={idx} onClick={() => chooseEventOption(idx)}>
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
