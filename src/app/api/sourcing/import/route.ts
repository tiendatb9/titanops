
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

        // Determine items to insert (Flat Rows)
        let itemsToInsert: any[] = []

        const incomingVariants = (variants && Array.isArray(variants)) ? variants : []

        if (incomingVariants.length > 0) {
            // Check if it's effectively a Simple Product (1 default variant)
            if (incomingVariants.length === 1 && incomingVariants[0].name === "Default") {
                const v = incomingVariants[0]
                itemsToInsert.push({
                    ...body,
                    price: v.price || price || 0,
                    originalPrice: v.original_price || v.price || original_price || 0,
                    stock: v.stock || 0,
                    sku: v.sku || `DRAFT-${Date.now()}`,
                    promoId: v.promotion_id || promotion_id,
                    platformStatus: (v.status === 1 ? 'NORMAL' : 'BANNED'),
                    sourceSkuId: v.source_sku_id || source_id,
                    variantName: null // Simple product
                })
            } else {
                // Real Variants -> Create 1 Row per Variant
                itemsToInsert = incomingVariants.map((v: any) => ({
                    ...body,
                    // Variant Overrides
                    price: v.price || 0,
                    originalPrice: v.original_price || 0,
                    stock: v.stock || 0,
                    sku: v.sku || `DRAFT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    variantName: v.name, // "Màu Xanh"
                    sourceSkuId: v.source_sku_id ? String(v.source_sku_id) : undefined,
                    promoId: v.promotion_id ? String(v.promotion_id) : undefined,
                    platformStatus: v.status === 1 ? 'NORMAL' : 'BANNED',
                    // Use variant image if available, else master image
                    images: v.image ? [v.image] : (image ? [image] : [])
                }))
            }
        } else {
            // No Variants (Legacy Flat Payload)
            itemsToInsert.push({
                ...body,
                variantName: body.model_name || null,
                sourceSkuId: body.source_sku_id || body.mid || undefined,
                images: image ? [image] : [],
                price: price || 0,
                stock: 0,
                platformStatus: item_status || 'NORMAL'
            })
        }

        if (!name) {
            return NextResponse.json({ success: false, error: 'Name required' }, { status: 400 })
        }

        // Save SKUs concurrently or sequentially
        const savedIds: string[] = []

        // Use transaction? Or just loop. Loop is fine.
        for (const item of itemsToInsert) {
            const product = await prisma.product.create({
                data: {
                    userId: userId,
                    name: name.substring(0, 100),
                    variantName: item.variantName,
                    description: description || `Imported from ${source}`,
                    images: item.images || [],
                    sku: item.sku,

                    source: source || "shopee",
                    sourceId: source_id ? String(source_id) : undefined, // Shared ID
                    sourceSkuId: item.sourceSkuId ? String(item.sourceSkuId) : undefined,
                    sourceUrl: url,
                    sourceData: raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : undefined,

                    price: item.price,
                    stock: item.stock,

                    originalPrice: item.originalPrice,
                    promoPrice: item.price,

                    promoId: item.promoId ? String(item.promoId) : undefined,
                    daysToShip: days_to_ship || 2,
                    platformStatus: item.platformStatus,

                    status: "DRAFT",
                }
            })
            savedIds.push(product.id)
        }

        return NextResponse.json({
            success: true,
            data: { count: savedIds.length, ids: savedIds }
        })

    } catch (error) {
        console.error('Import Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to import' }, { status: 500 })
    }
}
