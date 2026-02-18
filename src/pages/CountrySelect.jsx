import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../game/GameContext";
import { fetchAllCountries } from "../game/countryData";

function formatNum(n) {
  if (n == null) return "—";
  return Intl.NumberFormat().format(Math.round(n));
}

export default function CountrySelect() {
  const nav = useNavigate();
  const { startNew } = useGame();

  const [all, setAll] = useState([]);
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const countries = await fetchAllCountries();
        if (!alive) return;
        setAll(countries);
      } catch (e) {
        if (!alive) return;
        setError(String(e?.message || e));
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const regions = useMemo(() => {
    const set = new Set(all.map(c => c.region).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [all]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return all.filter(c => {
      if (region !== "All" && c.region !== region) return false;
      if (!qq) return true;
      return (
        c.name.toLowerCase().includes(qq) ||
        c.officialName.toLowerCase().includes(qq) ||
        c.iso2.toLowerCase().includes(qq)
      );
    });
  }, [all, q, region]);

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
      <h2 style={{ marginTop: 10 }}>Choose a Country</h2>
      <p style={{ opacity: 0.75, marginTop: 6 }}>
        Pick any country and start your presidency.
      </p>

      <div style={{
        marginTop: 12,
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        alignItems: "center"
      }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search: Germany, Albania, US, France..."
          style={{
            flex: "1 1 320px",
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.92)",
            outline: "none"
          }}
        />

        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.92)"
          }}
        >
          {regions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        <div style={{ opacity: 0.75 }}>
          {loading ? "Loading..." : `${filtered.length} countries`}
        </div>
      </div>

      {error && (
        <div style={{
          marginTop: 12,
          padding: 12,
          borderRadius: 14,
          border: "1px solid rgba(255,80,100,0.4)",
          background: "rgba(255,80,100,0.12)"
        }}>
          Error: {error}
        </div>
      )}

      <div style={{
        marginTop: 14,
        display: "grid",
        gap: 12,
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))"
      }}>
        {filtered.slice(0, 60).map((c) => ( // show first 60 for performance (scroll paging later)
          <div key={c.id} style={{
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 18,
            padding: 14,
            background: "rgba(255,255,255,0.06)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {c.flagUrl ? (
                <img src={c.flagUrl} alt={`${c.name} flag`} style={{ width: 54, height: 36, borderRadius: 8, objectFit: "cover" }} />
              ) : (
                <div style={{ width: 54, height: 36, borderRadius: 8, background: "rgba(255,255,255,0.08)" }} />
              )}
              <div>
                <h3 style={{ margin: 0 }}>{c.name}</h3>
                <div style={{ opacity: 0.75, marginTop: 4 }}>
                  {c.region ? `${c.region} • ` : ""}{c.capital ? `Capital: ${c.capital}` : "—"}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 10, opacity: 0.85, lineHeight: 1.45 }}>
              <div><b>Languages:</b> {c.officialLanguages.length ? c.officialLanguages.join(", ") : "—"}</div>
              <div><b>Currency:</b> {c.currency?.name ? `${c.currency.name} ${c.currency.symbol || ""}` : "—"}</div>
              <div><b>Population:</b> {formatNum(c.population)}</div>
              <div><b>Area:</b> {c.areaKm2 ? `${formatNum(c.areaKm2)} km²` : "—"}</div>
            </div>

            <div style={{ marginTop: 12 }}>
              <button onClick={() => { startNew(c); nav("/dashboard"); }}>
                Lead this country
              </button>
            </div>
          </div>
        ))}
      </div>

      {!loading && filtered.length > 60 && (
        <div style={{ marginTop: 12, opacity: 0.75 }}>
          Showing 60 results. Narrow your search to see the country you want.
        </div>
      )}
    </div>
  );
}
