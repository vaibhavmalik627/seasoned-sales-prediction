import { useEffect, useState } from "react";
import { fetchAiReport } from "../api/client.js";
import { downloadPdfReport } from "../utils/exportPdf.js";

function AIReportPanel({ payload }) {
  const [report, setReport] = useState("");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const exportPdf = () => {
    if (!report) {
      return;
    }

    const prediction = payload?.prediction;
    const subtitle = prediction
      ? `${prediction.item} forecast for ${prediction.month_name} ${prediction.year}`
      : "Retail demand forecast summary";
    const bullets = (payload?.forecast || [])
      .slice(0, 4)
      .map((row) => `${row.month}: ${row.predicted_sales} units (${row.lower_bound}-${row.upper_bound})`);

    downloadPdfReport("ai-forecast-report.pdf", {
      title: "Monthly Demand Forecast Report",
      subtitle,
      body: report,
      bullets,
    });
  };

  useEffect(() => {
    const loadReport = async () => {
      if (!payload?.prediction && !payload?.forecast?.length) {
        setReport("");
        return;
      }

      try {
        setLoading(true);
        setError("");
        const result = await fetchAiReport(payload);
        setReport(result.report || "");
        setSource(result.source || "");
      } catch (requestError) {
        setReport("");
        setSource("");
        setError(requestError.response?.data?.error || requestError.message);
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [payload]);

  if (!payload?.prediction && !payload?.forecast?.length) {
    return null;
  }

  return (
    <section className="card ai-insight-card">
      <div className="section-heading">
        <div>
          <p className="section-label">AI Report</p>
          <h3>Monthly Demand Forecast Report</h3>
        </div>
        <button type="button" className="button button-accent" onClick={exportPdf} disabled={!report || loading}>
          Export PDF
        </button>
      </div>
      {loading && <p className="status">Generating report...</p>}
      {error && <p className="status warning">{error}</p>}
      {!loading && !error && <p className="ai-insight-copy">{report}</p>}
      {!loading && !error && source && <p className="ai-insight-meta">Generated via {source === "openai" ? "OpenAI" : "report rules fallback"}.</p>}
    </section>
  );
}

export default AIReportPanel;
