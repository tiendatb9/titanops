
import { prisma } from "@/lib/prisma"
import { ShopeeAuthService } from "@/lib/services/shopee-auth"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
    try {
        // Optional: Check CRON_SECRET if using Vercel Cron
        /*
        const authHeader = req.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
             return new NextResponse('Unauthorized', { status: 401 })
        }
        */

        console.log("[Cron] Starting Shopee Token Refresh Job... (V2 Check)")

        const now = new Date()
        // Buffer Time: 4 Hours (Standard Access Token Life) to be safe. 
        // We want to refresh successfully well before it dies.
        const bufferTime = new Date(now.getTime() + 4 * 60 * 60 * 1000)

        // Find Shops that are Active AND (Expired OR Expiring Soon OR Unknown Expiry)
        const shops = await prisma.shop.findMany({
            where: {
                platform: 'SHOPEE',
                isActive: true,
                OR: [
                    { tokenExpiresAt: { lt: bufferTime } },
                    { tokenExpiresAt: null } // Handle legacy/migrated shops
                ]
            }
        })

        if (shops.length === 0) {
            return NextResponse.json({ success: true, message: "No shops need refreshing." })
        }

        console.log(`[Cron] Found ${shops.length} shops to refresh.`)
        const results = []

        for (const shop of shops) {
            try {
                const creds = shop.credentials as any
                if (!creds?.refresh_token) {
                    results.push({ shop: shop.name, status: "Skipped (No Refresh Token)" })
                    continue
                }

                await ShopeeAuthService.refreshToken(shop.id, creds.refresh_token)
                results.push({ shop: shop.name, status: "Refreshed" })

            } catch (error) {
                console.error(`[Cron] Error refreshing ${shop.name}:`, error)
                results.push({ shop: shop.name, status: "Failed", error: (error as Error).message })
            }
        }

        return NextResponse.json({ success: true, results })

    } catch (error) {
        console.error("[Cron] Critical Error:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
