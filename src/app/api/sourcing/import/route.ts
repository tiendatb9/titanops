import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from "@/lib/auth"

import { prisma } from "@/lib/prisma"

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

                status: "DRAFT",
                variants: {
                    create: {
                        userId: session.user.id, // REQUIRED: Child must assume ownership
                        name: "Default",
                        sku: `DRAFT-${Date.now()}-DEF`,
                        price: price || 0,
                        stock: 0,
                        status: "DRAFT"
                    }
                },
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
