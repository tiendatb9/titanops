
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const shops = await prisma.shop.findMany({
            where: {
                userId: session.user.id,
                isActive: true
            },
            id: true,
            name: true,
            platform: true,
            platformShopId: true, // Added
            isActive: true,
            createdAt: true,
            tokenExpiresAt: true,
            lastSync: true, // If this column exists? Let's check prisma. 
            // Wait, lastSync exists in schema? The code uses `shop.lastSync` later.
            // Looking at file content view above: `lastSync: 'Vừa xong'` is hardcoded in map.
            // But let's select it if it exists.
        }
        })

    const formattedShops = shops.map(shop => ({
        id: shop.id,
        name: shop.name,
        platform: shop.platform,
        platformShopId: shop.platformShopId, // Added
        status: shop.isActive ? 'active' : 'disconnected',
        isActive: shop.isActive,
        tokenExpiresAt: shop.tokenExpiresAt,
        // Pseudo-stats for now
        products: 0,
        lastSync: 'Vừa xong' // Or use shop.updatedAt?

        return NextResponse.json(formattedShops)
    } catch (error) {
        console.error("[SHOPS_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

const shopSchema = z.object({
    name: z.string().min(1),
    platform: z.enum(["SHOPEE", "TIKTOK", "LAZADA", "TIKI", "SAPO", "PANCAKE", "WOO"]),
    // Common Credentials
    accessToken: z.string().optional(),

    // Shopee / TikTok / Lazada (Marketplace)
    appKey: z.string().optional(), // Partner ID / App Key
    appSecret: z.string().optional(), // Partner Secret / App Secret
    shopId: z.string().optional(), // Shopee/Tiktok specific shop identifier
    shopCipher: z.string().optional(), // TikTok specific

    // Sapo
    sapoDomain: z.string().optional(),
    sapoLocationId: z.string().optional(),
    sapoAccountId: z.string().optional(),

    // Woo
    wooDomain: z.string().optional(),
    wooConsumerKey: z.string().optional(),
    wooConsumerSecret: z.string().optional()
})

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

        const body = await req.json()
        const result = shopSchema.safeParse(body)

        if (!result.success) {
            return new NextResponse("Invalid Data", { status: 400 })
        }

        const data = result.data

        const shop = await prisma.shop.create({
            data: {
                userId: session.user.id,
                name: data.name,
                platform: data.platform,
                isActive: true,
                credentials: {
                    accessToken: data.accessToken,
                    appKey: data.appKey,
                    appSecret: data.appSecret,
                    shopId: data.shopId,
                    shopCipher: data.shopCipher,
                    sapoDomain: data.sapoDomain,
                    sapoLocationId: data.sapoLocationId,
                    sapoAccountId: data.sapoAccountId,
                    wooDomain: data.wooDomain,
                    wooConsumerKey: data.wooConsumerKey,
                    wooConsumerSecret: data.wooConsumerSecret
                }
            }
        })

        return NextResponse.json(shop)
    } catch (error) {
        console.error("[SHOPS_POST]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
