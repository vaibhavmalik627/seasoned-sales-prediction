import { getAccountFromToken } from "../services/auth.service.js";

function extractBearerToken(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim();
}

export async function requireAuth(req, res, next) {
  try {
    const token = extractBearerToken(req);
    const account = await getAccountFromToken(token);

    if (!account) {
      return res.status(401).json({ error: "Authentication required." });
    }

    req.account = account;
    req.authToken = token;
    return next();
  } catch (error) {
    return next(error);
  }
}
