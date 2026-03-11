import { useEffect, useState } from "react";
import { fetchAccuracy, fetchCatalog } from "../api/client.js";
import AccuracyPanel from "../components/AccuracyPanel.jsx";
import { downloadCsv } from "../utils/exportCsv.js";

function Accuracy() {
  const [catalog, setCatalog] = useState({ items: [], stores: [] });
  const [selectedItem, setSelectedItem] = useState("");
  const [selectedStore, setSelectedStore] = useState("");
  const [months, setMonths] = useState("6");
  const [accuracy, setAccuracy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAccuracy, setLoadingAccuracy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        setLoading(true);
        const data = await fetchCatalog();
        setCatalog(data);
        setSelectedItem(data.items?.[0] || "");
      } catch (requestError) {
        setError(requestError.response?.data?.error || requestError.message);
      } finally {
        setLoading(false);
      }
    };

    loadCatalog();
  }, []);

  useEffect(() => {
    const loadAccuracy = async () => {
      if (!selectedItem) {
        return;
      }

      try {
        setLoadingAccuracy(true);
        setError("");
        const data = await fetchAccuracy({
          item: selectedItem,
          store: selectedStore || undefined,
          months
        });
        setAccuracy(data);
      } catch (requestError) {
        setAccuracy(null);
        setError(
          requestError.response?.data?.error ||
          requestError.message ||
          "Accuracy is unavailable. Restart the local ML service and try again."
        );
      } finally {
        setLoadingAccuracy(false);
      }
    };

    loadAccuracy();
  }, [selectedItem, selectedStore, months]);

  if (loading) {
    return <p className="status">Loading accuracy view...</p>;
  }

  const exportAccuracy = () => {
    if (!accuracy) {
      return;
    }

    downloadCsv("accuracy-report.csv", [
      ["Month", "Actual", "Predicted", "Absolute Error"],
      ...accuracy.history.map((row) => [row.month, row.actual_sales, row.predicted_sales, row.absolute_error])
    ]);
  };

  return (
    <section className="stack-xl">
      {error && <p className="status error">{error}</p>}

      <section className="card filter-card">
        <div className="section-heading">
          <div>
            <p className="section-label">Backtest Controls</p>
            <h3>Evaluate forecast reliability</h3>
          </div>
        </div>
        <div className="filters-triple">
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

          <div>
            <label>Backtest Window</label>
            <select value={months} onChange={(event) => setMonths(event.target.value)}>
              <option value="3">3 months</option>
              <option value="6">6 months</option>
              <option value="9">9 months</option>
              <option value="12">12 months</option>
            </select>
          </div>
        </div>
      </section>

      {loadingAccuracy && <p className="status">Calculating backtest accuracy...</p>}
      {accuracy && (
        <div className="toolbar">
          <div>
            <p className="section-label">Exports</p>
            <h3>Accuracy Export</h3>
          </div>
          <button type="button" className="button button-accent" onClick={exportAccuracy}>Export CSV</button>
        </div>
      )}
      <AccuracyPanel accuracy={accuracy} />
    </section>
  );
}

export default Accuracy;
