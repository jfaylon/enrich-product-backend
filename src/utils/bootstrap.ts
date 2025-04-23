import "./logger";
import DatabaseConnectionFactory from "./database";

(async () => {
  await DatabaseConnectionFactory.getDatabaseConnection(); // runs once per cold start
})();
