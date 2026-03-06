import { useEffect, useState } from "react";

const monthOptions = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

function ForecastForm({ items, stores, onSubmit, loading }) {
  const currentYear = new Date().getFullYear();
  const [product, setProduct] = useState(items[0] || "");
  const [store, setStore] = useState("");
  const [month, setMonth] = useState(monthOptions[new Date().getMonth()]);
  const [year, setYear] = useState(currentYear);

  useEffect(() => {
    if (items.length > 0 && !items.includes(product)) {
      setProduct(items[0]);
    }
  }, [items, product]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit({
      product,
      store: store || null,
      month,
      year: Number(year)
    });
  };

  return (
    <form className="card form-grid" onSubmit={handleSubmit}>
      <div>
        <label>Product</label>
        <select value={product} onChange={(event) => setProduct(event.target.value)} required>
          {items.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Store (Optional)</label>
        <select value={store} onChange={(event) => setStore(event.target.value)}>
          <option value="">All Stores</option>
          {stores.map((storeName) => (
            <option key={storeName} value={storeName}>
              {storeName}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Month</label>
        <select value={month} onChange={(event) => setMonth(event.target.value)}>
          {monthOptions.map((monthName) => (
            <option key={monthName} value={monthName}>
              {monthName}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Year</label>
        <input
          type="number"
          min="2020"
          max="2035"
          value={year}
          onChange={(event) => setYear(event.target.value)}
          required
        />
      </div>

      <button type="submit" disabled={loading || items.length === 0}>
        {loading ? "Predicting..." : "Predict Seasonal Demand"}
      </button>
    </form>
  );
}

export default ForecastForm;
