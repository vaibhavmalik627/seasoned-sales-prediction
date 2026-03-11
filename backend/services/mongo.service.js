import { MongoClient } from "mongodb";

let client;
let database;

function getMongoConfig() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || "seasonal_demand_forecasting";

  if (!uri) {
    const error = new Error("MONGODB_URI is required to start the backend.");
    error.status = 500;
    throw error;
  }

  return { uri, dbName };
}

export async function connectToMongo() {
  if (database) {
    return database;
  }

  const { uri, dbName } = getMongoConfig();
  client = new MongoClient(uri);
  await client.connect();
  database = client.db(dbName);
  return database;
}

export function getDatabase() {
  if (!database) {
    throw new Error("MongoDB has not been connected yet.");
  }

  return database;
}

export async function closeMongoConnection() {
  if (client) {
    await client.close();
    client = null;
    database = null;
  }
}
