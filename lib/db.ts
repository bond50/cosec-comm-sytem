import fs from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

function getGeneratedSchemaVersion() {
  try {
    const clientDir = path.dirname(
      require.resolve("@prisma/client/package.json"),
    );
    const schemaPath = path.join(
      clientDir,
      "..",
      "..",
      ".prisma",
      "client",
      "schema.prisma",
    );

    return fs.statSync(schemaPath).mtimeMs;
  } catch {
    return 0;
  }
}

const prismaClientSingleton = () => {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
  prismaGlobalSchemaVersion?: number;
} & typeof global;

const generatedSchemaVersion = getGeneratedSchemaVersion();

const shouldCreateNewClient =
  !globalThis.prismaGlobal ||
  globalThis.prismaGlobalSchemaVersion !== generatedSchemaVersion;

export const db = shouldCreateNewClient
  ? prismaClientSingleton()
  : globalThis.prismaGlobal;

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = db;
  globalThis.prismaGlobalSchemaVersion = generatedSchemaVersion;
}
