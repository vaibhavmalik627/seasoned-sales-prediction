import { useEffect, useState } from "react";
import {
  fetchAnalytics,
  fetchCatalog,
  fetchForecast,
  fetchSalesHistory
} from "../api/client.js";
import ForecastTable from "../components/ForecastTable.jsx";
import KpiCards from "../components/KpiCards.jsx";
import SalesChart from "../components/SalesChart.jsx";

function Dashboard() {
  const [catalog, setCatalog] = useState({ items: [], stores: [] });
  const [analytics, setAnalytics] = useState(null);
  const [history, setHistory] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [selectedItem, setSelectedItem] = useState("");
  const [selectedStore, setSelectedStore] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError("");

        const [catalogData, analyticsData] = await Promise.all([
          fetchCatalog(),
          fetchAnalytics()
        ]);

        const defaultItem = catalogData.items?.[0] || "";

        setCatalog(catalogData);
        setAnalytics(analyticsData);
        setSelectedItem(defaultItem);
      } catch (requestError) {
        setError(requestError.response?.data?.error || requestError.message);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const loadSeries = async () => {
      if (!selectedItem) {
        return;
      }

      try {
        const [historyData, forecastData] = await Promise.all([
          fetchSalesHistory({
            item: selectedItem,
            store: selectedStore || undefined,
            months: 24
          }),
          fetchForecast({
            item: selectedItem,
            store: selectedStore || undefined,
            horizon: 6
          })
        ]);

        setHistory(historyData.history || []);
        setForecast(forecastData.forecast || []);
      } catch (requestError) {
        setError(requestError.response?.data?.error || requestError.message);
      }
    };

    loadSeries();
  }, [selectedItem, selectedStore]);

  if (loading) {
    return <p className="status">Loading dashboard...</p>;
  }

  return (
    <section className="stack-lg">
      {error && <p className="status error">{error}</p>}

      <KpiCards analytics={analytics} />

      <section className="card filters-inline">
        <div>
          <label>Product</label>
          <select value={selectedItem} onChange={(event) => setSelectedItem(event.target.value)}>
            {catalog.items.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Store</label>
          <select value={selectedStore} onChange={(event) => setSelectedStore(event.target.value)}>
            <option value="">All Stores</option>
            {catalog.stores.map((store) => (
              <option key={store} value={store}>
                {store}
              </option>
            ))}
          </select>
        </div>
      </section>

      <SalesChart historicalData={history} forecastData={forecast} />
      <ForecastTable forecastRows={forecast} />

      <article className="card explanation">
        <h3>AI Trend Explanation</h3>
        <p>
          Seasonal demand historically peaks in <strong>{analytics?.highest_demand_month}</strong>. The model
          combines date seasonality with product/store behavior, which is why the forecast adjusts when you
          change item or store filters.
        </p>
      </article>
    </section>
  );
}

export default Dashboard;