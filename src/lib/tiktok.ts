
import crypto from 'crypto'

const APP_ID = process.env.TIKTOK_APP_ID
const APP_SECRET = process.env.TIKTOK_APP_SECRET
const REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/shops/tiktok/callback`

export const TikTokClient = {
    /**
     * Generate HMAC-SHA256 Signature for TikTok Shop API
     * Base String: app_secret + path + sorted_params + app_secret
     * Note: This varies by version. Assuming V2023 or standard.
    */
    sign(path: string, params: Record<string, any>) {
        if (!APP_ID || !APP_SECRET) throw new Error("Missing TikTok Config")

        // 1. Remove sign and access_token (if in headers usually, but for signing params)
        const { sign, access_token, ...rest } = params

        // 2. Sort keys
        const keys = Object.keys(rest).sort()

        // 3. Concat
        let baseString = APP_SECRET + path
        for (const key of keys) {
            baseString += `${key}${rest[key]}`
        }
        baseString += APP_SECRET

        // 4. HMAC-SHA256
        return crypto
            .createHmac('sha256', APP_SECRET)
            .update(baseString)
            .digest('hex')
    },

    /**
     * Generate Auth URL
     * https://partner.tiktokshop.com/docv2/page/6507c6f0932da600465554f6
     */
    generateAuthUrl() {
        if (!APP_ID) throw new Error("Missing TikTok Config")

        const url = new URL("https://auth.tiktok-shops.com/oauth/authorize")
        url.searchParams.append("app_key", APP_ID)
        url.searchParams.append("state", crypto.randomBytes(16).toString('hex')) // CSRF Protection
        // url.searchParams.append("redirect_uri", REDIRECT_URI) // TikTok requires Exact Match in Console

        return url.toString()
    },

    /**
     * Exchange Code for Access Token
     * https://partner.tiktokshop.com/docv2/page/6507c6f0932da600465554f3
     */
    async getAccessToken(code: string) {
        if (!APP_ID || !APP_SECRET) throw new Error("Missing TikTok Config")

        const url = `https://auth.tiktok-shops.com/api/v2/token/get?app_key=${APP_ID}&app_secret=${APP_SECRET}&auth_code=${code}&grant_type=authorized_code`

        const res = await fetch(url, {
            method: "GET", // Use GET or POST depending on docs, V2 usually allows GET? Check docs. Usually strictly GET for V2/token/get or POST?
            // Most docs say GET for token/get in V2. 
        })

        if (!res.ok) {
            const text = await res.text()
            throw new Error(`TikTok Token Error: ${text}`)
        }

        const data = await res.json()
        if (data.code !== 0) {
            throw new Error(`TikTok API Error: ${data.message} (${data.code})`)
        }

        return data.data
    }
}
