import { useEffect, useState } from "react";
import { fetchAllCountries } from "./countryData";

export function useAllCountries() {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError("");
        const list = await fetchAllCountries();
        if (!alive) return;
        setCountries(list);
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

  return { countries, loading, error };
}
