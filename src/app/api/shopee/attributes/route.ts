import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ShopeeClient } from "@/lib/shopee"
import { ShopeeAuthService } from "@/lib/services/shopee-auth"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
    const session = await auth()
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

    const { searchParams } = new URL(req.url)
    const categoryId = searchParams.get("categoryId")
    const shopId = searchParams.get("shopId")

    if (!categoryId || !shopId) {
        return new NextResponse("Missing categoryId or shopId", { status: 400 })
    }

    try {
        // 1. Get Access Token
        const accessToken = await ShopeeAuthService.getValidAccessToken(shopId)

        // 2. Get Shop (Platform ID)
        const shop = await prisma.shop.findUnique({
            where: { id: shopId }
        })

        if (!shop || !shop.platformShopId) {
            return new NextResponse("Shop not valid", { status: 400 })
        }

        // 3. Call Shopee API
        const res = await ShopeeClient.getAttributes(accessToken, Number(shop.platformShopId), Number(categoryId))

        if (res.error) {
            return NextResponse.json({ error: res.message || "Shopee API Error" }, { status: 500 })
        }

        return NextResponse.json(res.response || {})

    } catch (error) {
        console.error("[SHOPEE_ATTR]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
