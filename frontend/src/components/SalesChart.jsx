import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

function SalesChart({ historicalData, forecastData }) {
  const mergedByMonth = new Map();

  historicalData.forEach((row) => {
    mergedByMonth.set(row.month, {
      month: row.month,
      historicalSales: row.sales,
      forecastSales: null,
      confidenceBand: null,
      lowerBound: null,
      upperBound: null
    });
  });

  forecastData.forEach((row) => {
    const existing = mergedByMonth.get(row.month) || {
      month: row.month,
      historicalSales: null,
      forecastSales: null,
      confidenceBand: null,
      lowerBound: null,
      upperBound: null
    };

    existing.forecastSales = row.predicted_sales;
    existing.lowerBound = row.lower_bound ?? null;
    existing.upperBound = row.upper_bound ?? null;
    existing.confidenceBand =
      row.lower_bound !== undefined && row.upper_bound !== undefined
        ? [row.lower_bound, row.upper_bound]
        : null;
    mergedByMonth.set(row.month, existing);
  });

  const chartData = Array.from(mergedByMonth.values()).sort(
    (left, right) => new Date(left.month) - new Date(right.month)
  );

  const hasHistorical = chartData.some((row) => row.historicalSales !== null);

  const tooltipFormatter = (value, name) => {
    if (Array.isArray(value)) {
      return [`${value[0]} - ${value[1]}`, name];
    }

    return [value, name];
  };

  return (
    <section className="card chart-card">
      <div className="section-heading">
        <div>
          <p className="section-label">Forecast View</p>
          <h3>Sales Trend vs Forecast</h3>
          <p>
            {hasHistorical
              ? "Historical demand is shown in teal, forecast demand in orange, with a shaded confidence band."
              : "Forecast demand is shown with a shaded confidence band for planning uncertainty."}
          </p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(125, 141, 149, 0.24)" />
          <XAxis dataKey="month" tick={{ fill: "#2c3d45", fontSize: 12 }} />
          <YAxis tick={{ fill: "#2c3d45", fontSize: 12 }} />
          <Tooltip formatter={tooltipFormatter} />
          <Legend />
          <Area
            type="monotone"
            dataKey="confidenceBand"
            stroke="none"
            fill="rgba(216, 112, 51, 0.18)"
            name="Confidence Band"
          />
          <Line
            type="monotone"
            dataKey="historicalSales"
            stroke="#14796b"
            strokeWidth={3}
            name="Historical Sales"
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="forecastSales"
            stroke="#d87033"
            strokeWidth={3}
            name="Forecast Sales"
            dot={{ r: 3 }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </section>
  );
}

export default SalesChart;
