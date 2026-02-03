
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

            // 2. Handle Variants (Recursive Products)
            let variants: any[] = []

            if (data.hasVariants && data.variants.length > 0) {
                // Create Child Products
                for (const v of data.variants) {
                    const child = await tx.product.create({
                        data: {
                            userId: userId,
                            parentId: product.id, // Link to Parent
                            name: v.name,
                            sku: v.sku,
                            barcode: v.barcode,
                            price: v.price || 0,
                            stock: v.stock || 0,
                            images: v.image ? [v.image] : [],
                            status: "ACTIVE"
                        }
                    })
                    variants.push(child)
                }
            } else {
                // Single Product Mode: Create a "Default" Child?
                // In new model, Single Product IS the SKU.
                // But to keep architecture consistent (Parent -> Child -> Listing), we can create a Default child.
                // OR we link Listing to Parent? 
                // The prompt discussion implied "Every SKU has its own ID". 
                // Let's create a Default child for consistency in Listings linking.
                const child = await tx.product.create({
                    data: {
                        userId: userId,
                        parentId: product.id,
                        name: "Default",
                        sku: data.sku,
                        barcode: data.barcode,
                        price: data.price || 0,
                        stock: data.stock || 0,
                        images: data.images[0] ? [data.images[0]] : [],
                        status: "ACTIVE"
                    }
                })
                variants.push(child)
            }

            // 3. Create Listings (Channels)
            // Link listings to the Created Child Products (variants)

            for (const channel of data.channels) {
                if (channel.isActive) {
                    // Create Listing for EACH child product
                    for (const variant of variants) {
                        await tx.listing.create({
                            data: {
                                shopId: channel.shopId,
                                productId: variant.id, // Valid: Linking to Child Product
                                platformItemId: "PENDING",
                                status: "ACTIVE",
                                syncStatus: "PENDING",
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
