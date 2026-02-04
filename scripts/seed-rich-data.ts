
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

// Initialize Prisma with logging
const prisma = new PrismaClient({
    log: ['info', 'warn', 'error']
})

async function main() {
    let user = await prisma.user.findFirst()
    if (!user) {
        console.log("No user found, creating dummy user...")
        user = await prisma.user.create({
            data: {
                name: "Admin User",
                email: "admin@example.com",
                password: "password_hash_dummy",
                plan: "FREE",
            }
        })
    }

    console.log(`Seeding data for user: ${user.id}`)

    // Create Flat Products (Mocking the google sheet structure)
    // 1. A Simple Product
    await prisma.product.create({
        data: {
            userId: user.id,
            name: "Sách Thị Đại Học Toàn Cầu (Tập 4 - Đặc Biệt)",
            sku: "SKY3949",
            variantName: null,
            description: "Mô tả sách...",
            images: ["https://cf.shopee.vn/file/sg-11134201-22120-4r0007u8tpzg4ec6j1"],
            price: 98000,
            originalPrice: 98000,
            stock: 0,
            status: "DRAFT",
            sourceId: "28687652504",
            platformStatus: "BANNED"
        }
    })

    // 2. A Variated Product (Broken into Flat Rows)
    const variatedBase = {
        userId: user.id,
        name: "Sách Codename Bản Đặc Biệt",
        description: "Mô tả codename...",
        images: ["https://cf.shopee.vn/file/sg-11134201-22120-45056039877"],
        sourceId: "45056039877"
    }

    // Variant 1
    await prisma.product.create({
        data: {
            ...variatedBase,
            variantName: "Bản Đặc Biệt",
            sku: "SKY3930",
            price: 399000,
            stock: 0,
            status: "DRAFT",
            sourceSkuId: "420463002653",
            platformStatus: "NORMAL"
        }
    })

    // Variant 2
    await prisma.product.create({
        data: {
            ...variatedBase,
            variantName: "Bản Thường Ind...",
            sku: "SKY3935",
            price: 225000,
            stock: 0,
            status: "DRAFT",
            sourceSkuId: "420463002654",
            platformStatus: "NORMAL"
        }
    })

    console.log("Seeding finished with Flat Architecture.")
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
