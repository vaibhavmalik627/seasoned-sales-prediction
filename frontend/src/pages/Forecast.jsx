import { useEffect, useState } from "react";
import {
  fetchCatalog,
  fetchForecast,
  fetchSalesHistory,
  predictDemand
} from "../api/client.js";
import ForecastForm from "../components/ForecastForm.jsx";
import ForecastTable from "../components/ForecastTable.jsx";
import SalesChart from "../components/SalesChart.jsx";

function Forecast() {
  const [catalog, setCatalog] = useState({ items: [], stores: [] });
  const [prediction, setPrediction] = useState(null);
  const [history, setHistory] = useState([]);
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

      const [predictionData, historyData, forecastData] = await Promise.all([
        predictDemand(payload),
        fetchSalesHistory({
          item: payload.product,
          store: payload.store || undefined,
          months: 18
        }),
        fetchForecast({
          item: payload.product,
          store: payload.store || undefined,
          start_month: payload.month,
          start_year: payload.year,
          horizon: 6
        })
      ]);

      setPrediction(predictionData);
      setHistory(historyData.history || []);
      setForecast(forecastData.forecast || []);
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="stack-lg">
      {error && <p className="status error">{error}</p>}

      <ForecastForm
        items={catalog.items}
        stores={catalog.stores}
        onSubmit={handlePredict}
        loading={loading}
      />

      {prediction && (
        <article className="card prediction-result">
          <h2>
            Predicted demand for {prediction.item} in {prediction.month_name} {prediction.year}:
            <span> {prediction.predicted_sales} units</span>
          </h2>
          <p>{prediction.explanation}</p>
        </article>
      )}

      {history.length > 0 && <SalesChart historicalData={history} forecastData={forecast} />}
      {forecast.length > 0 && <ForecastTable forecastRows={forecast} />}
    </section>
  );
}

export default Forecast;