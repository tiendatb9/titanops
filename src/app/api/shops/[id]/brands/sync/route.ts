
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ShopeeClient } from "@/lib/shopee"
import { ShopeeAuthService } from "@/lib/services/shopee-auth-service"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await req.json()
        const { categoryId } = body
        const shopId = params.id

        if (!categoryId) return new NextResponse("Missing Category ID", { status: 400 })

        // 1. Get Auth
        const accessToken = await ShopeeAuthService.getValidAccessToken(shopId)
        const shop = await prisma.shop.findUnique({ where: { id: shopId } })
        if (!shop) return new NextResponse("Shop not found", { status: 404 })

        // 2. Fetch Loop
        let offset = 0
        let hasMore = true
        let totalSynced = 0
        const pageSize = 100 // Shopee max
        const MAX_PAGES = 1000 // Limit 100k

        console.log(`[BrandSync] Starting sync for Cat ${categoryId}...`)

        while (hasMore && offset < MAX_PAGES * pageSize) {
            const res = await ShopeeClient.getBrandList(
                accessToken,
                Number(shop.platformShopId),
                Number(categoryId),
                offset,
                pageSize
            )

            if (res.error) {
                console.error("Brand Sync Error", res)
                return new NextResponse(`Shopee Error: ${res.message}`, { status: 500 })
            }

            const list = res.response?.brand_list || []
            if (list.length === 0) break

            // 3. Upsert Batch
            // Prisma createMany doesn't support upsert (skipDuplicates ignores updates)
            // But we want to update if exists.
            // Loop upsert is slow? 100 items is fine.
            // Or createMany with skipDuplicates (if ID matches, name rarely changes).

            // Transform for Prisma
            const data = list.map((b: any) => ({
                shopeeBrandId: BigInt(b.brand_id),
                name: b.original_brand_name || b.display_brand_name,
                originalName: b.original_brand_name,
                displayBrandName: b.display_brand_name,
                categoryId: BigInt(categoryId)
            }))

            // Use createMany with skipDuplicates for speed
            // We assume brand names don't change often.
            await prisma.brand.createMany({
                data,
                skipDuplicates: true
            })

            totalSynced += list.length
            console.log(`[BrandSync] Synced ${totalSynced} brands...`)

            if (res.response?.has_next_page) {
                offset = res.response.next_offset
                // Delay to be safe
                await new Promise(r => setTimeout(r, 200))
            } else {
                hasMore = false
            }
        }

        return NextResponse.json({ success: true, count: totalSynced })

    } catch (e: any) {
        console.error("Sync Error", e)
        return new NextResponse(e.message, { status: 500 })
    }
}
