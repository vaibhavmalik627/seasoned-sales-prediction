import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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
      forecastSales: null
    });
  });

  forecastData.forEach((row) => {
    const existing = mergedByMonth.get(row.month) || {
      month: row.month,
      historicalSales: null,
      forecastSales: null
    };

    existing.forecastSales = row.predicted_sales;
    mergedByMonth.set(row.month, existing);
  });

  const chartData = Array.from(mergedByMonth.values()).sort(
    (left, right) => new Date(left.month) - new Date(right.month)
  );

  return (
    <section className="card chart-card">
      <h3>Sales Trend vs Forecast</h3>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#d8d2bc" />
          <XAxis dataKey="month" tick={{ fill: "#2c3d45", fontSize: 12 }} />
          <YAxis tick={{ fill: "#2c3d45", fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="historicalSales"
            stroke="#14796b"
            strokeWidth={2.5}
            name="Historical Sales"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="forecastSales"
            stroke="#d87033"
            strokeWidth={2.5}
            name="Forecast Sales"
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </section>
  );
}

export default SalesChart;