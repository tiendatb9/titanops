import { NextRequest, NextResponse } from "next/server"
import { ShopeeClient } from "@/lib/shopee"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const partnerId = Number(process.env.SHOPEE_PARTNER_ID)
const partnerKey = process.env.SHOPEE_PARTNER_KEY!

export async function GET(request: NextRequest) {
    const session = await auth()
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const shopId = searchParams.get("shopId")

    if (!shopId) {
        return NextResponse.json({ error: "Missing shopId" }, { status: 400 })
    }

    try {
        // Get Access Token
        const shop = await prisma.shop.findUnique({
            where: { id: shopId },
            include: { shopeeTokens: true }
        })

        if (!shop || !shop.shopeeTokens || shop.shopeeTokens.length === 0) {
            return NextResponse.json({ error: "Shop or Token not found" }, { status: 404 })
        }

        const token = shop.shopeeTokens[0] // Use the first token

        const client = new ShopeeClient(partnerId, partnerKey)
        const categories = await client.getCategoryList(Number(shop.platformShopId), token.accessToken)

        return NextResponse.json(categories)

    } catch (error: any) {
        console.error("Failed to fetch Shopee categories:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
