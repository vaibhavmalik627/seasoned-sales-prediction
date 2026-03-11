import {
  fetchAnalytics,
  fetchCatalog,
  fetchForecast,
  fetchSalesHistory,
} from "./ml.service.js";
import { getDatabase } from "./mongo.service.js";

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildFallbackInsight(payload) {
  const predictedSales = toNumber(payload.predictedSales);
  const historicalAverage = toNumber(payload.historicalAverage);
  const lowerBound = toNumber(payload.lowerBound);
  const upperBound = toNumber(payload.upperBound);
  const rangeWidth = Math.max(upperBound - lowerBound, 0);
  const deltaPercent = historicalAverage > 0
    ? ((predictedSales - historicalAverage) / historicalAverage) * 100
    : 0;

  let demandSentence = `${payload.item} is forecast at ${predictedSales} units`;
  if (payload.monthName && payload.year) {
    demandSentence += ` for ${payload.monthName} ${payload.year}`;
  }
  demandSentence += ".";

  let comparisonSentence = "";
  if (historicalAverage > 0) {
    if (deltaPercent >= 8) {
      comparisonSentence = `This is about ${Math.abs(deltaPercent).toFixed(0)}% above the historical average of ${historicalAverage} units.`;
    } else if (deltaPercent <= -8) {
      comparisonSentence = `This is about ${Math.abs(deltaPercent).toFixed(0)}% below the historical average of ${historicalAverage} units.`;
    } else {
      comparisonSentence = `Demand is broadly in line with the historical average of ${historicalAverage} units.`;
    }
  }

  let riskSentence = "";
  if (rangeWidth > predictedSales * 0.25) {
    riskSentence = `The confidence range is fairly wide at ${lowerBound}-${upperBound}, so inventory should be planned with extra buffer.`;
  } else {
    riskSentence = `The confidence range of ${lowerBound}-${upperBound} is relatively controlled, which supports a steadier inventory plan.`;
  }

  const recommendations = [];
  if (deltaPercent >= 8) {
    recommendations.push("Increase inventory ahead of the forecast window to reduce stockout risk.");
  } else if (deltaPercent <= -8) {
    recommendations.push("Avoid over-ordering and review current stock before adding more inventory.");
  } else {
    recommendations.push("Maintain current replenishment plans and monitor actual sell-through against forecast.");
  }

  if (payload.topSeasonMonth && payload.topSeasonMonth === payload.monthName) {
    recommendations.push(`This aligns with the product's strongest demand period in ${payload.topSeasonMonth}.`);
  }

  if (payload.accuracy?.mape !== undefined) {
    const mape = toNumber(payload.accuracy.mape);
    if (mape > 20) {
      recommendations.push(`Model accuracy is currently weaker at ${mape.toFixed(1)}% MAPE, so use more conservative stock decisions.`);
    } else {
      recommendations.push(`Model accuracy is acceptable at ${mape.toFixed(1)}% MAPE for operational planning.`);
    }
  }

  return [demandSentence, comparisonSentence, riskSentence, ...recommendations]
    .filter(Boolean)
    .join(" ");
}

function buildPrompt(payload) {
  return [
    "You are a retail analytics assistant.",
    "Explain the forecast in clear business language for a retail manager.",
    "Keep the response under 120 words.",
    "Mention demand change versus historical average, risk from the confidence interval, and one inventory action.",
    "",
    `Product: ${payload.item}`,
    `Store: ${payload.store || "All Stores"}`,
    `Forecast month: ${payload.monthName || "Upcoming period"} ${payload.year || ""}`.trim(),
    `Forecast units: ${payload.predictedSales}`,
    `Historical average: ${payload.historicalAverage ?? "Unknown"}`,
    `Confidence interval: ${payload.lowerBound} - ${payload.upperBound}`,
    `Peak seasonal month: ${payload.topSeasonMonth || "Unknown"}`,
    payload.accuracy?.mape !== undefined ? `MAPE: ${payload.accuracy.mape}` : "",
    payload.accuracy?.bias !== undefined ? `Bias: ${payload.accuracy.bias}` : "",
  ].filter(Boolean).join("\n");
}

function buildInventoryAdviceFallback(payload) {
  if (payload.type === "reorder") {
    const recommendedOrder = toNumber(payload.recommendedOrderQuantity);
    const reorderPoint = toNumber(payload.reorderPoint);
    const currentStock = toNumber(payload.currentStock);
    const safetyStock = toNumber(payload.safetyStock);
    const stockoutRisk = payload.stockoutRisk || "Unknown";

    const actions = [];
    if (recommendedOrder > 0) {
      actions.push(`Place an order for about ${recommendedOrder} units to move stock back above the reorder point of ${reorderPoint}.`);
    } else {
      actions.push("No immediate reorder is required based on the current assumptions.");
    }

    if (stockoutRisk === "High") {
      actions.push("Stockout risk is high, so replenishment should be prioritized before the next sales cycle.");
    } else if (stockoutRisk === "Medium") {
      actions.push("Stockout risk is moderate, so monitor sell-through closely and prepare a replenishment order.");
    } else {
      actions.push("Current stock coverage is relatively healthy under the forecasted demand range.");
    }

    if (currentStock < reorderPoint) {
      actions.push(`Current stock of ${currentStock} units is below the reorder point, which supports immediate action.`);
    }

    if (safetyStock > 0) {
      actions.push(`Keep roughly ${safetyStock} units as safety stock to absorb forecast uncertainty.`);
    }

    return actions.join(" ");
  }

  const summary = payload.summary || {};
  const topRiskItems = Array.isArray(payload.items)
    ? payload.items.filter((item) => item.inventoryRisk === "Stockout").slice(0, 3)
    : [];
  const overstockItems = Array.isArray(payload.items)
    ? payload.items.filter((item) => item.inventoryRisk === "Overstock").slice(0, 2)
    : [];

  const parts = [
    `${summary.stockoutItems || 0} items are currently flagged for stockout risk and ${summary.overstockItems || 0} items show overstock pressure.`,
  ];

  if (topRiskItems.length > 0) {
    parts.push(`Prioritize replenishment for ${topRiskItems.map((item) => item.item).join(", ")}.`);
  }

  if (overstockItems.length > 0) {
    parts.push(`Review slower-moving inventory for ${overstockItems.map((item) => item.item).join(", ")} before placing additional orders.`);
  }

  if ((summary.balancedItems || 0) > 0) {
    parts.push(`${summary.balancedItems} items remain within the expected planning band and can stay on the current replenishment cadence.`);
  }

  return parts.join(" ");
}

function buildInventoryAdvicePrompt(payload) {
  const header = [
    "You are a retail inventory advisor.",
    "Explain the planning result in concise business language.",
    "Keep the response under 120 words.",
    "Mention the main stock risk and one action.",
    "",
  ];

  if (payload.type === "reorder") {
    return header.concat([
      `Product: ${payload.item}`,
      `Store: ${payload.store || "All Stores"}`,
      `Month: ${payload.monthName || ""} ${payload.year || ""}`.trim(),
      `Forecast units: ${payload.predictedSales}`,
      `Current stock: ${payload.currentStock}`,
      `Reorder point: ${payload.reorderPoint}`,
      `Recommended order: ${payload.recommendedOrderQuantity}`,
      `Safety stock: ${payload.safetyStock}`,
      `Stockout risk: ${payload.stockoutRisk}`,
    ]).join("\n");
  }

  return header.concat([
    `Store: ${payload.store || "All Stores"}`,
    `Month: ${payload.monthName || ""} ${payload.year || ""}`.trim(),
    `Stockout items: ${payload.summary?.stockoutItems || 0}`,
    `Overstock items: ${payload.summary?.overstockItems || 0}`,
    `Balanced items: ${payload.summary?.balancedItems || 0}`,
    `Highest-risk items: ${(payload.items || []).slice(0, 5).map((item) => `${item.item} (${item.inventoryRisk})`).join(", ")}`,
  ]).join("\n");
}

async function requestOpenAIInsight(payload) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: payload.__promptOverride || buildPrompt(payload),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(`OpenAI request failed: ${response.status} ${errorText}`);
    error.status = 502;
    throw error;
  }

  const data = await response.json();
  return data.output_text?.trim() || null;
}

function normalizeQuestion(question) {
  return String(question || "").trim().toLowerCase();
}

function tokenizeQuestion(question) {
  return normalizeQuestion(question)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function detectQueryIntent(question) {
  const normalized = normalizeQuestion(question);
  const tokens = tokenizeQuestion(question);
  const hasAny = (phrases) => phrases.some((phrase) => normalized.includes(phrase));
  const hasToken = (token) => tokens.includes(token);

  if (!normalized) {
    return "unknown";
  }

  if (
    hasAny(["which product", "what product", "top product", "best product"]) &&
    hasAny(["sell the most", "highest demand", "top demand", "most demand", "top seller"])
  ) {
    return "top_product_next_month";
  }

  if (
    hasAny(["which store", "what store", "top store"]) &&
    hasAny(["highest demand", "sell the most", "top demand", "most demand"])
  ) {
    return "top_store_recent";
  }

  if (
    hasToken("why") &&
    hasAny(["sales increasing", "sales rising", "sales up", "demand increasing", "demand rising", "going up"])
  ) {
    return "why_item_increasing";
  }

  if (
    hasAny([
      "what should i stock",
      "what should we stock",
      "stock more",
      "replenish more",
      "what should i order",
      "what should we order",
      "buy more",
      "increase inventory",
      "increase stock",
    ])
  ) {
    return "stock_more_next_month";
  }

  if (hasAny(["explain forecast", "explain the forecast", "summarize forecast", "forecast summary"])) {
    return "forecast_summary";
  }

  return "general";
}

function resolveTimeWindow(question) {
  const normalized = normalizeQuestion(question);
  const now = new Date();

  if (normalized.includes("next month") || normalized.includes("upcoming month")) {
    return now.getMonth() === 11
      ? { month: 1, year: now.getFullYear() + 1, label: "next month" }
      : { month: now.getMonth() + 2, year: now.getFullYear(), label: "next month" };
  }

  return { month: now.getMonth() + 1, year: now.getFullYear(), label: "current forecast month" };
}

async function rankProductsForNextMonth(store) {
  const catalog = await fetchCatalog();
  const { month: startMonth, year: startYear } = resolveTimeWindow("next month");

  const forecasts = await Promise.all(
    catalog.items.map(async (item) => {
      const result = await fetchForecast({
        item,
        store: store || undefined,
        start_month: startMonth,
        start_year: startYear,
        horizon: 1,
      });
      return {
        item,
        forecast: result.forecast?.[0]?.predicted_sales || 0,
      };
    })
  );

  return forecasts.sort((left, right) => right.forecast - left.forecast);
}

async function rankStoresByRecentDemand() {
  const catalog = await fetchCatalog();
  const storeSummaries = await Promise.all(
    catalog.stores.map(async (store) => {
      const history = await fetchSalesHistory({ store, months: 6 });
      const total = (history.history || []).reduce((sum, row) => sum + toNumber(row.sales), 0);
      return { store, total };
    })
  );

  return storeSummaries.sort((left, right) => right.total - left.total);
}

async function explainWhyItemIncreasing(question, itemHint) {
  const catalog = await fetchCatalog();
  const analytics = await fetchAnalytics();
  const normalizedQuestion = normalizeQuestion(question);
  const matchedItem = itemHint
    || catalog.items.find((item) => normalizedQuestion.includes(item.toLowerCase()))
    || catalog.items[0];

  const history = await fetchSalesHistory({ item: matchedItem, months: 12 });
  const points = history.history || [];
  const recent = points.slice(-3);
  const previous = points.slice(-6, -3);
  const recentAvg = recent.length ? recent.reduce((sum, row) => sum + toNumber(row.sales), 0) / recent.length : 0;
  const previousAvg = previous.length ? previous.reduce((sum, row) => sum + toNumber(row.sales), 0) / previous.length : 0;
  const delta = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;

  return {
    answer: `${matchedItem} sales are trending up because the recent 3-month average is about ${Math.abs(delta).toFixed(0)}% ${delta >= 0 ? "above" : "below"} the prior 3-month period. This category also aligns with seasonal demand patterns, and the overall dataset peaks around ${analytics.highest_demand_month}. Review inventory before the next seasonal spike.`,
    supportingData: {
      item: matchedItem,
      recentAverage: Math.round(recentAvg),
      previousAverage: Math.round(previousAvg),
      peakMonth: analytics.highest_demand_month,
    },
  };
}

async function buildQueryContext({ intent, question, item, store }) {
  const timeWindow = resolveTimeWindow(question);

  if (intent === "top_product_next_month" || intent === "stock_more_next_month") {
    const ranked = await rankProductsForNextMonth(store);
    const top = ranked[0];
    const secondary = ranked.slice(1, 4);

    return {
      intent,
      computedAnswer: intent === "stock_more_next_month"
        ? `Increase stock for ${top.item} first. It has the highest forecast at ${top.forecast} units.`
        : `${top.item} has the highest predicted demand at ${top.forecast} units.`,
      context: {
        timeWindow,
        store: store || "All Stores",
        rankedProducts: ranked.slice(0, 5),
      },
      fallbackAnswer: intent === "stock_more_next_month"
        ? `Based on the ${timeWindow.label} forecast, increase stock first for ${top.item}. It leads projected demand at about ${top.forecast} units, followed by ${secondary.map((row) => `${row.item} (${row.forecast})`).join(", ")}.`
        : `${top.item} is forecast to sell the most in the ${timeWindow.label} at about ${top.forecast} units. The next highest-demand products are ${secondary.map((row) => `${row.item} (${row.forecast})`).join(", ")}.`,
    };
  }

  if (intent === "top_store_recent") {
    const rankedStores = await rankStoresByRecentDemand();
    const topStore = rankedStores[0];
    return {
      intent,
      computedAnswer: `${topStore.store} has the highest recent demand.`,
      context: { rankedStores: rankedStores.slice(0, 5) },
      fallbackAnswer: `${topStore.store} currently has the highest recent demand based on the last 6 months, with about ${topStore.total} total units sold across the catalog.`,
    };
  }

  if (intent === "why_item_increasing") {
    const explanation = await explainWhyItemIncreasing(question, item);
    return {
      intent,
      computedAnswer: explanation.answer,
      context: explanation.supportingData,
      fallbackAnswer: explanation.answer,
    };
  }

  if (intent === "forecast_summary") {
    const ranked = await rankProductsForNextMonth(store);
    const top = ranked[0];
    return {
      intent,
      computedAnswer: `${top.item} leads the near-term forecast.`,
      context: {
        timeWindow,
        rankedProducts: ranked.slice(0, 5),
      },
      fallbackAnswer: `${top.item} leads the current forecast window at about ${top.forecast} units. Use the forecast and confidence range to prioritize replenishment decisions.`,
    };
  }

  const analytics = await fetchAnalytics();
  const catalog = await fetchCatalog();
  const ranked = await rankProductsForNextMonth(store);
  const top = ranked[0];

  return {
    intent: "general",
    computedAnswer: `${top.item} is the strongest upcoming product by forecast.`,
    context: {
      totalProducts: catalog.items.length,
      totalStores: catalog.stores.length,
      highestDemandMonth: analytics.highest_demand_month,
      topSellingProduct: analytics.top_selling_product,
      rankedProducts: ranked.slice(0, 3),
      store: store || "All Stores",
      timeWindow,
    },
    fallbackAnswer: `${top.item} is the strongest product in the ${timeWindow.label} forecast at about ${top.forecast} units. The dataset currently covers ${catalog.items.length} products and ${catalog.stores.length} stores, with peak seasonal demand in ${analytics.highest_demand_month}.`,
  };
}

function buildQueryPrompt(question, context) {
  return [
    "You are a retail analytics assistant.",
    "Answer the user's question using the provided retail forecast context.",
    "Keep the answer concise, business-focused, and under 120 words.",
    "Do not give a generic dataset summary unless the question explicitly asks for one.",
    "Use the computed answer first, then add one short business action or implication.",
    "",
    `Question: ${question}`,
    `Intent: ${context.intent}`,
    `Computed answer: ${context.computedAnswer}`,
    `Supporting context: ${JSON.stringify(context.context)}`,
  ].join("\n");
}

function parseCsvLines(csvContent) {
  const lines = String(csvContent || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { headers: [], rows: [] };
  }

  const headers = lines[0].split(",").map((part) => part.trim());
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",").map((part) => part.trim());
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });

  return { headers, rows };
}

function requestOpenAIWithPrompt(prompt) {
  return requestOpenAIInsight({ __promptOverride: prompt });
}

function buildDataQualityFallback({ fileName, csvContent }) {
  const { headers, rows } = parseCsvLines(csvContent);
  const issues = [];
  const requiredColumns = ["date", "store", "item", "sales"];
  const missingColumns = requiredColumns.filter((column) => !headers.includes(column));

  if (missingColumns.length > 0) {
    issues.push(`Missing required columns: ${missingColumns.join(", ")}.`);
  }

  const duplicateKeys = new Set();
  let duplicates = 0;
  let missingSales = 0;
  let invalidDates = 0;
  let negativeSales = 0;

  rows.forEach((row) => {
    const key = `${row.date}|${row.store}|${row.item}`;
    if (duplicateKeys.has(key)) {
      duplicates += 1;
    } else {
      duplicateKeys.add(key);
    }

    if (row.sales === "" || row.sales === undefined) {
      missingSales += 1;
    }

    if (row.date && Number.isNaN(Date.parse(row.date))) {
      invalidDates += 1;
    }

    if (toNumber(row.sales, 0) < 0) {
      negativeSales += 1;
    }
  });

  if (missingSales > 0) {
    issues.push(`Detected ${missingSales} row(s) with missing sales values.`);
  }
  if (duplicates > 0) {
    issues.push(`Detected ${duplicates} duplicate date-store-item record(s).`);
  }
  if (invalidDates > 0) {
    issues.push(`Detected ${invalidDates} row(s) with invalid dates.`);
  }
  if (negativeSales > 0) {
    issues.push(`Detected ${negativeSales} row(s) with negative sales values.`);
  }
  if (issues.length === 0) {
    issues.push("No major structural issues detected in the uploaded retail CSV.");
  }

  return {
    summary: `Reviewed ${rows.length} rows from ${fileName || "uploaded.csv"}.`,
    issues,
    source: "fallback",
  };
}

function buildReportFallback(payload) {
  const forecast = payload.forecast || [];
  const prediction = payload.prediction || null;
  const topRows = forecast.slice(0, 3);
  const strongest = [...forecast].sort((left, right) => toNumber(right.predicted_sales) - toNumber(left.predicted_sales))[0];
  const parts = [];

  if (prediction) {
    parts.push(`${prediction.item} is expected to reach about ${prediction.predicted_sales} units in ${prediction.month_name} ${prediction.year}, with a planning range of ${prediction.lower_bound}-${prediction.upper_bound}.`);
  }

  if (topRows.length > 0) {
    parts.push(`The next forecast periods are ${topRows.map((row) => `${row.month}: ${row.predicted_sales}`).join(", ")}.`);
  }

  if (strongest) {
    parts.push(`The strongest month in the current forecast horizon is ${strongest.month}.`);
  }

  parts.push("Inventory planning should prioritize products with rising demand and review safety stock where confidence bands widen.");
  return parts.join(" ");
}

function buildStoryFallback(payload) {
  const history = payload.history || [];
  const recent = history.slice(-4);
  const earlier = history.slice(-8, -4);
  const recentAvg = recent.length ? recent.reduce((sum, row) => sum + toNumber(row.sales), 0) / recent.length : 0;
  const earlierAvg = earlier.length ? earlier.reduce((sum, row) => sum + toNumber(row.sales), 0) / earlier.length : 0;
  const delta = earlierAvg > 0 ? ((recentAvg - earlierAvg) / earlierAvg) * 100 : 0;
  const topMonth = [...history].sort((left, right) => toNumber(right.sales) - toNumber(left.sales))[0];

  return `${payload.item || "This product"} shows ${delta >= 0 ? "rising" : "softening"} demand, with the recent trend running about ${Math.abs(delta).toFixed(0)}% ${delta >= 0 ? "above" : "below"} the prior comparison period. ${topMonth ? `The strongest observed month in the loaded history is ${topMonth.month} at ${topMonth.sales} units.` : ""} Use this pattern to plan inventory before the next seasonal build-up.`;
}

function buildMetricExplanationFallback(payload) {
  const metrics = payload.metrics || {};
  const mape = toNumber(metrics.mape);
  const rmse = toNumber(metrics.rmse);
  const bias = toNumber(metrics.bias);
  const parts = [];

  if (mape > 20) {
    parts.push(`Model accuracy is currently weak with MAPE around ${mape.toFixed(1)}%, so forecasts should be treated cautiously.`);
  } else if (mape > 10) {
    parts.push(`Model accuracy is moderate with MAPE around ${mape.toFixed(1)}%, which is usable for planning with some caution.`);
  } else {
    parts.push(`Model accuracy is relatively strong with MAPE around ${mape.toFixed(1)}%.`);
  }

  parts.push(`RMSE is ${rmse.toFixed(1)}, which reflects the impact of larger misses.`);

  if (Math.abs(bias) > 10) {
    parts.push(`Bias of ${bias.toFixed(1)} suggests the model is systematically ${bias > 0 ? "over-forecasting" : "under-forecasting"} demand.`);
  } else {
    parts.push(`Bias is close to neutral at ${bias.toFixed(1)}, so the model is not strongly skewed in one direction.`);
  }

  return parts.join(" ");
}

function buildChatFallback(payload) {
  const latest = payload.messages?.[payload.messages.length - 1]?.content || payload.question || "";
  return answerRetailQuery({
    question: latest,
    item: payload.item,
    store: payload.store,
    disableOpenAI: true,
  });
}

function chatCollection() {
  return getDatabase().collection("ai_chat_threads");
}

async function getOrCreateChatThread(accountId) {
  const collection = chatCollection();
  const existing = await collection.findOne({ accountId });
  if (existing) {
    return existing;
  }

  const starterMessages = [
    {
      role: "assistant",
      content: "Ask Forecast AI about demand, inventory, or store performance.",
      createdAt: new Date().toISOString(),
    },
  ];

  await collection.insertOne({
    accountId,
    messages: starterMessages,
    updatedAt: new Date().toISOString(),
  });

  return collection.findOne({ accountId });
}

async function requestOpenAIQueryAnswer(question, context) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: buildQueryPrompt(question, context),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(`OpenAI request failed: ${response.status} ${errorText}`);
    error.status = 502;
    throw error;
  }

  const data = await response.json();
  return data.output_text?.trim() || null;
}

export async function generateForecastInsight(payload) {
  if (!payload?.item || payload?.predictedSales === undefined) {
    const error = new Error("Insight generation requires item and predictedSales.");
    error.status = 400;
    throw error;
  }

  try {
    const insight = await requestOpenAIInsight(payload);
    if (insight) {
      return {
        insight,
        source: "openai",
      };
    }
  } catch (error) {
    if (process.env.OPENAI_API_KEY) {
      console.warn("Falling back to heuristic AI insight:", error.message);
    }
  }

  return {
    insight: buildFallbackInsight(payload),
    source: "fallback",
  };
}

export async function generateInventoryAdvice(payload) {
  if (!payload?.type) {
    const error = new Error("Inventory advice requires a type.");
    error.status = 400;
    throw error;
  }

  try {
    const insight = await requestOpenAIInsight({
      ...payload,
      __promptOverride: buildInventoryAdvicePrompt(payload),
    });
    if (insight) {
      return {
        insight,
        source: "openai",
      };
    }
  } catch (error) {
    if (process.env.OPENAI_API_KEY) {
      console.warn("Falling back to heuristic inventory advice:", error.message);
    }
  }

  return {
    insight: buildInventoryAdviceFallback(payload),
    source: "fallback",
  };
}

export async function answerRetailQuery({ question, item, store, disableOpenAI = false }) {
  const normalizedQuestion = normalizeQuestion(question);
  if (!normalizedQuestion) {
    const error = new Error("Question is required.");
    error.status = 400;
    throw error;
  }

  const initialIntent = detectQueryIntent(normalizedQuestion);
  const resolved = await buildQueryContext({
    intent: initialIntent,
    question: normalizedQuestion,
    item,
    store,
  });
  const promptContext = {
    intent: resolved.intent,
    computedAnswer: resolved.computedAnswer,
    context: resolved.context,
  };

  if (!disableOpenAI) {
    try {
      const answer = await requestOpenAIQueryAnswer(question, promptContext);
      if (answer) {
        return {
          answer,
          source: "openai",
          intent: resolved.intent,
          context: resolved.context,
        };
      }
    } catch (error) {
      if (process.env.OPENAI_API_KEY) {
        console.warn("Falling back to heuristic retail query answer:", error.message);
      }
    }
  }

  return {
    answer: resolved.fallbackAnswer,
    source: "fallback",
    intent: resolved.intent,
    context: resolved.context,
  };
}

export async function analyzeDataQuality({ fileName, csvContent }) {
  if (!String(csvContent || "").trim()) {
    const error = new Error("csvContent is required.");
    error.status = 400;
    throw error;
  }

  const fallback = buildDataQualityFallback({ fileName, csvContent });
  const prompt = [
    "You are a retail data quality assistant.",
    "Review the uploaded CSV summary and explain the key data quality issues in under 120 words.",
    `File: ${fileName || "uploaded.csv"}`,
    `Summary: ${JSON.stringify(fallback)}`,
  ].join("\n");

  try {
    const insight = await requestOpenAIWithPrompt(prompt);
    if (insight) {
      return { ...fallback, summary: insight, source: "openai" };
    }
  } catch (error) {
    if (process.env.OPENAI_API_KEY) {
      console.warn("Falling back to heuristic data quality analysis:", error.message);
    }
  }

  return fallback;
}

export async function generateForecastReport(payload) {
  const fallback = buildReportFallback(payload);
  const prompt = [
    "You are a retail forecast reporting assistant.",
    "Generate a concise monthly demand forecast report for a retail manager.",
    "Keep it under 140 words and include operational guidance.",
    `Context: ${JSON.stringify(payload)}`,
  ].join("\n");

  try {
    const insight = await requestOpenAIWithPrompt(prompt);
    if (insight) {
      return { report: insight, source: "openai" };
    }
  } catch (error) {
    if (process.env.OPENAI_API_KEY) {
      console.warn("Falling back to heuristic report generation:", error.message);
    }
  }

  return { report: fallback, source: "fallback" };
}

export async function generateDemandStory(payload) {
  const fallback = buildStoryFallback(payload);
  const prompt = [
    "You are a retail trend storytelling assistant.",
    "Summarize the demand pattern in simple business language.",
    "Keep it under 120 words.",
    `Context: ${JSON.stringify(payload)}`,
  ].join("\n");

  try {
    const insight = await requestOpenAIWithPrompt(prompt);
    if (insight) {
      return { story: insight, source: "openai" };
    }
  } catch (error) {
    if (process.env.OPENAI_API_KEY) {
      console.warn("Falling back to heuristic demand storytelling:", error.message);
    }
  }

  return { story: fallback, source: "fallback" };
}

export async function explainForecastMetrics(payload) {
  const fallback = buildMetricExplanationFallback(payload);
  const prompt = [
    "You are a forecasting metrics assistant.",
    "Explain the model metrics in plain English for a retail manager.",
    "Keep it under 120 words.",
    `Context: ${JSON.stringify(payload)}`,
  ].join("\n");

  try {
    const insight = await requestOpenAIWithPrompt(prompt);
    if (insight) {
      return { explanation: insight, source: "openai" };
    }
  } catch (error) {
    if (process.env.OPENAI_API_KEY) {
      console.warn("Falling back to heuristic metric explanation:", error.message);
    }
  }

  return { explanation: fallback, source: "fallback" };
}

export async function getForecastChatHistory(accountId) {
  if (!accountId) {
    const error = new Error("accountId is required for chat history.");
    error.status = 400;
    throw error;
  }

  const thread = await getOrCreateChatThread(accountId);
  return {
    messages: thread.messages || [],
  };
}

export async function clearForecastChatHistory(accountId) {
  if (!accountId) {
    const error = new Error("accountId is required to clear chat history.");
    error.status = 400;
    throw error;
  }

  const collection = chatCollection();
  const starterMessages = [
    {
      role: "assistant",
      content: "Ask Forecast AI about demand, inventory, or store performance.",
      createdAt: new Date().toISOString(),
    },
  ];

  await collection.updateOne(
    { accountId },
    {
      $set: {
        messages: starterMessages,
        updatedAt: new Date().toISOString(),
      },
    },
    { upsert: true }
  );

  return { messages: starterMessages };
}

export async function runForecastChat(payload) {
  if (!Array.isArray(payload.messages) || payload.messages.length === 0) {
    const error = new Error("messages are required for chat.");
    error.status = 400;
    throw error;
  }

  const fallback = await buildChatFallback(payload);
  const prompt = [
    "You are Forecast AI, a conversational retail planning assistant.",
    "Answer the user's latest question using the conversation history and context.",
    "Be concise and business-focused.",
    `Conversation: ${JSON.stringify(payload.messages)}`,
    `Context item: ${payload.item || "All Items"}`,
    `Context store: ${payload.store || "All Stores"}`,
    payload.reportContext ? `Forecast report context: ${JSON.stringify(payload.reportContext)}` : "",
  ].join("\n");

  let answer = fallback.answer;
  let source = "fallback";

  try {
    const insight = await requestOpenAIWithPrompt(prompt);
    if (insight) {
      answer = insight;
      source = "openai";
    }
  } catch (error) {
    if (process.env.OPENAI_API_KEY) {
      console.warn("Falling back to heuristic chat answer:", error.message);
    }
  }

  if (payload.accountId) {
    const collection = chatCollection();
    const persistedMessages = [
      ...payload.messages.map((message) => ({
        role: message.role,
        content: message.content,
        createdAt: message.createdAt || new Date().toISOString(),
      })),
      {
        role: "assistant",
        content: answer,
        createdAt: new Date().toISOString(),
      },
    ];

    await collection.updateOne(
      { accountId: payload.accountId },
      {
        $set: {
          messages: persistedMessages,
          updatedAt: new Date().toISOString(),
        },
      },
      { upsert: true }
    );
  }

  return { answer, source };
}
