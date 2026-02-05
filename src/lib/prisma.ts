
import { PrismaClient } from "@prisma/client"

// Patch BigInt serialization for JSON.stringify
// This prevents "Do not know how to serialize a BigInt" errors
// @ts-ignore
BigInt.prototype.toJSON = function () {
    return this.toString()
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

// Fallback to dummy URL if env is missing (fixes Build crash)
// Force Vercel Re-deploy Trigger
const url = process.env.DATABASE_URL || "postgresql://user:pass@localhost:5432/db"

export const prisma = globalForPrisma.prisma || new PrismaClient({
    datasourceUrl: url
} as any)

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
