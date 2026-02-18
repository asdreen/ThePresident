import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes";
import Navbar from "../components/Navbar";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <AppRoutes />
    </BrowserRouter>
  );
}
