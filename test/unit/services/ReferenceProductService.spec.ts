import ReferenceProduct, {
  ReferenceProductDocument,
} from "../../../src/models/ReferenceProduct";
import {
  getReferenceProducts,
  insertReferenceProducts,
} from "../../../src/services/ReferenceProductService";
import mongoose from "mongoose";

describe("ReferenceProductService", () => {
  describe("insertReferenceProducts", () => {
    it("should insert multiple reference products successfully", async () => {
      const products = [
        { name: "Product 1", brand: "Brand A" },
        { name: "Product 2", brand: "Brand B" },
      ] as unknown as Partial<ReferenceProductDocument>[];

      const inserted = await insertReferenceProducts(products);

      expect(inserted).toHaveLength(2);
      expect(inserted[0]).toHaveProperty("_id");
      expect(inserted[1].name).toBe("Product 2");
    });

    it("should throw an error if invalid product is inserted", async () => {
      const invalidProducts = [
        { invalidField: "no name or brand" },
      ] as unknown as Partial<ReferenceProductDocument>[];

      await expect(insertReferenceProducts(invalidProducts)).rejects.toThrow();
    });
  });

  describe("getReferenceProducts", () => {
    it("should retrieve products by IDs", async () => {
      const products = await ReferenceProduct.insertMany([
        { name: "Product X", brand: "Brand X" },
        { name: "Product Y", brand: "Brand Y" },
      ]);

      const ids = products.map((product) => product._id.toString());

      const foundProducts = await getReferenceProducts(ids);

      expect(foundProducts).toHaveLength(2);
      const names = foundProducts.map((p) => p.name);
      expect(names).toContain("Product X");
      expect(names).toContain("Product Y");
    });

    it("should return empty array if IDs do not match", async () => {
      const foundProducts = await getReferenceProducts([
        new mongoose.Types.ObjectId().toHexString(),
      ]);
      expect(foundProducts).toHaveLength(0);
    });

    it("should handle empty array input gracefully", async () => {
      const foundProducts = await getReferenceProducts([]);
      expect(foundProducts).toHaveLength(0);
    });
  });
});
