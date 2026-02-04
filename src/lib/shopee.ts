
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
    },

    /**
     * Refresh Access Token
     */
    async refreshAccessToken(refreshToken: string, shopId: number) {
        if (!PARTNER_ID || !PARTNER_KEY) throw new Error("Missing Shopee Config")

        const path = "/api/v2/auth/access_token/get"
        const timestamp = Math.floor(Date.now() / 1000)
        const baseBody = {
            refresh_token: refreshToken,
            shop_id: shopId,
            partner_id: Number(PARTNER_ID)
        }

        // Signature: partner_id + path + timestamp
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
            throw new Error(`Shopee Refresh Error: ${err}`)
        }

        return res.json()
    },

    /**
     * Get Shop Info
     */
    async getShopInfo(accessToken: string, shopId: number) {
        if (!PARTNER_ID || !PARTNER_KEY) throw new Error("Missing Shopee Config")

        const path = "/api/v2/shop/get_shop_info"
        const timestamp = Math.floor(Date.now() / 1000)

        const baseString = `${PARTNER_ID}${path}${timestamp}${accessToken}${shopId}`
        const sign = crypto.createHmac('sha256', PARTNER_KEY).update(baseString).digest('hex')

        const url = `https://partner.shopeemobile.com${path}?partner_id=${PARTNER_ID}&timestamp=${timestamp}&access_token=${accessToken}&shop_id=${shopId}&sign=${sign}`

        const res = await fetch(url, { method: "GET" })

        if (!res.ok) {
            const err = await res.text()
            console.error("Shopee Shop Info Warning:", err)
            return null
        }

        const json = await res.json()
        if (json.error) {
            console.error("Shopee Shop Info Error:", json)
            return null
        }
        return json.response
    },

    /**
     * Get Item List
     */
    async getItemList(accessToken: string, shopId: number, offset = 0, pageSize = 20, status = "NORMAL") {
        if (!PARTNER_ID || !PARTNER_KEY) throw new Error("Missing Shopee Config")

        const path = "/api/v2/product/get_item_list"
        const timestamp = Math.floor(Date.now() / 1000)

        const baseString = `${PARTNER_ID}${path}${timestamp}${accessToken}${shopId}`
        const sign = crypto.createHmac('sha256', PARTNER_KEY).update(baseString).digest('hex')

        const url = `https://partner.shopeemobile.com${path}?partner_id=${PARTNER_ID}&timestamp=${timestamp}&access_token=${accessToken}&shop_id=${shopId}&sign=${sign}&offset=${offset}&page_size=${pageSize}&item_status=${status}`

        const res = await fetch(url, { method: "GET" })
        if (!res.ok) {
            const err = await res.text()
            throw new Error(`Shopee GetItemList Error: ${err}`)
        }
        return res.json()
    },

    /**
     * Get Item Base Info
     */
    async getItemBaseInfo(accessToken: string, shopId: number, itemIdList: number[]) {
        if (!PARTNER_ID || !PARTNER_KEY) throw new Error("Missing Shopee Config")

        const path = "/api/v2/product/get_item_base_info"
        const timestamp = Math.floor(Date.now() / 1000)

        const baseString = `${PARTNER_ID}${path}${timestamp}${accessToken}${shopId}`
        const sign = crypto.createHmac('sha256', PARTNER_KEY).update(baseString).digest('hex')

        const urlObj = new URL(`https://partner.shopeemobile.com${path}`)
        urlObj.searchParams.append("partner_id", PARTNER_ID!)
        urlObj.searchParams.append("timestamp", timestamp.toString())
        urlObj.searchParams.append("access_token", accessToken)
        urlObj.searchParams.append("shop_id", shopId.toString())
        urlObj.searchParams.append("sign", sign)

        itemIdList.forEach(id => urlObj.searchParams.append("item_id_list", id.toString()))

        const res = await fetch(urlObj.toString(), { method: "GET" })
        if (!res.ok) {
            const err = await res.text()
            throw new Error(`Shopee GetItemBaseInfo Error: ${err}`)
        }
        return res.json()
    },

    /**
     * Get Model List (Variations)
     */
    async getModelList(accessToken: string, shopId: number, itemId: number) {
        if (!PARTNER_ID || !PARTNER_KEY) throw new Error("Missing Shopee Config")

        const path = "/api/v2/product/get_model_list"
        const timestamp = Math.floor(Date.now() / 1000)

        const baseString = `${PARTNER_ID}${path}${timestamp}${accessToken}${shopId}`
        const sign = crypto.createHmac('sha256', PARTNER_KEY).update(baseString).digest('hex')

        const url = `https://partner.shopeemobile.com${path}?partner_id=${PARTNER_ID}&timestamp=${timestamp}&access_token=${accessToken}&shop_id=${shopId}&sign=${sign}&item_id=${itemId}`

        const res = await fetch(url, { method: "GET" })
        if (!res.ok) {
            // Some items behave weirdly
            const text = await res.text()
            console.warn(`[getModelList] Failed for ${itemId}: ${text}`)
            return { response: { model: [] } }
        }
        return res.json()
    },

    /**
     * Get Category List
     */
    async getCategory(accessToken: string, shopId: number) {
        if (!PARTNER_ID || !PARTNER_KEY) throw new Error("Missing Shopee Config")

        const path = "/api/v2/product/get_category"
        const timestamp = Math.floor(Date.now() / 1000)

        const baseString = `${PARTNER_ID}${path}${timestamp}${accessToken}${shopId}`
        const sign = crypto.createHmac('sha256', PARTNER_KEY).update(baseString).digest('hex')

        const url = `https://partner.shopeemobile.com${path}?partner_id=${PARTNER_ID}&timestamp=${timestamp}&access_token=${accessToken}&shop_id=${shopId}&sign=${sign}&language=vi`

        const res = await fetch(url, { method: "GET" })
        if (!res.ok) {
            const err = await res.text()
            throw new Error(`Shopee GetCategory Error: ${err}`)
        }
        return res.json()
    }
}
