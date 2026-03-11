import AIMetricExplainer from "./AIMetricExplainer.jsx";

function formatMetric(value, suffix = "") {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }

  return `${Number(value).toFixed(1)}${suffix}`;
}

function getMetricStatus(label, rawValue) {
  const value = Number(rawValue);

  if (Number.isNaN(value)) {
    return { tone: "neutral", text: "Unavailable" };
  }

  if (label === "MAPE") {
    if (value > 20) {
      return { tone: "critical", text: "High Error" };
    }
    if (value > 10) {
      return { tone: "warning", text: "Watch" };
    }
    return { tone: "healthy", text: "Stable" };
  }

  if (label === "Bias") {
    if (Math.abs(value) > 10) {
      return { tone: "warning", text: "Directional Skew" };
    }
    return { tone: "healthy", text: "Balanced" };
  }

  if (value > 150) {
    return { tone: "warning", text: "Elevated" };
  }

  return { tone: "healthy", text: "Controlled" };
}

function AccuracyPanel({ accuracy }) {
  if (!accuracy) {
    return null;
  }

  const cards = [
    {
      label: "MAPE",
      rawValue: accuracy.metrics?.mape,
      value: formatMetric(accuracy.metrics?.mape, "%"),
      hint: "Average percentage error"
    },
    {
      label: "MAE",
      rawValue: accuracy.metrics?.mae,
      value: formatMetric(accuracy.metrics?.mae),
      hint: "Average unit error"
    },
    {
      label: "RMSE",
      rawValue: accuracy.metrics?.rmse,
      value: formatMetric(accuracy.metrics?.rmse),
      hint: "Penalty for large misses"
    },
    {
      label: "Bias",
      rawValue: accuracy.metrics?.bias,
      value: formatMetric(accuracy.metrics?.bias),
      hint: "Positive means over-forecasting"
    }
  ];

  return (
    <section className="card stack-sm">
      <div className="section-heading">
        <div>
          <p className="section-label">Accuracy Metrics</p>
          <h3>Forecast Accuracy</h3>
          <p>
            Backtested across the last {accuracy.months_evaluated} months for {accuracy.item} in{" "}
            {accuracy.store}.
          </p>
        </div>
      </div>

      <section className="metric-grid">
        {cards.map((card) => {
          const status = getMetricStatus(card.label, card.rawValue);

          return (
            <article key={card.label} className={`metric-card metric-${status.tone}`}>
            <p>{card.label}</p>
            <h4>{card.value}</h4>
            <strong className="metric-status">{status.text}</strong>
            <span>{card.hint}</span>
          </article>
          );
        })}
      </section>

      <div className="table-wrap">
        <table className="analytics-table">
          <thead>
            <tr>
              <th>Month</th>
              <th className="numeric">Actual</th>
              <th className="numeric">Predicted</th>
              <th className="numeric">Abs Error</th>
            </tr>
          </thead>
          <tbody>
            {accuracy.history?.map((row) => (
              <tr key={row.month}>
                <td>{row.month}</td>
                <td className="numeric">{row.actual_sales}</td>
                <td className="numeric">{row.predicted_sales}</td>
                <td className="numeric">{row.absolute_error}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AIMetricExplainer accuracy={accuracy} />
    </section>
  );
}

export default AccuracyPanel;
