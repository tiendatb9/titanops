
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { ShopeeAuthService } from "@/lib/services/shopee-auth"
import { ShopeeClient } from "@/lib/shopee"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth()
        if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

        const url = new URL(req.url)
        const categoryId = url.searchParams.get("categoryId")

        if (!categoryId) return new NextResponse("Missing categoryId", { status: 400 })

        const { id } = await params
        const shop = await prisma.shop.findUnique({
            where: { id, userId: session.user.id }
        })

        if (!shop) return new NextResponse("Shop Not Found", { status: 404 })

        const accessToken = await ShopeeAuthService.getValidAccessToken(shop.id)

        // Fetch ALL Brands (Loop Pagination)
        let allBrands: any[] = []
        let offset = 0
        let hasNextPage = true
        const pageSize = 100 // Max page size

        // Safety limit to prevent infinite loops or timeout (e.g. 50 pages = 5000 brands)
        // If user says "tens of thousands", we might need more, but let's start with safe limit.
        const MAX_PAGES = 100
        let pageCount = 0

        while (hasNextPage && pageCount < MAX_PAGES) {
            const res = await ShopeeClient.getBrandList(accessToken, Number(shop.platformShopId), Number(categoryId), offset, pageSize)

            if (res.error) {
                console.error("Brand Fetch Error", res)
                break
            }

            const list = res.response?.brand_list || []

            // Log progress
            console.log(`[Brands_Fetch] Page ${pageCount + 1}, Items: ${list.length}, NextOffset: ${res.response?.next_offset}, HasNext: ${res.response?.has_next_page}`)

            allBrands = [...allBrands, ...list]

            hasNextPage = res.response?.has_next_page
            offset = res.response?.next_offset
            pageCount++

            // Small delay to be nice to API?
            // await new Promise(r => setTimeout(r, 100))
        }

        console.log(`[Brands_Total] Fetched ${allBrands.length} brands in ${pageCount} pages.`)
        return NextResponse.json(allBrands)

    } catch (error: any) {
        console.error("[Brands_GET]", error)
        return new NextResponse(`Internal Error: ${error.message}`, { status: 500 })
    }
}
