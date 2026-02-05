
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ShopeeClient } from "@/lib/shopee"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

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

        // Determine Shop Name (Priority: Custom Cookie > Real Shop Name > Shop ID)
        const cookieStore = await cookies()
        const pendingName = cookieStore.get("titan_pending_shop_name")?.value

        let shopName = pendingName ? decodeURIComponent(pendingName) : `Shopee Shop ${shopId}`


        // If no custom name, try to fetch real name
        if (!pendingName) {
            try {
                const shopInfo = await ShopeeClient.getShopInfo(tokenData.access_token, Number(shopId))
                if (shopInfo && shopInfo.shop_name) {
                    shopName = shopInfo.shop_name
                }
            } catch (e) {
                console.warn("Could not fetch shop name", e)
            }
        }

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
                // Refresh tokens and update name
                name: shopName,
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
