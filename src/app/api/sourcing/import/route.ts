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

        // Detect if this is a "Simple Product" (Single Default Variant)
        // Heuristic: variants array has 1 item AND name is "Default"
        let isSimpleProduct = false
        const incomingVariants = (variants && Array.isArray(variants)) ? variants : []

        if (incomingVariants.length === 1 && incomingVariants[0].name === "Default") {
            isSimpleProduct = true
        } else if (incomingVariants.length === 0) {
            // Logic for empty variants -> Treat as Simple?
            // But usually extension sends at least one.
            // Assume simple if empty too, but check price.
            isSimpleProduct = true
        }

        let variantsCreateData: any[] = []

        // Final values for Parent (merged from variant if simple)
        let finalPrice = price || 0
        let finalOriginalPrice = original_price || finalPrice || 0
        let finalStock = 0
        let finalSku = `DRAFT-${Date.now()}`
        let finalPromoId = promotion_id
        let finalPlatformStatus = item_status || 'NORMAL'
        let finalSourceSkuId = undefined

        if (isSimpleProduct) {
            // FLATTEN: Take data from the Default Variant (or body if empty)
            const v = incomingVariants[0] || {}
            finalPrice = v.price || finalPrice
            finalOriginalPrice = v.original_price || v.price || finalOriginalPrice
            finalStock = v.stock || 0
            finalSku = v.sku || finalSku
            finalPromoId = v.promotion_id || finalPromoId
            finalPlatformStatus = (v.status === 1 ? 'NORMAL' : 'BANNED') || finalPlatformStatus
            finalSourceSkuId = v.source_sku_id || source_id // Use item_id as sku_id if simple

            // DO NOT create child variants
            variantsCreateData = []
        } else {
            // VARIATED: Process variants normally
            variantsCreateData = incomingVariants.map((v: any) => ({
                userId: userId,
                name: v.name || "Variant",
                sku: v.sku || `DRAFT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                price: v.price || 0,
                stock: v.stock || 0,
                images: v.image ? [v.image] : [],
                status: "DRAFT",
                sourceSkuId: v.source_sku_id ? String(v.source_sku_id) : undefined,

                originalPrice: v.original_price || 0,
                promoPrice: v.price || 0,
                promoId: v.promotion_id ? String(v.promotion_id) : undefined,
                daysToShip: days_to_ship || 2,
                platformStatus: v.status === 1 ? 'NORMAL' : 'BANNED'
            }))

            // Parent aggregations
            finalStock = variantsCreateData.reduce((acc, v) => acc + v.stock, 0)
            // Parent Price: Could be min or max. default to 0 to force user to look at variants?
            // Or use price from body if available.
        }

        if (!name) {
            return NextResponse.json(
                { success: false, error: 'Product name is required' },
                { status: 400 }
            )
        }

        // Save to Database
        const product = await prisma.product.create({
            data: {
                userId: userId,
                name: name.substring(0, 100),
                description: description || `Imported from ${source}`,
                images: image ? [image] : [],
                sku: finalSku,

                source: source || "shopee",
                sourceId: source_id ? String(source_id) : undefined,
                sourceSkuId: finalSourceSkuId ? String(finalSourceSkuId) : undefined, // Map Source SKU ID
                sourceUrl: url,
                sourceData: raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : undefined,

                // Rich Master Data (Flattened or Aggregated)
                price: finalPrice,
                stock: finalStock,
                originalPrice: finalOriginalPrice,
                promoPrice: finalPrice, // Same as price (current selling)
                promoId: finalPromoId ? String(finalPromoId) : undefined,
                daysToShip: days_to_ship || 2,
                platformStatus: finalPlatformStatus,

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
