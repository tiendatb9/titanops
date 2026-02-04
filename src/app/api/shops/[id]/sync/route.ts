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

            // Parse Description
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
                include: { product: true } // product is now the relation (could be child or parent)
            })

            if (existingListing && existingListing.product) {
                // UPDATE
                await prisma.listing.update({
                    where: { id: existingListing.id },
                    data: {
                        syncStatus: 'SYNCED',
                        lastSyncAt: new Date(),
                        syncedStock: item.stock_info_v2?.summary_info?.total_available_stock || item.stock_info_v2?.seller_stock?.[0]?.stock || 0,
                    }
                })

                // Also update the Product rawJson
                await prisma.product.update({
                    where: { id: existingListing.product.id },
                    data: { rawJson: item as any }
                })
            } else {
                // CREATE NEW: Parent Product -> Child Product -> Listing
                // Assuming "Single Variant" mapping for now for simplicity,
                // or if item has models, we should create multiple children.
                // For MVP Sync, if no models, create 1 Default Child.

                // TODO: Handle item.has_model (Variations)

                const product = await prisma.product.create({
                    data: {
                        userId: shop.userId,
                        name: item.item_name,
                        description: description,
                        images: item.image?.image_url_list || [],
                        sku: item.item_sku || `SHOPEE-${item.item_id}`,
                        price: item.price_info?.[0]?.original_price || 0,
                        stock: item.stock_info_v2?.summary_info?.total_available_stock || item.stock_info_v2?.seller_stock?.[0]?.stock || 0,
                        status: "ACTIVE",
                        source: shop.platform,
                        sourceId: String(item.item_id),
                        rawJson: item as any
                    }
                })

                // Create Listing
                await prisma.listing.create({
                    data: {
                        shopId: shop.id,
                        productId: product.id,
                        platformItemId: String(item.item_id),
                        status: "ACTIVE",
                        syncStatus: "LINKED",
                        lastSyncAt: new Date(),
                        syncedPrice: item.price_info?.[0]?.original_price || 0,
                        syncedStock: item.stock_info_v2?.summary_info?.total_available_stock || item.stock_info_v2?.seller_stock?.[0]?.stock || 0
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
