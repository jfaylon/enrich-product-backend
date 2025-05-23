import "../../src/utils/logger";
import fs from "fs";
import zlib from "zlib";
import csv from "csv-parser";
import { pipeline } from "stream/promises";
import { Writable } from "stream";

import { embedAndSaveStream } from "../../src/utils/embedAndSaveStream";
import { initQdrantCollection } from "../../src/services/QdrantService";
import DatabaseConnectionFactory from "../../src/utils/database";
import { MigrationInterface } from "mongo-migrate-ts";
import { consumeStream } from "../../src/utils";

export class Seed1745309084133 implements MigrationInterface {
  public async up(): Promise<void | never> {
    await DatabaseConnectionFactory.getDatabaseConnection();
    await initQdrantCollection();

    logger.info("Seeded amazonproducts.csv");

    const seedAmazonProducts = async () => {
      const loadAmazonCategories = (): Promise<Record<string, string>> => {
        const categoryMap: Record<string, string> = {};

        return new Promise((resolve, reject) => {
          fs.createReadStream("./seeds/amazoncategories.csv")
            .pipe(csv())
            .on("data", (row) => {
              const { id, category_name } = row;
              if (id && category_name) {
                categoryMap[id] = category_name;
              }
            })
            .on("end", () => resolve(categoryMap))
            .on("error", (err) => reject(err));
        });
      };

      const amazonCategories = await loadAmazonCategories();
      const amazonStream = fs
        .createReadStream("./seeds/amazonproducts.csv")
        .pipe(csv());

      // Seed both in series
      await pipeline(
        amazonStream,
        embedAndSaveStream(amazonCategories),
        consumeStream()
      );
    };

    const seedFoodProducts = async () => {
      const foodStream = fs
        .createReadStream("./seeds/foodproducts.csv.gz")
        .pipe(zlib.createGunzip())
        .pipe(csv({ separator: "\t" }));

      await pipeline(foodStream, embedAndSaveStream({}), consumeStream());
    };

    await seedAmazonProducts();
    logger.info("Seeded amazonproducts.csv");

    await seedFoodProducts();
    logger.info("Seeded foodproducts.csv.gz");
  }

  public async down(): Promise<void | never> {
    logger.info("No down migration defined for seeding");
  }
}
