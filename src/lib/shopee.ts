
import crypto from 'crypto'

const PARTNER_ID = process.env.SHOPEE_PARTNER_ID
const PARTNER_KEY = process.env.SHOPEE_PARTNER_KEY
const REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/shops/shopee/callback`

export const ShopeeClient = {
    /**
     * Generate HMAC-SHA256 Signature for Shopee V2 API
     */
    sign(path: string, query: Record<string, any>) {
        if (!PARTNER_ID || !PARTNER_KEY) throw new Error("Missing Shopee Config")

        const timestamp = Math.floor(Date.now() / 1000)
        const accessToken = query.access_token || ""
        const shopId = query.shop_id || ""

        // V2 Signature: partner_id + path + timestamp + access_token + shop_id
        const baseString = `${PARTNER_ID}${path}${timestamp}${accessToken}${shopId}`

        const sign = crypto
            .createHmac('sha256', PARTNER_KEY)
            .update(baseString)
            .digest('hex')

        return {
            ...query,
            partner_id: Number(PARTNER_ID),
            timestamp,
            sign
        }
    },

    /**
     * Generate Auth URL for Titan App Mode
     * https://open.shopee.com/documents/v2/OpenAPI%20Authorization/Overview?module=87&type=1
     */
    generateAuthUrl() {
        if (!PARTNER_ID || !PARTNER_KEY) throw new Error("Missing Shopee Config")

        const path = "/api/v2/shop/auth_partner"
        const timestamp = Math.floor(Date.now() / 1000)

        // Auth V2 Signature: partner_id + path + timestamp
        const baseString = `${PARTNER_ID}${path}${timestamp}`

        const sign = crypto
            .createHmac('sha256', PARTNER_KEY)
            .update(baseString)
            .digest('hex')

        const url = new URL("https://partner.shopeemobile.com/api/v2/shop/auth_partner")
        url.searchParams.append("partner_id", PARTNER_ID)
        url.searchParams.append("timestamp", timestamp.toString())
        url.searchParams.append("sign", sign)
        url.searchParams.append("redirect", REDIRECT_URI)

        return url.toString()
    },

    /**
     * Exchange Code for Access Token
     */
    async getAccessToken(code: string, shopId: number) {
        if (!PARTNER_ID || !PARTNER_KEY) throw new Error("Missing Shopee Config")

        const path = "/api/v2/auth/token/get"
        const timestamp = Math.floor(Date.now() / 1000)
        const baseBody = {
            code,
            shop_id: shopId,
            partner_id: Number(PARTNER_ID)
        }

        const baseString = `${PARTNER_ID}${path}${timestamp}`
        const sign = crypto.createHmac('sha256', PARTNER_KEY).update(baseString).digest('hex')

        const url = `https://partner.shopeemobile.com${path}?partner_id=${PARTNER_ID}&timestamp=${timestamp}&sign=${sign}`

        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(baseBody)
        })

        if (!res.ok) {
            const err = await res.text()
            throw new Error(`Shopee Token Error: ${err}`)
        }

        return res.json()
    }
}
