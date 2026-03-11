import { useEffect, useState } from "react";
import {
  fetchAccuracy,
  fetchAnalytics,
  fetchCatalog,
  fetchForecast,
  fetchRiskDashboard,
  fetchSalesHistory,
} from "../api/client.js";
import AIInsightPanel from "../components/AIInsightPanel.jsx";
import AIInventoryAdvisor from "../components/AIInventoryAdvisor.jsx";
import AIReportPanel from "../components/AIReportPanel.jsx";
import AIStoryPanel from "../components/AIStoryPanel.jsx";
import AskDataPanel from "../components/AskDataPanel.jsx";
import DatasetUpload from "../components/DatasetUpload.jsx";
import ForecastChatAssistant from "../components/ForecastChatAssistant.jsx";

function AIWorkspace() {
  const [catalog, setCatalog] = useState({ items: [], stores: [] });
  const [analytics, setAnalytics] = useState(null);
  const [history, setHistory] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [accuracy, setAccuracy] = useState(null);
  const [risk, setRisk] = useState(null);
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
          fetchAnalytics(),
        ]);
        setCatalog(catalogData);
        setAnalytics(analyticsData);
        setSelectedItem(catalogData.items?.[0] || "");
      } catch (requestError) {
        setError(requestError.response?.data?.error || requestError.message);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const loadAiContext = async () => {
      if (!selectedItem) {
        return;
      }

      try {
        setError("");
        const [historyData, forecastData, accuracyData, riskData] = await Promise.allSettled([
          fetchSalesHistory({
            item: selectedItem,
            store: selectedStore || undefined,
            months: 24,
          }),
          fetchForecast({
            item: selectedItem,
            store: selectedStore || undefined,
            horizon: 6,
          }),
          fetchAccuracy({
            item: selectedItem,
            store: selectedStore || undefined,
            months: 6,
          }),
          fetchRiskDashboard({
            store: selectedStore || undefined,
            current_stock: 250,
            lead_time_days: 14,
            holiday_boost: 0,
          }),
        ]);

        if (historyData.status === "fulfilled") {
          setHistory(historyData.value.history || []);
        }
        if (forecastData.status === "fulfilled") {
          setForecast(forecastData.value.forecast || []);
        }
        if (accuracyData.status === "fulfilled") {
          setAccuracy(accuracyData.value);
        } else {
          setAccuracy(null);
        }
        if (riskData.status === "fulfilled") {
          setRisk(riskData.value);
        } else {
          setRisk(null);
        }
      } catch (requestError) {
        setError(requestError.response?.data?.error || requestError.message);
      }
    };

    loadAiContext();
  }, [selectedItem, selectedStore]);

  if (loading) {
    return <p className="status">Loading AI workspace...</p>;
  }

  const nextForecast = forecast[0];
  const forecastInsightPayload = nextForecast
    ? {
        item: selectedItem,
        store: selectedStore || "All Stores",
        monthName: nextForecast.month?.split(" ")?.[0] || analytics?.highest_demand_month,
        year: nextForecast.year,
        predictedSales: nextForecast.predicted_sales,
        lowerBound: nextForecast.lower_bound,
        upperBound: nextForecast.upper_bound,
        historicalAverage: history.length
          ? Math.round(history.reduce((sum, row) => sum + row.sales, 0) / history.length)
          : 0,
        topSeasonMonth: analytics?.highest_demand_month,
        accuracy: accuracy?.metrics || null,
      }
    : null;
  const storyPayload = selectedItem
    ? {
        item: selectedItem,
        store: selectedStore || "All Stores",
        history,
      }
    : null;
  const reportPayload = nextForecast
    ? {
        prediction: nextForecast
          ? {
              item: selectedItem,
              store: selectedStore || "All Stores",
              month_name: nextForecast.month?.split(" ")?.[0],
              year: nextForecast.year,
              predicted_sales: nextForecast.predicted_sales,
              lower_bound: nextForecast.lower_bound,
              upper_bound: nextForecast.upper_bound,
            }
          : null,
        forecast,
        accuracy: accuracy?.metrics || null,
      }
    : null;
  const inventoryPayload = risk
    ? {
        type: "risk",
        store: risk.store,
        monthName: risk.month_name,
        year: risk.year,
        summary: {
          stockoutItems: risk.summary?.stockout_items,
          overstockItems: risk.summary?.overstock_items,
          balancedItems: risk.summary?.balanced_items,
        },
        items: (risk.items || []).map((row) => ({
          item: row.item,
          inventoryRisk: row.inventory_risk,
          stockoutRisk: row.stockout_risk,
          predictedSales: row.predicted_sales,
          recommendedOrderQuantity: row.recommended_order_quantity,
        })),
      }
    : null;
  const chatReportContext = {
    selectedItem,
    selectedStore: selectedStore || "All Stores",
    highestDemandMonth: analytics?.highest_demand_month,
    nextForecast,
    accuracy: accuracy?.metrics || null,
    topRiskItems: risk?.items?.slice(0, 3) || [],
  };

  return (
    <section className="stack-xl">
      {error && <p className="status error">{error}</p>}

      <section className="page-hero card">
        <div>
          <p className="section-label">AI Workspace</p>
          <h2>One place for every AI planning output</h2>
          <p className="section-copy">
            Explore explanations, advisory summaries, reports, storytelling, and conversational analysis from the current retail forecast context.
          </p>
        </div>
      </section>

      <DatasetUpload />

      <section className="card filter-card">
        <div className="section-heading">
          <div>
            <p className="section-label">Workspace Filters</p>
            <h3>Select the planning context</h3>
          </div>
        </div>
        <div className="filters-inline">
          <div>
            <label>Product</label>
            <select value={selectedItem} onChange={(event) => setSelectedItem(event.target.value)}>
              {catalog.items.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Store</label>
            <select value={selectedStore} onChange={(event) => setSelectedStore(event.target.value)}>
              <option value="">All Stores</option>
              {catalog.stores.map((store) => (
                <option key={store} value={store}>{store}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <AskDataPanel selectedItem={selectedItem} selectedStore={selectedStore} />
      <ForecastChatAssistant item={selectedItem} store={selectedStore} reportContext={chatReportContext} />
      <AIInsightPanel payload={forecastInsightPayload} title="AI Forecast Insight" />
      <AIInventoryAdvisor payload={inventoryPayload} title="AI Inventory Portfolio Advice" />
      <AIStoryPanel payload={storyPayload} title="AI Demand Storytelling" />
      <AIReportPanel payload={reportPayload} />
    </section>
  );
}

export default AIWorkspace;
