import axios from "axios";

function resolveApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;

  if (!configuredBaseUrl) {
    return "http://localhost:5000/api";
  }

  return configuredBaseUrl.endsWith("/api")
    ? configuredBaseUrl
    : `${configuredBaseUrl.replace(/\/+$/, "")}/api`;
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
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
