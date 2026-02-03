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
        const { name, description, price, image, url, source, raw, variants, source_id } = body
        const userId = session.user.id
        const userId = session.user.id

        // Prepare variants data
        let variantsCreateData: any[] = []
        if (variants && Array.isArray(variants) && variants.length > 0) {
            variantsCreateData = variants.map((v: any) => ({
                userId: userId,
                name: v.name || "Variant",
                sku: v.sku || `DRAFT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                price: v.price || price || 0,
                stock: v.stock || 0,
                images: v.image ? [v.image] : [],
                status: "DRAFT",
                sourceSkuId: v.source_sku_id ? String(v.source_sku_id) : undefined
            }))
        } else {
            // Default Variant
            variantsCreateData = [{
                userId: session.user.id,
                name: "Default",
                sku: `DRAFT-${Date.now()}-DEF`,
                price: price || 0,
                stock: 0,
                status: "DRAFT",
                sourceSkuId: source_id ? String(source_id) : undefined
            }]
        }

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

                source: source || "shopee",
                sourceId: source_id ? String(source_id) : undefined,
                sourceUrl: url,
                sourceData: raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : undefined,

                status: "DRAFT",
                variants: {
                    create: variantsCreateData
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
