// eslint-disable-next-line import/no-extraneous-dependencies
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";

let replSet: MongoMemoryReplSet;

beforeAll(async () => {
  // Initialize a replica set
  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1 }, // Single node for simplicity
  });

  const mongoUri = replSet.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await replSet.stop();
});
