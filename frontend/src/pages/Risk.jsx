import { useEffect, useState } from "react";
import { fetchCatalog, fetchRiskDashboard } from "../api/client.js";
import AIInventoryAdvisor from "../components/AIInventoryAdvisor.jsx";
import InventoryNav from "../components/InventoryNav.jsx";
import { downloadCsv } from "../utils/exportCsv.js";

const monthOptions = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function Risk() {
  const currentYear = new Date().getFullYear();
  const [catalog, setCatalog] = useState({ stores: [] });
  const [store, setStore] = useState("");
  const [month, setMonth] = useState(monthOptions[new Date().getMonth()]);
  const [year, setYear] = useState(currentYear);
  const [currentStock, setCurrentStock] = useState(250);
  const [leadTimeDays, setLeadTimeDays] = useState(14);
  const [holidayBoost, setHolidayBoost] = useState("0");
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const catalogData = await fetchCatalog();
        setCatalog(catalogData);
      } catch (requestError) {
        setError(requestError.response?.data?.error || requestError.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const loadRisk = async () => {
      try {
        setError("");
        const data = await fetchRiskDashboard({
          store: store || undefined,
          month,
          year,
          current_stock: currentStock,
          lead_time_days: leadTimeDays,
          holiday_boost: Number(holidayBoost)
        });
        setRisk(data);
      } catch (requestError) {
        setRisk(null);
        setError(requestError.response?.data?.error || requestError.message);
      }
    };

    if (!loading) {
      loadRisk();
    }
  }, [store, month, year, currentStock, leadTimeDays, holidayBoost, loading]);

  const exportRisk = () => {
    if (!risk) {
      return;
    }

    downloadCsv("risk-dashboard.csv", [
      ["Item", "Inventory Risk", "Stockout Risk", "Predicted Sales", "Range", "Reorder Point", "Recommended Order"],
      ...risk.items.map((row) => [
        row.item,
        row.inventory_risk,
        row.stockout_risk,
        row.predicted_sales,
        `${row.lower_bound} - ${row.upper_bound}`,
        row.reorder_point,
        row.recommended_order_quantity
      ])
    ]);
  };

  if (loading) {
    return <p className="status">Loading risk dashboard...</p>;
  }

  const advisorPayload = risk
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

  return (
    <section className="stack-xl">
      {error && <p className="status error">{error}</p>}

      <section className="page-hero card">
        <div>
          <p className="section-label">Inventory</p>
          <h2>Scan stockout and overstock pressure</h2>
          <p className="section-copy">
            Compare forecast demand, confidence range, and reorder point across the item catalog.
          </p>
        </div>
        <InventoryNav />
      </section>

      <section className="card filter-card">
        <div className="section-heading">
          <div>
            <p className="section-label">Risk Controls</p>
            <h3>Adjust the inventory scenario</h3>
          </div>
        </div>
        <div className="reorder-grid">
          <div>
            <label>Store</label>
            <select value={store} onChange={(event) => setStore(event.target.value)}>
              <option value="">All Stores</option>
              {catalog.stores.map((storeName) => (
                <option key={storeName} value={storeName}>{storeName}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Month</label>
            <select value={month} onChange={(event) => setMonth(event.target.value)}>
              {monthOptions.map((monthName) => (
                <option key={monthName} value={monthName}>{monthName}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Year</label>
            <input type="number" min="2020" max="2035" value={year} onChange={(event) => setYear(event.target.value)} />
          </div>
          <div>
            <label>Current Stock Assumption</label>
            <input type="number" min="0" value={currentStock} onChange={(event) => setCurrentStock(event.target.value)} />
          </div>
          <div>
            <label>Lead Time (days)</label>
            <input type="number" min="1" max="180" value={leadTimeDays} onChange={(event) => setLeadTimeDays(event.target.value)} />
          </div>
          <div>
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
      </section>

      {risk && (
        <>
          <AIInventoryAdvisor payload={advisorPayload} title="Inventory Portfolio Advice" />
          <section className="recommendation-grid">
            <article className="card recommendation-card"><p>Stockout Items</p><h3>{risk.summary.stockout_items}</h3><span>Need immediate attention</span></article>
            <article className="card recommendation-card"><p>Overstock Items</p><h3>{risk.summary.overstock_items}</h3><span>Potential carrying-cost pressure</span></article>
            <article className="card recommendation-card"><p>Balanced Items</p><h3>{risk.summary.balanced_items}</h3><span>Within expected planning band</span></article>
            <article className="card recommendation-card"><p>Holiday Lift</p><h3>{risk.holiday_boost}%</h3><span>Scenario applied to all items</span></article>
          </section>

          <section className="card">
            <div className="toolbar">
              <div>
                <p className="section-label">Risk Table</p>
                <h3>Inventory Risk by Item</h3>
              </div>
              <button type="button" className="button button-accent" onClick={exportRisk}>Export CSV</button>
            </div>
            <div className="table-wrap">
              <table className="analytics-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Inventory Risk</th>
                  <th>Stockout Risk</th>
                  <th className="numeric">Predicted Sales</th>
                  <th className="numeric">Confidence Range</th>
                  <th className="numeric">Reorder Point</th>
                  <th className="numeric">Recommended Order</th>
                </tr>
              </thead>
              <tbody>
                {risk.items.map((row) => (
                  <tr key={row.item}>
                    <td>{row.item}</td>
                    <td>{row.inventory_risk}</td>
                    <td>{row.stockout_risk}</td>
                    <td className="numeric">{row.predicted_sales}</td>
                    <td className="numeric">{row.lower_bound} - {row.upper_bound}</td>
                    <td className="numeric">{row.reorder_point}</td>
                    <td className="numeric">{row.recommended_order_quantity}</td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </section>
  );
}

export default Risk;
