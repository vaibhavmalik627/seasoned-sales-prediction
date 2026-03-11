function ForecastTable({ forecastRows }) {
  return (
    <section className="card table-card">
      <div className="section-heading">
        <div>
          <p className="section-label">Forecast Table</p>
          <h3>3-6 Month Forecast</h3>
        </div>
      </div>
      <div className="table-wrap">
        <table className="analytics-table">
        <thead>
          <tr>
            <th>Month</th>
            <th className="numeric">Predicted Sales</th>
            <th className="numeric">Lower Bound</th>
            <th className="numeric">Upper Bound</th>
          </tr>
        </thead>
        <tbody>
          {forecastRows.map((row) => (
            <tr key={`${row.month}-${row.year}`}>
              <td>{row.month}</td>
              <td className="numeric">{row.predicted_sales}</td>
              <td className="numeric">{row.lower_bound ?? "-"}</td>
              <td className="numeric">{row.upper_bound ?? "-"}</td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </section>
  );
}

export default ForecastTable;
