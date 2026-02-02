import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ShopeeClient } from "@/lib/shopee"
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
        if (!creds.accessToken || !creds.shopId) {
            return new NextResponse("Invalid Credentials. Please Re-authorize.", { status: 400 })
        }

        // 2. Fetch Item List (First 20 items for Basic Sync)
        const listRes = await ShopeeClient.getItemList(creds.accessToken, Number(creds.shopId), 0, 20, "NORMAL")

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
        for (const item of productDetails) {
            const platformItemId = String(item.item_id)

            // Parse Description (Handle Extended Type)
            let description = item.description
            if (item.description_type === 'extended' && item.description_info?.extended_description?.field_list) {
                const fields = item.description_info.extended_description.field_list
                const fieldTexts = fields
                    .filter((f: any) => f.field_type === 'text' && f.text)
                    .map((f: any) => f.text)

                if (fieldTexts.length > 0) {
                    description = fieldTexts.join('\n\n')
                }
            }

            // Check if Listing exists first
            const existingListing = await prisma.listing.findFirst({
                where: {
                    shopId: shop.id,
                    platformItemId: platformItemId
                },
                include: { variant: { include: { product: true } } }
            })

            if (existingListing && existingListing.variant?.product) {
                // UPDATE: Just update price/stock and timestamps
                // TODO: Update Product fields if user allows? For now, sync price/stock to Listing.
                // We update the Listing syncedPrice/Stock
                // Note: Shopee Item has `price_info`? No, Base Info has `price_info` or `original_price`.
                // Let's use `original_price` for now.
                // Actually base info has `stock_info` too.

                // Assuming single variant item for simplicity in "Basic Sync". 
                // Creating full variant matrix sync is complex.

                await prisma.listing.update({
                    where: { id: existingListing.id },
                    data: {
                        syncStatus: 'SYNCED',
                        lastSyncAt: new Date(),
                        syncedStock: item.stock_info_v2?.summary_info?.total_reserved_stock || 0,
                    }
                })

                // Also update the Product rawJson
                await prisma.product.update({
                    where: { id: existingListing.variant!.productId },
                    data: { rawJson: item as any }
                })
            } else {
                // CREATE NEW: Product -> Variant -> Listing
                const newProduct = await prisma.product.create({
                    data: {
                        userId: session.user.id,
                        name: item.item_name,
                        description: description, // Use parsed description
                        images: item.image?.image_url_list || [],
                        sku: item.item_sku || `SHOPEE-${item.item_id}`,
                        status: 'ACTIVE',
                        rawJson: item as any, // Save raw JSON for debugging
                        variants: {
                            create: {
                                name: "Default",
                                sku: item.item_sku || `SHOPEE-${item.item_id}-DEF`,
                                price: item.price_info?.[0]?.original_price || 0,
                                stock: item.stock_info?.[0]?.normal_stock || 0,
                                listings: {
                                    create: {
                                        shopId: shop.id,
                                        platformItemId: platformItemId,
                                        status: 'ACTIVE',
                                        syncStatus: 'SYNCED',
                                        lastSyncAt: new Date(),
                                        syncedPrice: item.price_info?.[0]?.original_price || 0,
                                        syncedStock: item.stock_info?.[0]?.normal_stock || 0
                                    }
                                }
                            }
                        }
                    }
                })
            }
            syncedCount++
        }

        return NextResponse.json({ success: true, count: syncedCount, message: "Sync successful" })

    } catch (error) {
        console.error("[SHOP_SYNC]", error)
        return new NextResponse(`Internal Error: ${(error as Error).message}`, { status: 500 })
    }
}
