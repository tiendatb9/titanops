
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
    const shops = await prisma.shop.findMany({
        where: { platform: 'SHOPEE' }
    })

    console.log(`Found ${shops.length} Shopee shops.`)

    for (const shop of shops) {
        console.log("------------------------------------------------")
        console.log(`Shop ID: ${shop.id} | Name: ${shop.name}`)
        console.log(`Platform ID: ${shop.platformShopId}`)
        console.log(`Status: ${shop.status}`)

        const expire = new Date(Number(shop.expiresAt) * 1000)
        const now = new Date()
        const diffMinutes = (expire.getTime() - now.getTime()) / 1000 / 60

        console.log(`Expires At (Epoch): ${shop.expiresAt}`)
        console.log(`Expires At (Local): ${expire.toLocaleString()}`)
        console.log(`Current Time:       ${now.toLocaleString()}`)
        console.log(`Remaining Minutes:  ${diffMinutes.toFixed(2)} min`)

        if (diffMinutes < 0) {
            console.log("⚠️ TOKEN EXPIRED!")
        } else if (diffMinutes < 240) { // 4 hours
            console.log("⚠️ Token expiring soon (< 4 hours)")
        } else {
            console.log("✅ Token Valid")
        }

        console.log(`Refresh Token: ${shop.refreshToken ? shop.refreshToken.substring(0, 10) + '...' : 'NULL'}`)
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
