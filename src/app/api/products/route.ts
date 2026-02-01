
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { ProductBuilderValues, productBuilderSchema } from "@/components/products/builder/schema"

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

        const body = await req.json()
        const result = productBuilderSchema.safeParse(body)

        if (!result.success) {
            return new NextResponse("Invalid Data", { status: 400 })
        }

        const data = result.data

        const userId = session.user.id

        // Transaction to ensure atomicity
        const newProduct = await prisma.$transaction(async (tx) => {
            // 1. Create Master Product
            const product = await tx.product.create({
                data: {
                    userId: userId,
                    name: data.name,
                    description: data.description,
                    descriptionHtml: data.descriptionHtml,
                    categoryId: data.categoryId,
                    images: data.images,
                    status: "DRAFT", // Default to Draft until published
                    // We might want to store attributes in a JSON field if schema allowed, 
                    // or just omit for now if not in schema. 
                    // Checking schema: Product has no attributes field. 
                    // We'll skip attributes persistence for now or add it to schema later.
                }
            })

            // 2. Handle Variants
            if (data.hasVariants && data.variants.length > 0) {
                // Create Variants
                for (const v of data.variants) {
                    await tx.variant.create({
                        data: {
                            productId: product.id,
                            name: v.name,
                            sku: v.sku,
                            barcode: v.barcode,
                            price: v.price || 0,
                            stock: v.stock || 0,
                            image: v.image
                        }
                    })
                }
            } else {
                // Single Product Mode: Create a "Default" Variant or just use Product fields?
                // Our schema says Variant is optional for Listing if we map directly? 
                // Wait, Listing relates to Variant?
                // model Listing { variantId String? ... }
                // Ideally, even single products should have 1 Master Variant (Default) across system to unify logic
                // But for simplicity let's assume Single Mode just uses Product level data?
                // Actually the `Listing` model links to `Shop`. 
                // Let's create a "Default" variant for Single Product to keep architecture consistent (Master -> Variant -> Listing)

                await tx.variant.create({
                    data: {
                        productId: product.id,
                        name: "Default",
                        sku: data.sku, // Master SKU
                        barcode: data.barcode,
                        price: data.price || 0,
                        stock: data.stock || 0,
                        image: data.images[0] // Use first image
                    }
                })
            }

            // 3. Create Listings (Channels)
            // We need to fetch the created variants to link them
            const createdVariants = await tx.variant.findMany({ where: { productId: product.id } })

            // For now, if it's single product, we link all listings to that single variant.
            // If it's multi-variant, the "Channel Override" UI currently only sets price/stock globally for the shop (Multiplier logic maybe?)
            // OR the Channel Publisher UI logic defaults to "All Variants in this Shop get this price override?".
            // The current UI sends `channels` array which has generic price/stock.
            // Let's assume this applies to ALL variants for that shop.

            for (const channel of data.channels) {
                if (channel.isActive) {
                    // Create Listing for EACH variant
                    for (const variant of createdVariants) {
                        await tx.listing.create({
                            data: {
                                shopId: channel.shopId,
                                variantId: variant.id,
                                platformItemId: "PENDING", // Will be updated after sync
                                status: "ACTIVE",
                                syncStatus: "PENDING",
                                // Simple override logic: If channel has explicit price, use it. Else use variant price.
                                syncedPrice: channel.price && channel.price > 0 ? channel.price : variant.price,
                                syncedStock: channel.stock && channel.stock > 0 ? channel.stock : variant.stock,
                            }
                        })
                    }
                }
            }

            return product
        })

        return NextResponse.json(newProduct)
    } catch (error) {
        console.error("[PRODUCT_POST]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
