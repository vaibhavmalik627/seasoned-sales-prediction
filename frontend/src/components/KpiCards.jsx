function KpiCards({ analytics }) {
  const cards = [
    { label: "Total Products", value: analytics?.total_products ?? "-" },
    { label: "Total Stores", value: analytics?.total_stores ?? "-" },
    { label: "Highest Demand Month", value: analytics?.highest_demand_month ?? "-" },
    { label: "Top Selling Product", value: analytics?.top_selling_product ?? "-" }
  ];

  return (
    <section className="kpi-grid">
      {cards.map((card) => (
        <article key={card.label} className="card kpi-card">
          <p>{card.label}</p>
          <h3>{card.value}</h3>
        </article>
      ))}
    </section>
  );
}

export default KpiCards;