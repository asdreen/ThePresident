import { useState } from "react";
import Health from "./Health";
import Sports from "./Sports";
import Education from "./Education";
import Administration from "./Administration";

export default function HSEA() {
  const [tab, setTab] = useState("health");

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
      <h2 style={{ marginTop: 10 }}>H.S.E.A.</h2>
      <p style={{ opacity: 0.75, marginTop: 6 }}>
        Health • Sports • Education • Administration
      </p>

      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginTop: 10 }}>
        <button onClick={() => setTab("health")} style={{ opacity: tab==="health"?1:0.75 }}>Health</button>
        <button onClick={() => setTab("sports")} style={{ opacity: tab==="sports"?1:0.75 }}>Sports</button>
        <button onClick={() => setTab("education")} style={{ opacity: tab==="education"?1:0.75 }}>Education</button>
        <button onClick={() => setTab("admin")} style={{ opacity: tab==="admin"?1:0.75 }}>Administration</button>
      </div>

      <div style={{ marginTop: 14 }}>
        {tab === "health" && <Health />}
        {tab === "sports" && <Sports />}
        {tab === "education" && <Education />}
        {tab === "admin" && <Administration />}
      </div>
    </div>
  );
}
