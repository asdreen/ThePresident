import { NavLink, useNavigate } from "react-router-dom";
import { useGame } from "../game/GameContext";

const linkStyle = ({ isActive }) => ({
  padding: "10px 12px",
  borderRadius: 12,
  textDecoration: "none",
  color: "white",
  opacity: isActive ? 1 : 0.7,
  background: isActive ? "rgba(255,255,255,0.10)" : "transparent",
  whiteSpace: "nowrap",
});

export default function Navbar() {
  const nav = useNavigate();
  const { clear, game } = useGame();

  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 20,
      display: "flex", gap: 10, padding: 12,
      overflowX: "auto",
      backdropFilter: "blur(12px)",
      background: "rgba(10,14,28,0.75)",
      borderBottom: "1px solid rgba(255,255,255,0.10)"
    }}>
      <NavLink to="/country" style={linkStyle}>Country</NavLink>
      <NavLink to="/dashboard" style={linkStyle}>Dashboard</NavLink>
      <NavLink to="/finances" style={linkStyle}>Finances</NavLink>
      <NavLink to="/diplomacy" style={linkStyle}>Diplomacy</NavLink>
      <NavLink to="/internal-affairs" style={linkStyle}>Security</NavLink>
      <NavLink to="/hsea" style={linkStyle}>H.S.E.A.</NavLink>
      <NavLink to="/migration" style={linkStyle}>Migration</NavLink>
      <NavLink to="/law" style={linkStyle}>Law</NavLink>
      <NavLink to="/government" style={linkStyle}>Government</NavLink>
      <NavLink to="/parliament" style={linkStyle}>Parliament</NavLink>
      <NavLink to="/economy" style={linkStyle}>Economy</NavLink>


      <div style={{ flex: 1 }} />

      {game && (
        <button onClick={() => { clear(); nav("/country"); }}>
          Reset
        </button>
      )}
    </div>
  );
}
