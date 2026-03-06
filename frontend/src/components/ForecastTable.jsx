function ForecastTable({ forecastRows }) {
  return (
    <section className="card">
      <h3>3-6 Month Forecast</h3>
      <table>
        <thead>
          <tr>
            <th>Month</th>
            <th>Predicted Sales</th>
          </tr>
        </thead>
        <tbody>
          {forecastRows.map((row) => (
            <tr key={`${row.month}-${row.year}`}>
              <td>{row.month}</td>
              <td>{row.predicted_sales}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default ForecastTable;