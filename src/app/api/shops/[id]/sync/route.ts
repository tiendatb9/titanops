import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ShopeeClient } from "@/lib/shopee"
import { ShopeeAuthService } from "@/lib/services/shopee-auth"
import { NextResponse } from "next/server"

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const resolvedParams = await params
        const shopId = resolvedParams.id

        // 1. Get Shop Credentials
        const shop = await prisma.shop.findUnique({
            where: { id: shopId, userId: session.user.id }
        })

        if (!shop || !shop.credentials || typeof shop.credentials !== 'object') {
            return new NextResponse("Shop not found or missing credentials", { status: 404 })
        }

        const creds = shop.credentials as any
        /*
        if (!creds.accessToken || !creds.shopId) { // Credentials might be old structure
            // But we use Service now.
        }
        */

        // 2. Get Valid Access Token (Auto Refresh)
        let accessToken = ""
        try {
            accessToken = await ShopeeAuthService.getValidAccessToken(shop.id)
        } catch (e) {
            return new NextResponse(`Authentication Error: ${(e as Error).message}. Please Re-connect Shop.`, { status: 401 })
        }

        // 3. Fetch Item List
        const listRes = await ShopeeClient.getItemList(accessToken, Number(shop.platformShopId), 0, 20, "NORMAL")

        if (listRes.error) {
            return NextResponse.json({ success: false, error: listRes.message || "Shopee Error" }, { status: 500 })
        }

        const items = listRes.response?.item || []
        if (items.length === 0) {
            return NextResponse.json({ success: true, count: 0, message: "No active products found on Shopee." })
        }

        const itemIds = items.map((i: any) => i.item_id)

        // 3. Fetch Item Details
        const detailsRes = await ShopeeClient.getItemBaseInfo(creds.accessToken, Number(creds.shopId), itemIds)

        if (detailsRes.error) {
            return NextResponse.json({ success: false, error: detailsRes.message || "Shopee Detail Error" }, { status: 500 })
        }

        const productDetails = detailsRes.response?.item_list || []
        let syncedCount = 0

        // 4. Upsert Products
        // 4. Fetch Variants (Model List) for items that have them
        const itemsWithModel = productDetails.filter((i: any) => i.has_model)
        const modelMap: Record<number, any[]> = {}

        if (itemsWithModel.length > 0) {
            console.log(`[Sync] Fetching models for ${itemsWithModel.length} items...`)
            // Simple sequential batch to avoid rate limits (User suggested parallel limit, here we iterate)
            // Ideally use Promise.all with concurrency limit.
            for (const item of itemsWithModel) {
                try {
                    const modelRes = await ShopeeClient.getModelList(creds.accessToken, Number(creds.shopId), item.item_id)
                    if (modelRes.response?.model) {
                        modelMap[item.item_id] = modelRes.response.model
                    }
                } catch (e) {
                    console.error(`Error fetching model for ${item.item_id}`, e)
                }
            }
        }

        // 5. Upsert Products (Flat Architecture)
        for (const item of productDetails) {
            // Common Fields
            let description = item.description
            if (item.description_type === 'extended' && item.description_info?.extended_description?.field_list) {
                const fields = item.description_info.extended_description.field_list
                const fieldTexts = fields
                    .filter((f: any) => f.field_type === 'text' && f.text)
                    .map((f: any) => f.text)

                if (fieldTexts.length > 0) description = fieldTexts.join('\n\n')
            }

            const baseProductData = {
                userId: shop.userId,
                name: item.item_name,
                description: description,
                images: item.image?.image_url_list || [],
                status: "ACTIVE",
                source: shop.platform,
                sourceId: String(item.item_id),
                daysToShip: item.pre_order ? item.pre_order.days_to_ship : 2,
                platformStatus: item.item_status || "NORMAL"
            }

            const hasModel = item.has_model && modelMap[item.item_id] && modelMap[item.item_id].length > 0

            if (hasModel) {
                // Case A: Has Variants -> Create 1 Product per Variant
                const models = modelMap[item.item_id]
                for (const model of models) {
                    const modelSku = model.model_sku || `${item.item_sku || 'SHOPEE'}-${model.model_id}`

                    // Price Logic
                    // Shopee V2 API: price_info[0] usually contains current status
                    const priceInfo = model.price_info?.[0]
                    const originalPrice = priceInfo?.original_price || 0
                    const currentPrice = priceInfo?.current_price || originalPrice
                    const promotionId = model.promotion_id || null // Check API response structure if needed

                    const stock = model.stock_info_v2?.summary_info?.total_available_stock || model.stock_info_v2?.seller_stock?.[0]?.stock || 0

                    // Upsert Logic
                    const existingListing = await prisma.listing.findFirst({
                        where: {
                            shopId: shop.id,
                            platformItemId: String(item.item_id),
                            platformSkuId: String(model.model_id)
                        },
                        include: { product: true }
                    })

                    const richData = {
                        originalPrice: originalPrice,
                        promoPrice: currentPrice,
                        promoId: promotionId ? String(promotionId) : null,
                    }

                    if (existingListing && existingListing.product) {
                        // Update
                        await prisma.product.update({
                            where: { id: existingListing.product.id },
                            data: {
                                ...baseProductData,
                                name: `${item.item_name} - ${model.model_name}`,
                                variantName: model.model_name,
                                sku: modelSku,
                                price: currentPrice, // Use Current (Promo) Price as Main Price
                                ...richData,
                                stock: stock,
                                rawJson: { item, model } as any
                            }
                        })
                        await prisma.listing.update({
                            where: { id: existingListing.id },
                            data: {
                                syncStatus: 'SYNCED',
                                lastSyncAt: new Date(),
                                syncedStock: stock,
                                syncedPrice: currentPrice
                            }
                        })
                    } else {
                        // Create New
                        const product = await prisma.product.create({
                            data: {
                                ...baseProductData,
                                name: `${item.item_name} - ${model.model_name}`,
                                variantName: model.model_name,
                                sku: modelSku,
                                price: currentPrice,
                                ...richData,
                                stock: stock,
                                sourceSkuId: String(model.model_id),
                                rawJson: { item, model } as any
                            }
                        })
                        await prisma.listing.create({
                            data: {
                                shopId: shop.id,
                                productId: product.id,
                                platformItemId: String(item.item_id),
                                platformSkuId: String(model.model_id),
                                platformSku: modelSku,
                                status: "ACTIVE",
                                syncStatus: "LINKED",
                                lastSyncAt: new Date(),
                                syncedPrice: currentPrice,
                                syncedStock: stock
                            }
                        })
                    }
                    syncedCount++
                }

            } else {
                // Case B: No Variants (Single Item)
                const platformItemId = String(item.item_id)
                const sku = item.item_sku || `SHOPEE-${item.item_id}`

                const priceInfo = item.price_info?.[0]
                const originalPrice = priceInfo?.original_price || 0
                const currentPrice = priceInfo?.current_price || originalPrice
                const promotionId = item.promotion_id || null

                const stock = item.stock_info_v2?.summary_info?.total_available_stock || item.stock_info_v2?.seller_stock?.[0]?.stock || 0

                const richData = {
                    originalPrice: originalPrice,
                    promoPrice: currentPrice,
                    promoId: promotionId ? String(promotionId) : null,
                }

                // Find Listing
                const existingListing = await prisma.listing.findFirst({
                    where: {
                        shopId: shop.id,
                        platformItemId: platformItemId,
                        platformSkuId: null // Single item has no sku_id/model_id usually? Or 0? Shopee uses 0 sometimes?
                        // If has_model is false, listing usually doesn't have sku_id.
                    },
                    include: { product: true }
                })

                if (existingListing && existingListing.product) {
                    await prisma.product.update({
                        where: { id: existingListing.product.id },
                        data: {
                            ...baseProductData,
                            sku: sku,
                            price: currentPrice,
                            ...richData,
                            stock: stock,
                            variantName: null,
                            rawJson: item as any
                        }
                    })
                    await prisma.listing.update({
                        where: { id: existingListing.id },
                        data: {
                            syncStatus: 'SYNCED',
                            lastSyncAt: new Date(),
                            syncedStock: stock,
                            syncedPrice: currentPrice
                        }
                    })
                } else {
                    const product = await prisma.product.create({
                        data: {
                            ...baseProductData,
                            sku: sku,
                            price: currentPrice,
                            ...richData,
                            stock: stock,
                            sourceSkuId: null, // No unique Variant ID for single item
                            variantName: null,
                            rawJson: item as any
                        }
                    })
                    await prisma.listing.create({
                        data: {
                            shopId: shop.id,
                            productId: product.id,
                            platformItemId: platformItemId,
                            platformSkuId: null,
                            platformSku: sku,
                            status: "ACTIVE",
                            syncStatus: "LINKED",
                            lastSyncAt: new Date(),
                            syncedPrice: currentPrice,
                            syncedStock: stock
                        }
                    })
                }
                syncedCount++
            }
        }

        return NextResponse.json({ success: true, count: syncedCount, message: "Sync successful" })

    } catch (error) {
        console.error("[SHOP_SYNC]", error)
        return new NextResponse(`Internal Error: ${(error as Error).message}`, { status: 500 })
    }
}
