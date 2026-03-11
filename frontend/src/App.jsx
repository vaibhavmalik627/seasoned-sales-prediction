import { Suspense, lazy } from "react";
import { BrowserRouter, NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";

const Auth = lazy(() => import("./pages/Auth.jsx"));
const Home = lazy(() => import("./pages/Home.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const AIWorkspace = lazy(() => import("./pages/AIWorkspace.jsx"));
const Forecast = lazy(() => import("./pages/Forecast.jsx"));
const Confidence = lazy(() => import("./pages/Confidence.jsx"));
const Reorder = lazy(() => import("./pages/Reorder.jsx"));
const Risk = lazy(() => import("./pages/Risk.jsx"));
const Accuracy = lazy(() => import("./pages/Accuracy.jsx"));

const primaryNavItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/ai-workspace", label: "AI Workspace" },
  { to: "/forecast", label: "Forecast" },
  { to: "/confidence", label: "Confidence" },
  { to: "/inventory", label: "Inventory" },
  { to: "/accuracy", label: "Accuracy" }
];

function AppLayout() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const { account, isAuthenticated, logout } = useAuth();
  const showCompactTopbar = !isHomePage;

  return (
    <div className="app-shell">
      <header className={`topbar ${isHomePage ? "topbar-home" : ""} ${showCompactTopbar ? "topbar-compact" : ""}`}>
        {isHomePage && (
          <div className="brand">
            <p className="brand-tag">Retail GenAI/ML Demo</p>
            <h1>Seasonal Demand Forecasting Tool</h1>
          </div>
        )}
        {!isHomePage && (
          <div className="topbar-actions">
            <nav className="app-nav">
              <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>Home</NavLink>
              {isAuthenticated && primaryNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={() => {
                    if (
                      item.to === "/inventory" &&
                      ["/inventory", "/reorder", "/risk"].includes(location.pathname)
                    ) {
                      return "active";
                    }

                    return location.pathname === item.to ? "active" : "";
                  }}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {isAuthenticated ? (
              <div className="account-chip">
                <div>
                  <strong>{account?.storeName}</strong>
                  <span>{account?.contactName}</span>
                </div>
                <button type="button" className="button button-secondary" onClick={logout}>
                  Logout
                </button>
              </div>
            ) : (
              <NavLink to="/auth" className="auth-entry-link">Store Login</NavLink>
            )}
          </div>
        )}
      </header>

      <main className="content">
        <Suspense fallback={<p className="status">Loading page...</p>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/ai-workspace" element={<ProtectedRoute><AIWorkspace /></ProtectedRoute>} />
            <Route path="/forecast" element={<ProtectedRoute><Forecast /></ProtectedRoute>} />
            <Route path="/confidence" element={<ProtectedRoute><Confidence /></ProtectedRoute>} />
            <Route path="/inventory" element={<Navigate to="/reorder" replace />} />
            <Route path="/reorder" element={<ProtectedRoute><Reorder /></ProtectedRoute>} />
            <Route path="/risk" element={<ProtectedRoute><Risk /></ProtectedRoute>} />
            <Route path="/accuracy" element={<ProtectedRoute><Accuracy /></ProtectedRoute>} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
