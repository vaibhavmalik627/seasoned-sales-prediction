import { useState } from "react";
import { fetchAiQueryAnswer } from "../api/client.js";

const sampleQuestions = [
  "Which product will sell the most next month?",
  "Why are jacket sales increasing?",
  "Which store has the highest demand?",
  "What should I stock more next month?",
];

function AskDataPanel({ selectedItem, selectedStore }) {
  const [question, setQuestion] = useState(sampleQuestions[0]);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      const result = await fetchAiQueryAnswer({
        question,
        item: selectedItem || undefined,
        store: selectedStore || undefined,
      });
      setAnswer(result.answer || "");
    } catch (requestError) {
      setAnswer("");
      setError(requestError.response?.data?.error || requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card ask-data-card">
      <div className="section-heading">
        <div>
          <p className="section-label">Ask Your Data</p>
          <h3>Natural Language Query</h3>
          <p>Ask a business question instead of reading every chart and table.</p>
        </div>
      </div>

      <div className="ask-data-samples">
        {sampleQuestions.map((sample) => (
          <button
            key={sample}
            type="button"
            className="ask-chip"
            onClick={() => setQuestion(sample)}
          >
            {sample}
          </button>
        ))}
      </div>

      <form className="ask-data-form" onSubmit={handleSubmit}>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={3}
          placeholder="Ask your forecast data a question..."
        />
        <button type="submit" className="button button-primary" disabled={loading || !question.trim()}>
          {loading ? "Thinking..." : "Ask Forecast AI"}
        </button>
      </form>

      {error && <p className="status warning">{error}</p>}
      {answer && !error && <p className="ai-insight-copy">{answer}</p>}
    </section>
  );
}

export default AskDataPanel;
