
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Setup Driver Adapter (Required because validation error said so)
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
    console.error("FATAL: DATABASE_URL not set")
    process.exit(1)
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    let user = await prisma.user.findFirst()

    if (!user) {
        console.log('No user found. Creating Demo User...')
        try {
            user = await prisma.user.create({
                data: {
                    email: "demo@titanops.vn",
                    name: "Demo User",
                    password: "password_hash_dummy",
                    plan: "BUSINESS"
                }
            })
            console.log(`Created Demo User: ${user.email}`)
        } catch (e) {
            console.error("Failed to create user:", e)
            return
        }
    }

    console.log(`Seeding rich data for user: ${user.email} (${user.id})`)

    // Create a Rich Product
    const product = await prisma.product.create({
        data: {
            userId: user.id,
            name: "[DEMO] Sách TitanOPS - Phiên Bản Giới Hạn (Có Giá Gốc & KM)",
            sku: "TITAN-DEMO-001",
            description: "Sản phẩm mẫu để test giao diện Rich Data",
            source: "shopee",
            sourceId: "123456789",
            sourceUrl: "https://shopee.vn/demo-product",
            images: ["https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lst01a2s3d4f5g"],

            // Rich Master Data
            originalPrice: 200000,
            promoPrice: 159000,
            promoId: "FLASH-SALE-99",
            daysToShip: 7, // Pre-order
            platformStatus: "NORMAL",
            status: "DRAFT",

            variants: {
                create: [
                    {
                        userId: user.id,
                        name: "Bìa Cứng (Limited)",
                        sku: "TITAN-HARD",
                        price: 159000, // Promo
                        originalPrice: 200000,
                        stock: 50,
                        sourceSkuId: "99887766",
                        platformStatus: "NORMAL",
                        status: "DRAFT",
                        promoId: "FLASH-SALE-99"
                    },
                    {
                        userId: user.id,
                        name: "Bìa Mềm (Lỗi Giá)",
                        sku: "TITAN-SOFT",
                        price: 90000,
                        originalPrice: 90000, // No promo
                        stock: 0,
                        sourceSkuId: "55443322",
                        platformStatus: "BANNED", // Test Red Badge
                        status: "DRAFT"
                    },
                    {
                        userId: user.id,
                        name: "Ebook (Siêu Rẻ)",
                        sku: "TITAN-EBOOK",
                        price: 10000,
                        originalPrice: 50000,
                        stock: 999,
                        sourceSkuId: "11223344",
                        platformStatus: "NORMAL",
                        status: "DRAFT",
                        promoId: "VOUCHER-50"
                    }
                ]
            }
        }
    })

    console.log(`Created product: ${product.name} (ID: ${product.id})`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
        // Explicitly end pool to exit process
        await pool.end()
    })
