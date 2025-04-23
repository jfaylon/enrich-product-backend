import dotenv from "dotenv";
import { mongoMigrateCli } from "mongo-migrate-ts";
import "../src/utils/logger";

dotenv.config({ path: [".env"] });

mongoMigrateCli({
  uri: `${process.env.MONGODB_URI!}`,
  database: `${process.env.MONGODB_DATABASE!}`,
  migrationsDir: `${__dirname}/migrations`,
  migrationsCollection: "migrations_collection",
  migrationNameTimestampFormat: "T",
});
