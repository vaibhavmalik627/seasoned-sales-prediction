import axios from "axios";

const mlClient = axios.create({
  baseURL: process.env.ML_SERVICE_URL || "http://localhost:8000",
  timeout: 30000
});

function toServiceError(error) {
  if (error.response) {
    const message =
      error.response.data?.error ||
      error.response.data?.message ||
      `ML service request failed with status ${error.response.status}`;
    const wrappedError = new Error(message);
    wrappedError.status = error.response.status;
    return wrappedError;
  }

  if (error.code === "ECONNREFUSED") {
    const wrappedError = new Error(
      "Cannot reach ML service. Make sure the Python service is running."
    );
    wrappedError.status = 503;
    return wrappedError;
  }

  return new Error(error.message || "Unknown ML service failure");
}

export async function predictFromModel(payload) {
  try {
    const { data } = await mlClient.post("/predict", payload);
    return data;
  } catch (error) {
    throw toServiceError(error);
  }
}

export async function fetchForecast(params) {
  try {
    const { data } = await mlClient.get("/forecast", { params });
    return data;
  } catch (error) {
    throw toServiceError(error);
  }
}

export async function fetchSalesHistory(params) {
  try {
    const { data } = await mlClient.get("/sales-history", { params });
    return data;
  } catch (error) {
    throw toServiceError(error);
  }
}

export async function fetchAnalytics() {
  try {
    const { data } = await mlClient.get("/analytics");
    return data;
  } catch (error) {
    throw toServiceError(error);
  }
}

export async function fetchCatalog() {
  try {
    const { data } = await mlClient.get("/catalog");
    return data;
  } catch (error) {
    throw toServiceError(error);
  }
}