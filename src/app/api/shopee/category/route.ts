import { NextRequest, NextResponse } from "next/server"
import { ShopeeClient } from "@/lib/shopee"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const partnerId = Number(process.env.SHOPEE_PARTNER_ID)
const partnerKey = process.env.SHOPEE_PARTNER_KEY!

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions)
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
            include: { shopeeToken: true }
        })

        if (!shop || !shop.shopeeToken) {
            return NextResponse.json({ error: "Shop or Token not found" }, { status: 404 })
        }

        const client = new ShopeeClient(partnerId, partnerKey)
        const categories = await client.getCategoryList(Number(shop.platformShopId), shop.shopeeToken.accessToken)

        return NextResponse.json(categories)

    } catch (error: any) {
        console.error("Failed to fetch Shopee categories:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
