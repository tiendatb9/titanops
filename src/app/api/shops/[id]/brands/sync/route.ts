
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ShopeeClient } from "@/lib/shopee"
import { ShopeeAuthService } from "@/lib/services/shopee-auth"

export const dynamic = 'force-dynamic' // Force dynamic

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const body = await req.json()
        const params = await props.params
        const shopId = params.id
        const { categoryId } = body // offset, etc handles later

        if (!categoryId) return new NextResponse("Missing Category ID", { status: 400 })

        // 1. Get Auth
        const accessToken = await ShopeeAuthService.getValidAccessToken(shopId)
        const shop = await prisma.shop.findUnique({ where: { id: shopId } })
        if (!shop) return new NextResponse("Shop not found", { status: 404 })

        // 2. Fetch Single Chunk (Controlled by Frontend)
        const offset = body.offset || 0
        const pageSize = 100

        console.log(`[BrandSync] Syncing chunk offset ${offset} for Cat ${categoryId}...`)

        const res = await ShopeeClient.getBrandList(
            accessToken,
            Number(shop.platformShopId),
            Number(categoryId),
            offset,
            pageSize
        )

        if (res.error) {
            console.error("Brand Sync Error", res)
            // Fix: Return detailed JSON error if Shopee fails
            return new NextResponse(JSON.stringify({
                error: `Shopee API Error: ${res.message}`,
                shopee_error: res.error
            }), { status: 500 })
        }

        const list = res.response?.brand_list || []

        if (list.length > 0) {
            // Transform for Prisma
            const data = list.map((b: any) => ({
                shopeeBrandId: BigInt(b.brand_id),
                name: b.original_brand_name || b.display_brand_name,
                originalName: b.original_brand_name,
                displayBrandName: b.display_brand_name,
                categoryId: BigInt(categoryId)
            }))

            // Use createMany with skipDuplicates for speed
            await prisma.brand.createMany({
                data,
                skipDuplicates: true
            })
        }

        return NextResponse.json({
            success: true,
            syncedCount: list.length,
            nextOffset: res.response?.next_offset,
            hasNextPage: res.response?.has_next_page
        })

    } catch (e: any) {

        console.error("Sync Error", e)
        // Return detailed error for debugging
        return new NextResponse(JSON.stringify({
            error: e.message,
            stack: e.stack,
            type: e.constructor.name
        }), { status: 500 })
    }
}

