import {
  fetchAnalytics,
  fetchCatalog,
  fetchForecast,
  fetchSalesHistory,
  predictFromModel
} from "../services/ml.service.js";

const monthLookup = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12
};

function toValidMonth(rawValue) {
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return null;
  }

  if (typeof rawValue === "number") {
    return rawValue >= 1 && rawValue <= 12 ? rawValue : null;
  }

  const value = String(rawValue).trim().toLowerCase();

  if (/^\d+$/.test(value)) {
    const numericMonth = Number(value);
    return numericMonth >= 1 && numericMonth <= 12 ? numericMonth : null;
  }

  if (monthLookup[value]) {
    return monthLookup[value];
  }

  const normalized = Object.keys(monthLookup).find((monthName) =>
    monthName.startsWith(value)
  );

  return normalized ? monthLookup[normalized] : null;
}

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function pickItem(input) {
  return input?.product || input?.item || null;
}

export async function predictDemand(req, res, next) {
  try {
    const item = pickItem(req.body);
    const month = toValidMonth(req.body?.month);
    const year = toNumber(req.body?.year, new Date().getFullYear());
    const store = req.body?.store || null;

    if (!item || !month) {
      const error = new Error("`product` (or `item`) and a valid `month` are required.");
      error.status = 400;
      throw error;
    }

    const prediction = await predictFromModel({
      item,
      month,
      year,
      store
    });

    res.json(prediction);
  } catch (error) {
    next(error);
  }
}

export async function getForecast(req, res, next) {
  try {
    const item = pickItem(req.query);
    const now = new Date();
    const startMonth = toValidMonth(req.query?.start_month) || now.getMonth() + 1;
    const startYear = toNumber(req.query?.start_year, now.getFullYear());
    const horizon = Math.max(1, Math.min(toNumber(req.query?.horizon, 6), 12));
    const store = req.query?.store || null;

    if (!item) {
      const error = new Error("`item` (or `product`) is required for /forecast.");
      error.status = 400;
      throw error;
    }

    const forecast = await fetchForecast({
      item,
      store,
      start_month: startMonth,
      start_year: startYear,
      horizon
    });

    res.json(forecast);
  } catch (error) {
    next(error);
  }
}

export async function getSalesHistory(req, res, next) {
  try {
    const item = pickItem(req.query);
    const store = req.query?.store || null;
    const months = Math.max(1, Math.min(toNumber(req.query?.months, 24), 60));

    const salesHistory = await fetchSalesHistory({
      item,
      store,
      months
    });

    res.json(salesHistory);
  } catch (error) {
    next(error);
  }
}

export async function getAnalytics(req, res, next) {
  try {
    const analytics = await fetchAnalytics();
    res.json(analytics);
  } catch (error) {
    next(error);
  }
}

export async function getCatalog(req, res, next) {
  try {
    const catalog = await fetchCatalog();
    res.json(catalog);
  } catch (error) {
    next(error);
  }
}
