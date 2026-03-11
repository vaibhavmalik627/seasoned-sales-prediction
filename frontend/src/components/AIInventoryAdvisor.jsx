import { useEffect, useState } from "react";
import { fetchAiInventoryAdvice } from "../api/client.js";

function AIInventoryAdvisor({ payload, title = "AI Inventory Advisor" }) {
  const [insight, setInsight] = useState("");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAdvice = async () => {
      if (!payload?.type) {
        setInsight("");
        setSource("");
        return;
      }

      try {
        setLoading(true);
        setError("");
        const result = await fetchAiInventoryAdvice(payload);
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

    loadAdvice();
  }, [payload]);

  if (!payload?.type) {
    return null;
  }

  return (
    <section className="card ai-insight-card">
      <div className="section-heading">
        <div>
          <p className="section-label">AI Advisor</p>
          <h3>{title}</h3>
        </div>
      </div>
      {loading && <p className="status">Generating inventory advice...</p>}
      {error && <p className="status warning">{error}</p>}
      {!loading && !error && <p className="ai-insight-copy">{insight}</p>}
      {!loading && !error && source && (
        <p className="ai-insight-meta">
          Generated via {source === "openai" ? "OpenAI" : "inventory rules fallback"}.
        </p>
      )}
    </section>
  );
}

export default AIInventoryAdvisor;
