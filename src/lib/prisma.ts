// Fallback to dummy URL if env is missing (fixes Build crash)
const url = process.env.DATABASE_URL || "postgresql://user:pass@localhost:5432/db"

export const prisma = globalForPrisma.prisma || new PrismaClient({
    datasources: {
        db: {
            url: url
        }
    }
} as any) // Type assertion to handle build-time missing generated types

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
