import {
  analyzeDataQuality,
  answerRetailQuery,
  clearForecastChatHistory,
  explainForecastMetrics,
  getForecastChatHistory,
  generateDemandStory,
  generateForecastInsight,
  generateForecastReport,
  generateInventoryAdvice,
  runForecastChat,
} from "../services/ai.service.js";

export async function postForecastInsight(req, res, next) {
  try {
    const result = await generateForecastInsight(req.body || {});
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function postInventoryAdvice(req, res, next) {
  try {
    const result = await generateInventoryAdvice(req.body || {});
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function postRetailQuery(req, res, next) {
  try {
    const result = await answerRetailQuery(req.body || {});
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function postDataQuality(req, res, next) {
  try {
    const result = await analyzeDataQuality(req.body || {});
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function postForecastReport(req, res, next) {
  try {
    const result = await generateForecastReport(req.body || {});
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function postDemandStory(req, res, next) {
  try {
    const result = await generateDemandStory(req.body || {});
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function postMetricExplanation(req, res, next) {
  try {
    const result = await explainForecastMetrics(req.body || {});
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function postForecastChat(req, res, next) {
  try {
    const result = await runForecastChat({
      ...(req.body || {}),
      accountId: req.account?.id,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getChatHistory(req, res, next) {
  try {
    const result = await getForecastChatHistory(req.account?.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteChatHistory(req, res, next) {
  try {
    const result = await clearForecastChatHistory(req.account?.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
