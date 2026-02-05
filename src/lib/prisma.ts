
import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

// Only initialize Prisma Client if we have a Database URL
const connectionString = process.env.DATABASE_URL

let prismaInstance: PrismaClient;

if (globalForPrisma.prisma) {
    prismaInstance = globalForPrisma.prisma
} else {
    // Check if we are in a browser or edge environment where process.env might differ
    if (!connectionString) {
        // Fallback for build time or client-side strictness? 
        // Just create empty or throw? 
        // Ideally we shouldn't import this file on client.
        // For now, create standard client if no URL (will fail on connect)
        prismaInstance = new PrismaClient()
    } else {
        const pool = new Pool({ connectionString })
        const adapter = new PrismaPg(pool)
        prismaInstance = new PrismaClient({ adapter })
    }
}

export const prisma = prismaInstance

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
