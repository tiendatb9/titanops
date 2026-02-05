
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { ShopeeAuthService } from "@/lib/services/shopee-auth"
import { ShopeeClient } from "@/lib/shopee"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth()
        if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

        // Get Shop ID (This is Database ID)
        const { id } = await params
        const shop = await prisma.shop.findUnique({
            where: { id, userId: session.user.id }
        })

        if (!shop) return new NextResponse("Shop Not Found", { status: 404 })

        // 1. Get Access Token
        const accessToken = await ShopeeAuthService.getValidAccessToken(shop.id)
        console.log(`[Categories_GET] Shop: ${shop.id}, PlatformShopId: ${shop.platformShopId}, Token: ${accessToken.slice(0, 10)}...`)

        // 2. Fetch Categories
        const res = await ShopeeClient.getCategory(accessToken, Number(shop.platformShopId))

        console.log(`[Categories_GET] Shopee API Response Status: ${res.error ? 'Error' : 'Success'}, Msg: ${res.message}`)

        if (res.error) {
            return new NextResponse(`Shopee Error: ${res.error} - ${res.message}`, { status: 500 })
        }

        const list = res.response?.category_list || []
        console.log(`[Categories_GET] Found ${list.length} categories`)

        return NextResponse.json(list)

    } catch (error: any) {
        console.error("[Categories_GET] Exception:", error)
        return new NextResponse(`Internal Error: ${error.message}`, { status: 500 })
    }
}
