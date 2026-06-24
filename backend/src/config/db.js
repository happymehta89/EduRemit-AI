import mongoose from "mongoose";

let memoryServer = null;

/**
 * Connects to MongoDB.
 * - If MONGODB_URI is set in the environment, connects to that (e.g. Atlas).
 * - If not, spins up an in-memory MongoDB instance so the app runs
 *   out of the box for local development without any setup.
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI?.trim();

  if (uri) {
    await mongoose.connect(uri);
    console.log("[db] connected to MongoDB (configured URI)");
    return;
  }

  console.warn(
    "[db] MONGODB_URI not set — starting an in-memory MongoDB for local dev.\n" +
      "     Data will NOT persist across restarts. Set MONGODB_URI in .env\n" +
      "     (e.g. a free MongoDB Atlas cluster) before deploying or demoing."
  );

  const { MongoMemoryServer } = await import("mongodb-memory-server");
  memoryServer = await MongoMemoryServer.create();
  const memUri = memoryServer.getUri();
  await mongoose.connect(memUri);
  console.log("[db] connected to in-memory MongoDB");
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
