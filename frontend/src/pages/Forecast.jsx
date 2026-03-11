import { useEffect, useState } from "react";
import {
  fetchAccuracy,
  fetchCatalog,
  fetchForecast,
  fetchSalesHistory,
  predictDemand
} from "../api/client.js";
import AIInsightPanel from "../components/AIInsightPanel.jsx";
import AIReportPanel from "../components/AIReportPanel.jsx";
import AIStoryPanel from "../components/AIStoryPanel.jsx";
import AccuracyPanel from "../components/AccuracyPanel.jsx";
import ForecastChatAssistant from "../components/ForecastChatAssistant.jsx";
import ForecastForm from "../components/ForecastForm.jsx";
import ForecastTable from "../components/ForecastTable.jsx";
import SalesChart from "../components/SalesChart.jsx";
import { downloadCsv } from "../utils/exportCsv.js";

function Forecast() {
  const [catalog, setCatalog] = useState({ items: [], stores: [] });
  const [prediction, setPrediction] = useState(null);
  const [history, setHistory] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [accuracy, setAccuracy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [accuracyError, setAccuracyError] = useState("");

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

      const [predictionData, historyData, forecastData, accuracyResult] = await Promise.allSettled([
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
          horizon: 6,
          holiday_boost: payload.holiday_boost
        }),
        fetchAccuracy({
          item: payload.product,
          store: payload.store || undefined,
          months: 6
        })
      ]);

      if (
        predictionData.status !== "fulfilled" ||
        historyData.status !== "fulfilled" ||
        forecastData.status !== "fulfilled"
      ) {
        throw (
          predictionData.reason ||
          historyData.reason ||
          forecastData.reason
        );
      }

      setPrediction(predictionData.value);
      setHistory(historyData.value.history || []);
      setForecast(forecastData.value.forecast || []);

      if (accuracyResult.status === "fulfilled") {
        setAccuracy(accuracyResult.value);
        setAccuracyError("");
      } else {
        setAccuracy(null);
        setAccuracyError(
          accuracyResult.reason?.response?.data?.error ||
          accuracyResult.reason?.message ||
          "Accuracy metrics are unavailable for the current ML service."
        );
      }
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const exportForecast = () => {
    if (!forecast.length) {
      return;
    }

    downloadCsv("forecast-report.csv", [
      ["Month", "Predicted Sales", "Lower Bound", "Upper Bound"],
      ...forecast.map((row) => [row.month, row.predicted_sales, row.lower_bound, row.upper_bound])
    ]);
  };

  const predictionRangeWidth = prediction
    ? Math.max(prediction.upper_bound - prediction.lower_bound, 1)
    : 1;
  const predictionMarker = prediction
    ? `${Math.min(
        100,
        Math.max(
          0,
          ((prediction.predicted_sales - prediction.lower_bound) / predictionRangeWidth) * 100
        )
      )}%`
    : "50%";
  const forecastInsightPayload = prediction
    ? {
        item: prediction.item,
        store: prediction.store,
        monthName: prediction.month_name,
        year: prediction.year,
        predictedSales: prediction.predicted_sales,
        lowerBound: prediction.lower_bound,
        upperBound: prediction.upper_bound,
        historicalAverage: prediction.historical_average,
        topSeasonMonth: history.length ? null : null,
        accuracy: accuracy?.metrics || null,
      }
    : null;
  const storyPayload = prediction
    ? {
        item: prediction.item,
        store: prediction.store,
        history,
      }
    : null;
  const reportPayload = prediction || forecast.length
    ? {
        prediction,
        forecast,
        accuracy: accuracy?.metrics || null,
      }
    : null;
  const chatReportContext = {
    item: prediction?.item,
    store: prediction?.store,
    prediction,
    forecast,
    accuracy: accuracy?.metrics || null,
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
          <p className="section-label">Forecast Result</p>
          <h2>
            Predicted demand for {prediction.item} in {prediction.month_name} {prediction.year}:
            <span> {prediction.predicted_sales} units</span>
          </h2>
          <p className="prediction-range">
            Expected range: <strong>{prediction.lower_bound}</strong> to{" "}
            <strong>{prediction.upper_bound}</strong> units
          </p>
          <div className="confidence-rail">
            <div className="confidence-track">
              <span className="confidence-marker" style={{ left: predictionMarker }} />
            </div>
            <div className="confidence-axis">
              <span>{prediction.lower_bound}</span>
              <strong>{prediction.predicted_sales}</strong>
              <span>{prediction.upper_bound}</span>
            </div>
          </div>
          <p>{prediction.explanation}</p>
        </article>
      )}

      {history.length > 0 && <SalesChart historicalData={history} forecastData={forecast} />}
      <AIInsightPanel payload={forecastInsightPayload} title="Manager-Facing Forecast Explanation" />
      <AIStoryPanel payload={storyPayload} title="Product Demand Storytelling" />
      <ForecastChatAssistant item={prediction?.item} store={prediction?.store} reportContext={chatReportContext} />
      {accuracyError && <p className="status warning">{accuracyError}</p>}
      <AccuracyPanel accuracy={accuracy} />
      <AIReportPanel payload={reportPayload} />
      {forecast.length > 0 && (
        <>
          <div className="toolbar">
            <div>
              <p className="section-label">Exports</p>
              <h3>Forecast Export</h3>
            </div>
            <button type="button" className="button button-accent" onClick={exportForecast}>Export CSV</button>
          </div>
          <ForecastTable forecastRows={forecast} />
        </>
      )}
    </section>
  );
}

export default Forecast;
