import { PrismaClient } from "@prisma/client"

// Patch BigInt serialization for JSON.stringify
// @ts-ignore
BigInt.prototype.toJSON = function () {
    return this.toString()
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

const prismaClientSingleton = () => {
    // Polyfill for Vercel Build where DATABASE_URL might be missing or invalid
    // This allows the client to be instantiated without throwing "PrismaClientInitializationError"
    if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("postgres")) {
        console.warn("⚠️  DATABASE_URL missing or invalid. Using dummy for Build.")
        process.env.DATABASE_URL = "postgresql://dummy:dummy@localhost:5432/dummy"
    }

    return new PrismaClient()
}

// Lazy initialization using Proxy
// This prevents Next.js from connecting to DB during "Collecting Page Data" (Static Gen)
export const prisma = new Proxy({} as PrismaClient, {
    get: (target, prop) => {
        // Initialize only on first access of any property
        if (!globalForPrisma.prisma) {
            globalForPrisma.prisma = prismaClientSingleton()
        }
        return Reflect.get(globalForPrisma.prisma, prop)
    }
})

if (process.env.NODE_ENV !== "production") {
    // In Dev, we might want to attach it globalThis to survive hot-reloads.
    // However, since we use Proxy, the Proxy itself is stateless but redirects to globalForPrisma.
    // So if globalForPrisma.prisma is set, it reuses it.
}
