// import fs from "fs";
// import zlib from "zlib";
// import csv from "csv-parser";
// import { embedAndSaveStream } from "./src/utils/embedAndSaveStream";
// import { initQdrantCollection } from "./src/services/QdrantService";
// import DatabaseConnectionFactory from "./src/utils/database";
// import "./src/utils/logger";
// import { Writable } from "stream";

// const consumeStream = new Writable({
//   objectMode: true,
//   write(_chunk, _encoding, callback) {
//     // no-op — just consuming to keep the flow
//     callback();
//   },
// });

// (async () => {
//   await DatabaseConnectionFactory.getDatabaseConnection(); // runs once per cold start
//   await initQdrantCollection();

//   await fs
//     .createReadStream("./seeds/amazonproducts.csv")
//     .pipe(csv({ separator: "\t" }))
//     .pipe(embedAndSaveStream)
//     .pipe(consumeStream)
//     .on("finish", () => {
//       logger.info("Processing finished!");
//       process.exit(0); // Exit process
//     })
//     .on("error", (err) => {
//       logger.error("Stream error:", err);
//       process.exit(1); // Exit with error code
//     });

//   await fs
//     .createReadStream("./seeds/foodproducts.csv.gz")
//     .pipe(zlib.createGunzip())
//     .setEncoding("utf8")
//     .pipe(csv({ separator: "\t" }))
//     .pipe(embedAndSaveStream)
//     .pipe(consumeStream)
//     .on("finish", () => {
//       logger.info("Processing finished!");
//       process.exit(0); // Exit process
//     })
//     .on("error", (err) => {
//       logger.error("Stream error:", err);
//       process.exit(1); // Exit with error code
//     });
// })();
