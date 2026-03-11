function DataQualityPanel({ report }) {
  if (!report) {
    return null;
  }

  return (
    <section className="card ai-insight-card">
      <div className="section-heading">
        <div>
          <p className="section-label">AI Data Report</p>
          <h3>Upload Quality Check</h3>
        </div>
      </div>
      <p className="ai-insight-copy">{report.summary}</p>
      <ul className="ai-list">
        {(report.issues || []).map((issue) => (
          <li key={issue}>{issue}</li>
        ))}
      </ul>
      {report.source && <p className="ai-insight-meta">Generated via {report.source === "openai" ? "OpenAI" : "data rules fallback"}.</p>}
    </section>
  );
}

export default DataQualityPanel;
