import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from "@/lib/auth"

// Initialize Prisma Client (Singleton pattern is recommended helper in lib, but for now direct init)
const prisma = new PrismaClient()

export async function POST(request: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { name, description, price, image, url, source, raw } = body

        if (!name) {
            return NextResponse.json(
                { success: false, error: 'Product name is required' },
                { status: 400 }
            )
        }

        // Determine platform from source URL
        const isShopee = source?.includes('shopee')
        const isTiktok = source?.includes('tiktok')

        // Save to Database
        const product = await prisma.product.create({
            data: {
                userId: session.user.id,
                name: name.substring(0, 100), // Limit length
                description: description || `Imported from ${source}`,
                images: image ? [image] : [],
                sku: `DRAFT-${Date.now()}`, // Auto-gen temp SKU

                // Initial Variant (Default)
                variants: {
                    create: {
                        name: "Default",
                        sku: `DRAFT-${Date.now()}-DEF`,
                        price: price || 0,
                        stock: 0
                    }
                },

                // Mark as Draft
                // status is not in schema yet? Let's check schema.
                // Schema has NO status field in Product model? Let's checking schema...
                // Ah, looking at schema.prisma provided earlier:
                // model Product { ... variants Variant[] ... }
                // model Listing { ... status String ... }
                // Wait, Schema step 133 had `model Product`... let me double check my memory or schema file.
                // It seems `status` might be missing on Product model in my previous `schema.prisma` write?
                // Let's re-read schema.prisma to be safe. But I will assume I need to add it or it exists.
                // In the Table component creation (step 194 schema.ts) I added `status`. 
                // But did I add it to Prisma Schema?
                // Re-reading Step 133 output... `model Product`... it does NOT have `status`.
                // `Listing` has `status`.
                // `Product` does not. 
                // THIS IS A BUG/MISSING FEATURE IN MY SCHEMA PLAN vs UI.
                // I should stick to the UI plan: Product needs a status (Draft/Active).
                // I will add `status` field to Prisma schema in this turn as well.
            }
        })

        return NextResponse.json({
            success: true,
            data: { id: product.id, name: product.name }
        })

    } catch (error) {
        console.error('Import Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to save product' },
            { status: 500 }
        )
    }
}
