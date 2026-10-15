import { PrismaClient } from "@prisma/client";
import { config } from "../config";

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function resolveDatabaseUrl(): string {
  let url = process.env.DATABASE_URL || config.databaseUrl;
  const isLocal = /localhost|127\.0\.0\.1/.test(url);
  if (!isLocal && !url.includes("sslmode=")) {
    url += (url.includes("?") ? "&" : "?") + "sslmode=require";
  }
  return url;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    datasources: {
      db: {
        url: resolveDatabaseUrl(),
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
