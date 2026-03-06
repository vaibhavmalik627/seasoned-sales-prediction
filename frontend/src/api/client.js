import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 15000
});

export async function fetchCatalog() {
  const { data } = await api.get("/catalog");
  return data;
}

export async function fetchAnalytics() {
  const { data } = await api.get("/analytics");
  return data;
}

export async function fetchSalesHistory(params) {
  const { data } = await api.get("/sales-history", { params });
  return data;
}

export async function fetchForecast(params) {
  const { data } = await api.get("/forecast", { params });
  return data;
}

export async function predictDemand(payload) {
  const { data } = await api.post("/predict", payload);
  return data;
}