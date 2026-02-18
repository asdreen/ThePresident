import { Routes, Route, Navigate } from "react-router-dom";

import CountrySelect from "../pages/CountrySelect";
import Dashboard from "../pages/Dashboard";
import Finances from "../pages/Finances";
import Diplomacy from "../pages/Diplomacy";
import InternalAffairs from "../pages/InternalAffairs";
import Health from "../pages/Health";
import Sports from "../pages/Sports";
import Migration from "../pages/Migration";
import Law from "../pages/Law";
import Education from "../pages/Education";
import Government from "../pages/Government";
import Parliament from "../pages/Parliament";
import Economy from "../pages/Economy";
import Administration from "../pages/Administration";
import HSEA from "../pages/HSEA";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/country" replace />} />
      <Route path="/government" element={<Government />} />
      <Route path="/parliament" element={<Parliament />} />
      <Route path="/economy" element={<Economy />} />
      <Route path="/country" element={<CountrySelect />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/finances" element={<Finances />} />
      <Route path="/diplomacy" element={<Diplomacy />} />
      <Route path="/internal-affairs" element={<InternalAffairs />} />
      <Route path="/health" element={<Health />} />
      <Route path="/sports" element={<Sports />} />
      <Route path="/migration" element={<Migration />} />
      <Route path="/law" element={<Law />} />
      <Route path="/education" element={<Education />} />
      <Route path="/administration" element={<Administration />} />
      <Route path="/hsea" element={<HSEA />} />
    </Routes>
  );
}
