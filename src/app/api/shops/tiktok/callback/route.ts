
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic' // Force dynamic

export async function GET(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

        const { searchParams } = new URL(req.url)
        const code = searchParams.get("code")

        if (!code) {
            return new NextResponse("Missing Code", { status: 400 })
        }

        // Exchange for Token
        const data = await TikTokClient.getAccessToken(code)

        // TikTok Data: access_token, refresh_token, open_id, seller_name, shop_cipher, ...
        const shopIdentifier = data.shop_cipher || data.open_id // Use cipher as ID or open_id
        const shopName = data.shop_name || data.seller_name || `TikTok Shop ${shopIdentifier}`.substring(0, 20)

        if (!shopIdentifier) {
            return new NextResponse("Failed to get Shop Identifier from TikTok", { status: 400 })
        }

        // Upsert Shop
        await prisma.shop.upsert({
            where: {
                platform_platformShopId: {
                    platform: "TIKTOK",
                    platformShopId: shopIdentifier
                }
            },
            create: {
                userId: session.user.id,
                name: shopName,
                platform: "TIKTOK",
                platformShopId: shopIdentifier,
                isActive: true,
                credentials: {
                    shopCipher: shopIdentifier,
                    accessToken: data.access_token,
                    refreshToken: data.refresh_token,
                    expireIn: data.access_token_expire_in
                }
            },
            update: {
                isActive: true,
                credentials: {
                    shopCipher: shopIdentifier,
                    accessToken: data.access_token,
                    refreshToken: data.refresh_token,
                    expireIn: data.access_token_expire_in
                }
            }
        })

        return NextResponse.redirect(new URL("/shops", req.url))
    } catch (error) {
        console.error("[TIKTOK_CALLBACK]", error)
        return NextResponse.redirect(new URL("/shops?error=tiktok_connection_failed", req.url))
    }
}
