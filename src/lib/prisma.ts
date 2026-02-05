import { PrismaClient } from "@prisma/client"

// Patch BigInt serialization for JSON.stringify
// @ts-ignore
BigInt.prototype.toJSON = function () {
    return this.toString()
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

const prismaClientSingleton = () => {
    // Polyfill for Vercel Build checks
    const url = process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/dummy"

    return new PrismaClient({
        datasources: {
            db: {
                url: url
            }
        }
    })
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
