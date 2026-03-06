import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import Forecast from "./pages/Forecast.jsx";

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="topbar">
          <div className="brand">
            <p className="brand-tag">Retail GenAI/ML Demo</p>
            <h1>Seasonal Demand Forecasting Tool</h1>
          </div>
          <nav>
            <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>Dashboard</NavLink>
            <NavLink to="/forecast" className={({ isActive }) => (isActive ? "active" : "")}>Forecast</NavLink>
          </nav>
        </header>

        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/forecast" element={<Forecast />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;