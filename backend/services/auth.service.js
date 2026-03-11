import crypto from "crypto";
import { ObjectId } from "mongodb";
import { getDatabase } from "./mongo.service.js";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function publicAccount(account) {
  return {
    id: String(account._id),
    storeName: account.storeName,
    email: account.email,
    contactName: account.contactName,
    createdAt: account.createdAt,
  };
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

function verifyPassword(password, salt, expectedHash) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(expectedHash, "hex"));
}

function validateRegistrationInput({ storeName, email, password, contactName }) {
  if (!String(storeName || "").trim()) {
    const error = new Error("Store name is required.");
    error.status = 400;
    throw error;
  }

  if (!normalizeEmail(email) || !normalizeEmail(email).includes("@")) {
    const error = new Error("A valid email is required.");
    error.status = 400;
    throw error;
  }

  if (String(password || "").length < 8) {
    const error = new Error("Password must be at least 8 characters.");
    error.status = 400;
    throw error;
  }

  if (!String(contactName || "").trim()) {
    const error = new Error("Contact name is required.");
    error.status = 400;
    throw error;
  }
}

function collections(db) {
  return {
    accounts: db.collection("store_accounts"),
    sessions: db.collection("store_sessions"),
  };
}

async function createSession(db, accountId) {
  const { sessions } = collections(db);
  const token = crypto.randomBytes(24).toString("hex");

  await sessions.deleteMany({ accountId });
  await sessions.insertOne({
    token,
    accountId,
    createdAt: new Date().toISOString(),
  });

  return token;
}

export async function ensureAuthIndexes() {
  const db = getDatabase();
  const { accounts, sessions } = collections(db);

  await Promise.all([
    accounts.createIndex({ email: 1 }, { unique: true }),
    accounts.createIndex({ storeNameNormalized: 1 }, { unique: true }),
    sessions.createIndex({ token: 1 }, { unique: true }),
    sessions.createIndex({ accountId: 1 }, { unique: true }),
  ]);
}

export async function registerStoreAccount(payload) {
  validateRegistrationInput(payload);

  const db = getDatabase();
  const { accounts } = collections(db);
  const email = normalizeEmail(payload.email);
  const storeName = String(payload.storeName).trim();
  const storeNameNormalized = storeName.toLowerCase();

  const existing = await accounts.findOne({
    $or: [{ email }, { storeNameNormalized }],
  });

  if (existing?.email === email) {
    const error = new Error("An account with this email already exists.");
    error.status = 409;
    throw error;
  }

  if (existing?.storeNameNormalized === storeNameNormalized) {
    const error = new Error("A store account with this store name already exists.");
    error.status = 409;
    throw error;
  }

  const passwordRecord = hashPassword(String(payload.password));
  const account = {
    storeName,
    storeNameNormalized,
    email,
    contactName: String(payload.contactName).trim(),
    passwordSalt: passwordRecord.salt,
    passwordHash: passwordRecord.hash,
    createdAt: new Date().toISOString(),
  };

  const insertResult = await accounts.insertOne(account);
  const createdAccount = { ...account, _id: insertResult.insertedId };
  const token = await createSession(db, createdAccount._id);

  return {
    token,
    account: publicAccount(createdAccount),
  };
}

export async function loginStoreAccount({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !String(password || "")) {
    const error = new Error("Email and password are required.");
    error.status = 400;
    throw error;
  }

  const db = getDatabase();
  const { accounts } = collections(db);
  const account = await accounts.findOne({ email: normalizedEmail });

  if (!account || !verifyPassword(String(password), account.passwordSalt, account.passwordHash)) {
    const error = new Error("Invalid email or password.");
    error.status = 401;
    throw error;
  }

  const token = await createSession(db, account._id);

  return {
    token,
    account: publicAccount(account),
  };
}

export async function getAccountFromToken(token) {
  if (!token) {
    return null;
  }

  const db = getDatabase();
  const { accounts, sessions } = collections(db);
  const session = await sessions.findOne({ token });
  if (!session) {
    return null;
  }

  const accountId = typeof session.accountId === "string"
    ? new ObjectId(session.accountId)
    : session.accountId;
  const account = await accounts.findOne({ _id: accountId });
  return account ? publicAccount(account) : null;
}

export async function logoutStoreAccount(token) {
  if (!token) {
    return;
  }

  const db = getDatabase();
  const { sessions } = collections(db);
  await sessions.deleteOne({ token });
}
