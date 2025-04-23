import mongoose, { Connection } from "mongoose";
import dotenv from "dotenv";
import path from "path";

const envPath = [
  path.resolve(process.cwd(), `.env.${process.env.NODE_ENV ?? "local"}`),
  path.resolve(process.cwd(), ".env"),
];
dotenv.config({ path: envPath });

class DatabaseConnectionFactory {
  private static cachedConnection: Connection | null = null;

  static async getDatabaseConnection(): Promise<Connection | undefined> {
    if (this.cachedConnection && this.cachedConnection.readyState === 1) {
      return this.cachedConnection;
    }

    const isTest = process.env.NODE_ENV === "test";
    if (isTest) {
      return;
    }

    const uriArray = process.env.MONGODB_URI!.split("/?");
    const url = `${uriArray[0]}/${process.env.MONGODB_DATABASE!}${
      uriArray.length >= 2 ? `?${uriArray[1]}` : ""
    }`;

    try {
      await mongoose.connect(url, {
        autoCreate: false,
      });
      this.cachedConnection = mongoose.connection;
      global.logger.info("MongoDB connection established");
    } catch (error) {
      global.logger.error(error, "Error connecting to MongoDB:");
      throw error;
    }

    return mongoose.connection!;
  }

  static async closeConnection(): Promise<void> {
    try {
      await mongoose.disconnect();
      global.logger.info("MongoDB connection closed");
      this.cachedConnection = null;
    } catch (error) {
      global.logger.error(error, "Error closing MongoDB connection:");
      throw error;
    }
  }
}

export default DatabaseConnectionFactory;
