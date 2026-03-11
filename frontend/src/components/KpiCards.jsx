function KpiCards({ analytics }) {
  const cards = [
    {
      label: "Total Products",
      value: analytics?.total_products ?? "-",
      icon: "📦",
      detail: "Tracked catalog items"
    },
    {
      label: "Total Stores",
      value: analytics?.total_stores ?? "-",
      icon: "🏬",
      detail: "Active retail locations"
    },
    {
      label: "Peak Demand Month",
      value: analytics?.highest_demand_month ?? "-",
      icon: "📈",
      detail: "Strongest seasonal month"
    },
    {
      label: "Top Product",
      value: analytics?.top_selling_product ?? "-",
      icon: "🔥",
      detail: "Highest-selling item"
    }
  ];

  return (
    <section className="kpi-grid">
      {cards.map((card) => (
        <article key={card.label} className="card kpi-card">
          <span className="kpi-icon" aria-hidden="true">{card.icon}</span>
          <p>{card.label}</p>
          <h3>{card.value}</h3>
          <span>{card.detail}</span>
        </article>
      ))}
    </section>
  );
}

export default KpiCards;
