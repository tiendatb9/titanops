
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

        // 2. Fetch Categories
        const res = await ShopeeClient.getCategory(accessToken, Number(shop.platformShopId))

        if (res.error) {
            return new NextResponse(`Shopee Error: ${res.error} - ${res.message}`, { status: 500 })
        }

        const list = res.response?.category_list || []
        return NextResponse.json(list)

    } catch (error) {
        console.error("[Categories_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
