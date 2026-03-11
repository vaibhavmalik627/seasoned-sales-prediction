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
  const [holidayBoost, setHolidayBoost] = useState("0");

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
      year: Number(year),
      holiday_boost: Number(holidayBoost)
    });
  };

  return (
    <form className="card form-panel" onSubmit={handleSubmit}>
      <div className="section-heading">
        <div>
          <p className="section-label">Forecast Controls</p>
          <h3>Configure the Forecast</h3>
          <p>Choose the product, store, timing, and optional holiday lift before running the model.</p>
        </div>
      </div>

      <div className="form-grid">
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

        <div className="form-field-full">
          <label>Holiday Lift</label>
          <select value={holidayBoost} onChange={(event) => setHolidayBoost(event.target.value)}>
            <option value="0">No uplift</option>
            <option value="5">5%</option>
            <option value="10">10%</option>
            <option value="15">15%</option>
            <option value="20">20%</option>
          </select>
        </div>
      </div>

      <button type="submit" className="button button-accent button-submit" disabled={loading || items.length === 0}>
        {loading ? "Predicting..." : "Predict Seasonal Demand"}
      </button>
    </form>
  );
}

export default ForecastForm;
