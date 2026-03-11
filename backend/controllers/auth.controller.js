import {
  getAccountFromToken,
  loginStoreAccount,
  logoutStoreAccount,
  registerStoreAccount,
} from "../services/auth.service.js";

function extractBearerToken(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim();
}

export async function register(req, res, next) {
  try {
    const result = await registerStoreAccount(req.body || {});
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const result = await loginStoreAccount(req.body || {});
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function me(req, res, next) {
  try {
    const token = extractBearerToken(req);
    const account = await getAccountFromToken(token);

    if (!account) {
      const error = new Error("Authentication required.");
      error.status = 401;
      throw error;
    }

    res.json({ account });
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    const token = extractBearerToken(req);
    await logoutStoreAccount(token);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
