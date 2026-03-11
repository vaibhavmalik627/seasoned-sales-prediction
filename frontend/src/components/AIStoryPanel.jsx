import { useEffect, useState } from "react";
import { fetchAiStory } from "../api/client.js";

function AIStoryPanel({ payload, title = "Demand Story" }) {
  const [story, setStory] = useState("");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStory = async () => {
      if (!payload?.item || !payload?.history?.length) {
        setStory("");
        return;
      }

      try {
        setLoading(true);
        setError("");
        const result = await fetchAiStory(payload);
        setStory(result.story || "");
        setSource(result.source || "");
      } catch (requestError) {
        setStory("");
        setSource("");
        setError(requestError.response?.data?.error || requestError.message);
      } finally {
        setLoading(false);
      }
    };

    loadStory();
  }, [payload]);

  if (!payload?.item || !payload?.history?.length) {
    return null;
  }

  return (
    <section className="card ai-insight-card">
      <div className="section-heading">
        <div>
          <p className="section-label">AI Story</p>
          <h3>{title}</h3>
        </div>
      </div>
      {loading && <p className="status">Writing demand story...</p>}
      {error && <p className="status warning">{error}</p>}
      {!loading && !error && <p className="ai-insight-copy">{story}</p>}
      {!loading && !error && source && <p className="ai-insight-meta">Generated via {source === "openai" ? "OpenAI" : "trend rules fallback"}.</p>}
    </section>
  );
}

export default AIStoryPanel;
