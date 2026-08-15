import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & { mongooseCache?: MongooseCache };
const cached = globalForMongoose.mongooseCache ?? { conn: null, promise: null };
globalForMongoose.mongooseCache = cached;

export async function connectMongoDB() {
  if (cached.conn) return cached.conn;
  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI environment variable");
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { dbName: "mabrig_academic" });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
