import { PrismaClient } from "@prisma/client";
import { config, sanitizeDatabaseUrl } from "../config";

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const activeUrl = sanitizeDatabaseUrl(process.env.DATABASE_URL || config.databaseUrl);
process.env.DATABASE_URL = activeUrl;

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    datasources: {
      db: {
        url: activeUrl,
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
