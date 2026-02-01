
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ShopeeClient } from "@/lib/shopee"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

        const { searchParams } = new URL(req.url)
        const code = searchParams.get("code")
        const shopId = searchParams.get("shop_id")

        if (!code || !shopId) {
            return new NextResponse("Missing Code or Shop ID", { status: 400 })
        }

        // Exchange for Token
        const tokenData = await ShopeeClient.getAccessToken(code, Number(shopId))

        // tokenData structure: { access_token, refresh_token, expire_in, ... }

        // Determine Shop Name (We might need another API call to get shop info, but for now use ID)
        const shopName = `Shopee Shop ${shopId}`

        // Upsert Shop
        await prisma.shop.upsert({
            where: {
                platform_platformShopId: {
                    platform: "SHOPEE",
                    platformShopId: shopId
                }
            },
            create: {
                userId: session.user.id,
                name: shopName,
                platform: "SHOPEE",
                platformShopId: shopId,
                isActive: true,
                credentials: {
                    shopId: shopId,
                    accessToken: tokenData.access_token,
                    refreshToken: tokenData.refresh_token,
                    expireIn: tokenData.expire_in
                }
            },
            update: {
                // Refresh tokens
                isActive: true,
                credentials: {
                    shopId: shopId,
                    accessToken: tokenData.access_token,
                    refreshToken: tokenData.refresh_token,
                    expireIn: tokenData.expire_in
                }
            }
        })

        return NextResponse.redirect(new URL("/shops?success=true", req.url))
    } catch (error) {
        console.error("[SHOPEE_CALLBACK]", error)
        return NextResponse.redirect(new URL("/shops?error=connection_failed", req.url))
    }
}
