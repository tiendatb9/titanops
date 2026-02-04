
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { ShopeeAuthService } from "@/lib/services/shopee-auth"
import { ShopeeClient } from "@/lib/shopee"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth()
        if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

        // URL Params
        const url = new URL(req.url)
        const categoryId = url.searchParams.get("categoryId")

        if (!categoryId) return new NextResponse("Missing categoryId", { status: 400 })

        // Get Shop
        const { id } = await params
        const shop = await prisma.shop.findUnique({
            where: { id, userId: session.user.id }
        })

        if (!shop) return new NextResponse("Shop Not Found", { status: 404 })

        // 1. Get Access Token
        const accessToken = await ShopeeAuthService.getValidAccessToken(shop.id)

        // 2. Fetch Attributes
        const res = await ShopeeClient.getAttributes(accessToken, Number(shop.platformShopId), Number(categoryId))

        if (res.error) {
            return new NextResponse(`Shopee Error: ${res.error} - ${res.message}`, { status: 500 })
        }

        const list = res.response?.attribute_list || []
        return NextResponse.json(list)

    } catch (error: any) {
        console.error("[Attributes_GET]", error)
        return new NextResponse(`Internal Error: ${error.message}`, { status: 500 })
    }
}
