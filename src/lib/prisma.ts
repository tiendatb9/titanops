import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

// Only initialize Prisma Client if we have a Database URL or if we are not in a build context that requires it strictly?
// Actually, for Vercel build (static gen), we might not have DB access.
// We should check if connectionString is defined.

let prismaInstance: PrismaClient;

if (globalForPrisma.prisma) {
    prismaInstance = globalForPrisma.prisma
} else {
    // Check if we are in a browser or edge environment where process.env might differ, or simply if var exists
    // If DATABASE_URL is missing, we shouldn't throw immediately at module load time unless strictly needed.
    // However, PrismaPg requires a pool which requires a connection string.

    // safeInit allows the module to be imported without crashing if env vars are missing (e.g. during build)
    const connectionString = process.env.DATABASE_URL || ""

    if (connectionString) {
        const pool = new Pool({ connectionString })
        const adapter = new PrismaPg(pool)
        prismaInstance = new PrismaClient({ adapter })
    } else {
        // Fallback for build time or when env var is missing. 
        // This instance will throw if used to query, but won't crash the module load.
        prismaInstance = new PrismaClient()
    }
}

export const prisma = prismaInstance

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
