
import { PrismaClient } from "@prisma/client"

// Patch BigInt serialization for JSON.stringify
// This prevents "Do not know how to serialize a BigInt" errors
// @ts-ignore
BigInt.prototype.toJSON = function () {
    return this.toString()
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
