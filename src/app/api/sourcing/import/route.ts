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
        const {
            name, description, price, image, url, source, raw, variants, source_id,
            original_price, promotion_id, item_status, days_to_ship
        } = body
        const userId = session.user.id

        // Prepare variants data
        let variantsCreateData: any[] = []
        if (variants && Array.isArray(variants) && variants.length > 0) {
            variantsCreateData = variants.map((v: any) => ({
                userId: userId,
                name: v.name || "Variant",
                sku: v.sku || `DRAFT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                price: v.price || price || 0, // Promo Price (Selling Price)
                stock: v.stock || 0,
                images: v.image ? [v.image] : [],
                status: "DRAFT",
                sourceSkuId: v.source_sku_id ? String(v.source_sku_id) : undefined,

                // Rich Data for Variants
                originalPrice: v.original_price || 0,
                promoPrice: v.price || 0,
                promoId: v.promotion_id ? String(v.promotion_id) : undefined,
                daysToShip: days_to_ship || 2,
                platformStatus: v.status === 1 ? 'NORMAL' : 'BANNED' // Simple mapping
            }))
        } else {
            // Default Variant
            variantsCreateData = [{
                userId: userId,
                name: "Default",
                sku: `DRAFT-${Date.now()}-DEF`,
                price: price || 0,
                stock: 0,
                status: "DRAFT",
                sourceSkuId: source_id ? String(source_id) : undefined,

                originalPrice: original_price || price || 0,
                promoPrice: price || 0,
                promoId: promotion_id ? String(promotion_id) : undefined,
                daysToShip: days_to_ship || 2,
                platformStatus: item_status || 'NORMAL'
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
                userId: userId,
                name: name.substring(0, 100), // Limit length
                description: description || `Imported from ${source}`,
                images: image ? [image] : [],
                sku: `DRAFT-${Date.now()}`, // Auto-gen temp SKU

                source: source || "shopee",
                sourceId: source_id ? String(source_id) : undefined,
                sourceUrl: url,
                sourceData: raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : undefined,

                // Rich Master Data
                originalPrice: original_price || price || 0,
                promoPrice: price || 0,
                promoId: promotion_id ? String(promotion_id) : undefined,
                daysToShip: days_to_ship || 2,
                platformStatus: item_status || 'NORMAL',

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
