
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Handle BigInt serialization
// (Prisma returns BigInt which JSON.stringify fails on)
const bigIntReplacer = (key: string, value: any) => {
    if (typeof value === 'bigint') return value.toString()
    return value
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const categoryId = searchParams.get("categoryId")
    const query = searchParams.get("q") || ""

    try {
        const where: any = {}

        // Filter by Category? 
        // If huge list, maybe useful. But "Search" expects global usually?
        // Shopee requires Category for their API.
        // If we synced by category, we can filter.
        if (categoryId) {
            where.categoryId = BigInt(categoryId)
        }

        if (query) {
            where.name = {
                contains: query,
                mode: 'insensitive' // Postgres case insensitive
            }
        }

        const brands = await prisma.brand.findMany({
            where,
            take: 50, // Limit results
            orderBy: { name: 'asc' }
        })

        // JSON stringify with BigInt support
        const json = JSON.stringify(brands, bigIntReplacer)

        return new NextResponse(json, {
            headers: { 'Content-Type': 'application/json' }
        })

    } catch (e: any) {
        return new NextResponse(e.message, { status: 500 })
    }
}
