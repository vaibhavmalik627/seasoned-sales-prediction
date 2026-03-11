import { useEffect, useState } from "react";
import { fetchAiInsight } from "../api/client.js";

function AIInsightPanel({ payload, title = "AI Insight" }) {
  const [insight, setInsight] = useState("");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadInsight = async () => {
      if (!payload?.item || payload?.predictedSales === undefined) {
        setInsight("");
        setSource("");
        return;
      }

      try {
        setLoading(true);
        setError("");
        const result = await fetchAiInsight(payload);
        setInsight(result.insight || "");
        setSource(result.source || "");
      } catch (requestError) {
        setInsight("");
        setSource("");
        setError(requestError.response?.data?.error || requestError.message);
      } finally {
        setLoading(false);
      }
    };

    loadInsight();
  }, [payload]);

  if (!payload?.item || payload?.predictedSales === undefined) {
    return null;
  }

  return (
    <section className="card ai-insight-card">
      <div className="section-heading">
        <div>
          <p className="section-label">AI Insights</p>
          <h3>{title}</h3>
        </div>
      </div>

      {loading && <p className="status">Generating AI explanation...</p>}
      {error && <p className="status warning">{error}</p>}
      {!loading && !error && <p className="ai-insight-copy">{insight}</p>}
      {!loading && !error && source && (
        <p className="ai-insight-meta">
          Generated via {source === "openai" ? "OpenAI" : "forecast rules fallback"}.
        </p>
      )}
    </section>
  );
}

export default AIInsightPanel;
