
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'


// Load environment variables for Node.js script context
if (process.env.NODE_ENV !== 'production') {
    try {
        process.loadEnvFile()
    } catch (e) {
        // .env might not exist or be needed in prod if env vars are injected
    }
}

const prisma = new PrismaClient()

async function main() {
    const email = 'admin@titanops.com'
    const password = await bcrypt.hash('admin123', 10)

    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            name: 'Admin User',
            password,
            image: '/avatars/shadcn.jpg',
            plan: 'BUSINESS'
        },
    })

    console.log({ user })
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
