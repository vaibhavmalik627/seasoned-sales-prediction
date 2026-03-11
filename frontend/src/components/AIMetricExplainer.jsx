import { useEffect, useState } from "react";
import { fetchAiMetricExplanation } from "../api/client.js";

function AIMetricExplainer({ accuracy }) {
  const [explanation, setExplanation] = useState("");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadExplanation = async () => {
      if (!accuracy?.metrics) {
        setExplanation("");
        return;
      }

      try {
        setLoading(true);
        setError("");
        const result = await fetchAiMetricExplanation({
          item: accuracy.item,
          store: accuracy.store,
          metrics: accuracy.metrics,
          monthsEvaluated: accuracy.months_evaluated,
        });
        setExplanation(result.explanation || "");
        setSource(result.source || "");
      } catch (requestError) {
        setExplanation("");
        setSource("");
        setError(requestError.response?.data?.error || requestError.message);
      } finally {
        setLoading(false);
      }
    };

    loadExplanation();
  }, [accuracy]);

  if (!accuracy?.metrics) {
    return null;
  }

  return (
    <section className="card ai-insight-card">
      <div className="section-heading">
        <div>
          <p className="section-label">AI Metric Explainer</p>
          <h3>What the Accuracy Metrics Mean</h3>
        </div>
      </div>
      {loading && <p className="status">Explaining metrics...</p>}
      {error && <p className="status warning">{error}</p>}
      {!loading && !error && <p className="ai-insight-copy">{explanation}</p>}
      {!loading && !error && source && <p className="ai-insight-meta">Generated via {source === "openai" ? "OpenAI" : "metric rules fallback"}.</p>}
    </section>
  );
}

export default AIMetricExplainer;
