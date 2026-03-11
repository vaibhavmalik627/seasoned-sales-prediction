import { useEffect, useState } from "react";
import { fetchCatalog, fetchReorderRecommendation } from "../api/client.js";
import AIInventoryAdvisor from "../components/AIInventoryAdvisor.jsx";
import InventoryNav from "../components/InventoryNav.jsx";
import { downloadCsv } from "../utils/exportCsv.js";

const monthOptions = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

function Reorder() {
  const currentYear = new Date().getFullYear();
  const [catalog, setCatalog] = useState({ items: [], stores: [] });
  const [product, setProduct] = useState("");
  const [store, setStore] = useState("");
  const [month, setMonth] = useState(monthOptions[new Date().getMonth()]);
  const [year, setYear] = useState(currentYear);
  const [currentStock, setCurrentStock] = useState(250);
  const [leadTimeDays, setLeadTimeDays] = useState(14);
  const [serviceLevel, setServiceLevel] = useState("0.80");
  const [holidayBoost, setHolidayBoost] = useState("0");
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const data = await fetchCatalog();
        setCatalog(data);
        setProduct(data.items?.[0] || "");
      } catch (requestError) {
        setError(requestError.response?.data?.error || requestError.message);
      }
    };

    loadCatalog();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      const data = await fetchReorderRecommendation({
        product,
        store: store || null,
        month,
        year: Number(year),
        current_stock: Number(currentStock),
        lead_time_days: Number(leadTimeDays),
        service_level: Number(serviceLevel),
        holiday_boost: Number(holidayBoost)
      });
      setRecommendation(data);
    } catch (requestError) {
      setRecommendation(null);
      setError(requestError.response?.data?.error || requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const exportRecommendation = () => {
    if (!recommendation) {
      return;
    }

    downloadCsv("reorder-recommendation.csv", [
      ["Field", "Value"],
      ["Item", recommendation.item],
      ["Store", recommendation.store],
      ["Predicted Sales", recommendation.predicted_sales],
      ["Confidence Range", `${recommendation.lower_bound} - ${recommendation.upper_bound}`],
      ["Lead-time Demand", recommendation.lead_time_demand],
      ["Safety Stock", recommendation.safety_stock],
      ["Reorder Point", recommendation.reorder_point],
      ["Recommended Order", recommendation.recommended_order_quantity],
      ["Stockout Risk", recommendation.stockout_risk]
    ]);
  };

  const advisorPayload = recommendation
    ? {
        type: "reorder",
        item: recommendation.item,
        store: recommendation.store,
        monthName: recommendation.month_name,
        year: recommendation.year,
        predictedSales: recommendation.predicted_sales,
        currentStock: recommendation.current_stock,
        reorderPoint: recommendation.reorder_point,
        recommendedOrderQuantity: recommendation.recommended_order_quantity,
        safetyStock: recommendation.safety_stock,
        stockoutRisk: recommendation.stockout_risk,
      }
    : null;

  return (
    <section className="stack-xl">
      {error && <p className="status error">{error}</p>}

      <section className="page-hero card">
        <div>
          <p className="section-label">Inventory</p>
          <h2>Turn the forecast into a reorder decision</h2>
          <p className="section-copy">
            Adjust stock assumptions, lead time, and service level to generate a replenishment plan.
          </p>
        </div>
        <InventoryNav />
      </section>

      <form className="card reorder-form" onSubmit={handleSubmit}>
        <div className="section-heading">
          <div>
            <p className="section-label">Reorder Inputs</p>
            <h3>Build the replenishment scenario</h3>
          </div>
        </div>
        <div className="reorder-grid">
          <div>
            <label>Product</label>
            <select value={product} onChange={(event) => setProduct(event.target.value)} required>
              {catalog.items.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Store</label>
            <select value={store} onChange={(event) => setStore(event.target.value)}>
              <option value="">All Stores</option>
              {catalog.stores.map((storeName) => (
                <option key={storeName} value={storeName}>
                  {storeName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Month</label>
            <select value={month} onChange={(event) => setMonth(event.target.value)}>
              {monthOptions.map((monthName) => (
                <option key={monthName} value={monthName}>
                  {monthName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Year</label>
            <input type="number" min="2020" max="2035" value={year} onChange={(event) => setYear(event.target.value)} />
          </div>

          <div>
            <label>Current Stock</label>
            <input
              type="number"
              min="0"
              value={currentStock}
              onChange={(event) => setCurrentStock(event.target.value)}
            />
          </div>

          <div>
            <label>Lead Time (days)</label>
            <input
              type="number"
              min="1"
              max="180"
              value={leadTimeDays}
              onChange={(event) => setLeadTimeDays(event.target.value)}
            />
          </div>

          <div>
            <label>Service Level</label>
            <select value={serviceLevel} onChange={(event) => setServiceLevel(event.target.value)}>
              <option value="0.70">70%</option>
              <option value="0.80">80%</option>
              <option value="0.90">90%</option>
              <option value="0.95">95%</option>
            </select>
          </div>

          <div className="form-field-full">
            <label>Holiday Lift</label>
            <select value={holidayBoost} onChange={(event) => setHolidayBoost(event.target.value)}>
              <option value="0">No uplift</option>
              <option value="5">5%</option>
              <option value="10">10%</option>
              <option value="15">15%</option>
              <option value="20">20%</option>
            </select>
          </div>
        </div>

        <button type="submit" className="button button-accent button-submit" disabled={loading || !product}>
          {loading ? "Calculating..." : "Get Reorder Recommendation"}
        </button>
      </form>

      {recommendation && (
        <>
          <AIInventoryAdvisor payload={advisorPayload} title="Reorder Action Summary" />
          <section className="recommendation-grid">
            <article className="card recommendation-card">
              <p>Recommended Order</p>
              <h3>{recommendation.recommended_order_quantity}</h3>
              <span>Units to replenish now</span>
            </article>
            <article className="card recommendation-card">
              <p>Reorder Point</p>
              <h3>{recommendation.reorder_point}</h3>
              <span>Stock threshold to trigger replenishment</span>
            </article>
            <article className="card recommendation-card">
              <p>Safety Stock</p>
              <h3>{recommendation.safety_stock}</h3>
              <span>Buffer against forecast uncertainty</span>
            </article>
            <article className="card recommendation-card">
              <p>Stockout Risk</p>
              <h3>{recommendation.stockout_risk}</h3>
              <span>Based on current stock vs reorder point</span>
            </article>
          </section>

          <section className="card">
            <div className="toolbar">
              <div>
                <p className="section-label">Inventory Breakdown</p>
                <h3>Planning Breakdown</h3>
              </div>
              <button type="button" className="button button-accent" onClick={exportRecommendation}>Export CSV</button>
            </div>
            <div className="table-wrap">
              <table className="analytics-table">
              <tbody>
                <tr>
                  <th>Forecasted demand</th>
                  <td className="numeric">{recommendation.predicted_sales}</td>
                </tr>
                <tr>
                  <th>Confidence range</th>
                  <td className="numeric">
                    {recommendation.lower_bound} - {recommendation.upper_bound}
                  </td>
                </tr>
                <tr>
                  <th>Lead-time demand</th>
                  <td className="numeric">{recommendation.lead_time_demand}</td>
                </tr>
                <tr>
                  <th>Current stock</th>
                  <td className="numeric">{recommendation.current_stock}</td>
                </tr>
                <tr>
                  <th>Coverage days</th>
                  <td className="numeric">{recommendation.estimated_coverage_days}</td>
                </tr>
              </tbody>
              </table>
            </div>
            <p className="section-copy">{recommendation.explanation}</p>
          </section>
        </>
      )}
    </section>
  );
}

export default Reorder;
