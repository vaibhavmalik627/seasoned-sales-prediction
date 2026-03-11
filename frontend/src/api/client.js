import axios from "axios";

const AUTH_STORAGE_KEY = "retailStoreAuth";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 15000
});

api.interceptors.request.use((config) => {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    const session = raw ? JSON.parse(raw) : null;

    if (session?.token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${session.token}`;
    }
  } catch {
    // Ignore storage parsing issues and continue without auth.
  }

  return config;
});

export async function fetchCatalog() {
  const { data } = await api.get("/catalog");
  return data;
}

export async function fetchAnalytics() {
  const { data } = await api.get("/analytics");
  return data;
}

export async function fetchAccuracy(params) {
  const { data } = await api.get("/accuracy", { params });
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

export async function fetchReorderRecommendation(payload) {
  const { data } = await api.post("/reorder-recommendation", payload);
  return data;
}

export async function fetchRiskDashboard(params) {
  const { data } = await api.get("/risk-dashboard", { params });
  return data;
}

export async function uploadDataset(payload) {
  const { data } = await api.post("/dataset", payload);
  return data;
}

export async function registerStoreAccount(payload) {
  const { data } = await api.post("/auth/register", payload);
  return data;
}

export async function loginStoreAccount(payload) {
  const { data } = await api.post("/auth/login", payload);
  return data;
}

export async function fetchCurrentAccount() {
  const { data } = await api.get("/auth/me");
  return data;
}

export async function logoutStoreAccount() {
  const { data } = await api.post("/auth/logout");
  return data;
}

export async function fetchAiInsight(payload) {
  const { data } = await api.post("/ai/insights", payload);
  return data;
}

export async function fetchAiInventoryAdvice(payload) {
  const { data } = await api.post("/ai/inventory-advice", payload);
  return data;
}

export async function fetchAiQueryAnswer(payload) {
  const { data } = await api.post("/ai/query", payload);
  return data;
}

export async function fetchAiDataQuality(payload) {
  const { data } = await api.post("/ai/data-quality", payload);
  return data;
}

export async function fetchAiReport(payload) {
  const { data } = await api.post("/ai/report", payload);
  return data;
}

export async function fetchAiStory(payload) {
  const { data } = await api.post("/ai/story", payload);
  return data;
}

export async function fetchAiMetricExplanation(payload) {
  const { data } = await api.post("/ai/metric-explanation", payload);
  return data;
}

export async function fetchAiChat(payload) {
  const { data } = await api.post("/ai/chat", payload);
  return data;
}

export async function fetchAiChatHistory() {
  const { data } = await api.get("/ai/chat/history");
  return data;
}

export async function clearAiChatHistory() {
  const { data } = await api.delete("/ai/chat/history");
  return data;
}
