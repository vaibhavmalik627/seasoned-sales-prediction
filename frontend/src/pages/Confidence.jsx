import { useEffect, useState } from "react";
import { fetchCatalog, fetchForecast, predictDemand } from "../api/client.js";
import ForecastForm from "../components/ForecastForm.jsx";
import ForecastTable from "../components/ForecastTable.jsx";
import SalesChart from "../components/SalesChart.jsx";
import { downloadCsv } from "../utils/exportCsv.js";

function Confidence() {
  const [catalog, setCatalog] = useState({ items: [], stores: [] });
  const [prediction, setPrediction] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const data = await fetchCatalog();
        setCatalog(data);
      } catch (requestError) {
        setError(requestError.response?.data?.error || requestError.message);
      }
    };

    loadCatalog();
  }, []);

  const handlePredict = async (payload) => {
    try {
      setLoading(true);
      setError("");

      const [predictionData, forecastData] = await Promise.all([
        predictDemand(payload),
        fetchForecast({
          item: payload.product,
          store: payload.store || undefined,
          start_month: payload.month,
          start_year: payload.year,
          horizon: 6,
          holiday_boost: payload.holiday_boost
        })
      ]);

      setPrediction(predictionData);
      setForecast(forecastData.forecast || []);
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const exportConfidence = () => {
    if (!forecast.length) {
      return;
    }

    downloadCsv("confidence-report.csv", [
      ["Month", "Predicted Sales", "Lower Bound", "Upper Bound", "Holiday Boost"],
      ...forecast.map((row) => [
        row.month,
        row.predicted_sales,
        row.lower_bound,
        row.upper_bound,
        row.holiday_boost ?? 0
      ])
    ]);
  };

  return (
    <section className="stack-xl">
      {error && <p className="status error">{error}</p>}

      <ForecastForm
        items={catalog.items}
        stores={catalog.stores}
        onSubmit={handlePredict}
        loading={loading}
      />

      {prediction && (
        <article className="card prediction-result">
          <p className="section-label">Confidence Summary</p>
          <h2>
            Confidence range for {prediction.item} in {prediction.month_name} {prediction.year}:
            <span> {prediction.predicted_sales} units</span>
          </h2>
          <p className="prediction-range">
            Expected range: <strong>{prediction.lower_bound}</strong> to{" "}
            <strong>{prediction.upper_bound}</strong> units
          </p>
          <p>{prediction.explanation}</p>
        </article>
      )}

      {forecast.length > 0 && (
        <section className="card">
          <div className="toolbar">
            <div>
              <p className="section-label">Uncertainty View</p>
              <h3>Confidence View</h3>
            </div>
            <button type="button" className="button button-accent" onClick={exportConfidence}>Export CSV</button>
          </div>
          <p className="section-copy">
            The shaded band shows a planning range around the forecast based on recent model uncertainty.
          </p>
          <SalesChart historicalData={[]} forecastData={forecast} />
        </section>
      )}

      {forecast.length > 0 && (
        <section className="confidence-list">
          {forecast.map((row) => {
            const span = Math.max((row.upper_bound ?? 0) - (row.lower_bound ?? 0), 1);
            const marker = `${Math.min(
              100,
              Math.max(
                0,
                (((row.predicted_sales ?? 0) - (row.lower_bound ?? 0)) / span) * 100
              )
            )}%`;

            return (
              <article key={`${row.month}-${row.year}`} className="card confidence-card">
                <div className="confidence-card-header">
                  <div>
                    <p className="section-label">Confidence Range</p>
                    <h3>{row.month}</h3>
                  </div>
                  <strong>{row.predicted_sales}</strong>
                </div>
                <div className="confidence-track">
                  <span className="confidence-marker" style={{ left: marker }} />
                </div>
                <div className="confidence-axis">
                  <span>{row.lower_bound ?? "-"}</span>
                  <strong>Forecast {row.predicted_sales}</strong>
                  <span>{row.upper_bound ?? "-"}</span>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {forecast.length > 0 && <ForecastTable forecastRows={forecast} />}
    </section>
  );
}

export default Confidence;
