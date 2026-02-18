async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
}

// Fetch all countries from REST Countries
export async function fetchAllCountries() {
  // fields keep it fast
  const url =
    "https://restcountries.com/v3.1/all?fields=name,cca2,flags,area,region,capital,languages,currencies,population";
  const data = await fetchJson(url);

  // Normalize + sort
  const countries = data
    .filter((c) => c.cca2 && c.name?.common)
    .map((c) => ({
      id: c.cca2.toLowerCase(),     // "de"
      iso2: c.cca2,                 // "DE"
      name: c.name.common,
      officialName: c.name.official || c.name.common,
      flagUrl: c.flags?.png || c.flags?.svg || "",
      region: c.region || "",
      capital: Array.isArray(c.capital) ? (c.capital[0] || "") : (c.capital || ""),
      areaKm2: c.area ?? null,
      officialLanguages: c.languages ? Object.values(c.languages) : [],
      currency: c.currencies ? (() => {
        const first = Object.values(c.currencies)[0];
        return { name: first?.name || "", symbol: first?.symbol || "" };
      })() : { name: "", symbol: "" },
      // REST already provides population (not World Bank, but good enough for display)
      population: c.population ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return countries;
}
