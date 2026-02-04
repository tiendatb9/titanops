
import { prisma } from "@/lib/prisma"
import { ShopeeClient } from "@/lib/shopee"

export const ShopeeAuthService = {
    /**
     * Get a valid Access Token for a Shop.
     * Automatically refreshes if expired or expiring soon (< 5 mins).
     */
    async getValidAccessToken(shopId: string): Promise<string> {
        const shop = await prisma.shop.findUnique({
            where: { id: shopId }
        })

        if (!shop || !shop.credentials) throw new Error("Shop not found or missing credentials")

        const creds = shop.credentials as any
        const now = new Date()

        // Check Expiry (Handle both camelCase and snake_case)
        const expireIn = creds.expireIn || creds.expire_in
        const updatedAt = creds.updatedAt || creds.updated_at

        const expiresAt = shop.tokenExpiresAt || (expireIn ? new Date((updatedAt || Date.now()) + expireIn * 1000) : null)

        // If we don't know expiry, or it's past/soon, refresh it.
        const isExpiring = !expiresAt || (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000)

        if (isExpiring) {
            console.log(`[ShopeeAuth] Token for shop ${shop.name} is expiring/expired. Refreshing...`)
            const refreshToken = creds.refreshToken || creds.refresh_token
            return await this.refreshToken(shopId, refreshToken) // shopId is UUID
        }

        return creds.accessToken || creds.access_token
    },

    /**
     * Refresh Token and Update Database
     */
    async refreshToken(shopId: string, currentRefreshToken: string): Promise<string> {
        try {
            // Shopee Refresh Call
            const res = await ShopeeClient.refreshAccessToken(currentRefreshToken, Number(shopId)) // Wait, shopId in DB is UUID? 
            // NO, listing table says shop.platformShopId is the actual ID on Shopee.
            // My helper above passed `shopId` (UUID) to `refreshAccessToken`.
            // Wait, `refreshAccessToken` expects `shopId: number`.
            // Let's check DB schema. `Shop` has `platformShopId` (String).

            const shop = await prisma.shop.findUnique({ where: { id: shopId } })
            if (!shop || !shop.platformShopId) throw new Error("Missing Platform Shop ID")

            // Call API
            const refreshRes = await ShopeeClient.refreshAccessToken(
                currentRefreshToken,
                Number(shop.platformShopId)
            )

            if (refreshRes.error) {
                console.error("[ShopeeReset] Failed:", refreshRes)
                // If refresh fails (e.g. refresh token invalid), mark shop as inactive?
                // await prisma.shop.update({ where: { id: shopId }, data: { isActive: false } })
                throw new Error(`Refresh Failed: ${refreshRes.error} - ${refreshRes.message}`)
            }

            // Success: Update DB
            const newAccessToken = refreshRes.access_token
            const newRefreshToken = refreshRes.refresh_token
            const expireIn = refreshRes.expire_in // seconds

            // Calculate Expiry
            const now = new Date()
            const expiresAt = new Date(now.getTime() + expireIn * 1000)

            const newCreds = {
                ...shop.credentials as object,
                access_token: newAccessToken,
                refresh_token: newRefreshToken,
                expire_in: expireIn,
                updated_at: now.getTime()
            }

            await prisma.shop.update({
                where: { id: shopId },
                data: {
                    credentials: newCreds,
                    tokenExpiresAt: expiresAt,
                    lastRefreshAt: now,
                    isActive: true // Revive if it was dead?
                }
            })

            console.log(`[ShopeeAuth] Refreshed token for ${shop.name}. Expires at ${expiresAt.toISOString()}`)
            return newAccessToken

        } catch (error) {
            console.error(`[ShopeeAuth] Critical Error Refreshing:`, error)
            // Update status to indicate error
            await prisma.shop.update({ where: { id: shopId }, data: { isActive: false } })
            throw error
        }
    }
}
