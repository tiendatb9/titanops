require('dotenv').config({ path: '.env.local' }) // Next.js uses .env.local usually
require('dotenv').config() // Fallback to .env

const { PrismaClient } = require('@prisma/client')

// Handle Driver Adapter if needed, but for simple script, try standard init
// If schema has "driverAdapters" enabled, standard init might still work if env var is direct connection string.
// If using Vercel Postgres/Neon, we might need the adapter.
// Let's try standard first, but ensure DATABASE_URL is set.

const prisma = new PrismaClient()

async function main() {
    console.log('Listing Products...')
    try {
        const products = await prisma.product.findMany({
            take: 20,
            select: {
                id: true,
                userId: true,
                sourceId: true,
                source: true,
                name: true
            },
            orderBy: { createdAt: 'desc' }
        })

        console.log('Found products:', products.length)
        if (products.length === 0) console.log("No products found.")

        products.forEach(p => {
            console.log(`[${p.id}] ${p.name.substring(0, 25)}... (User: ${p.userId}) (SourceID: ${p.sourceId})`)
        })
    } catch (err) {
        console.error("Query failed:", err)
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
