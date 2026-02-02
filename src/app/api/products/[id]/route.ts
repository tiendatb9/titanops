import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const body = await req.json()
        const productId = params.id

        // Validate ownership
        const existingProduct = await prisma.product.findUnique({
            where: { id: productId, userId: session.user.id }
        })

        if (!existingProduct) {
            return new NextResponse("Product not found", { status: 404 })
        }

        // Transaction for Atomicity
        const updatedProduct = await prisma.$transaction(async (tx) => {
            // 1. Update Master Product
            const product = await tx.product.update({
                where: { id: productId },
                data: {
                    name: body.name,
                    description: body.description,
                    descriptionHtml: body.descriptionHtml,
                    categoryId: body.categoryId,
                    images: body.images,
                    sku: body.sku, // Update Master SKU
                }
            })

            // 2. Handle Variants
            // Strategy: 
            // - Update existing variants (match by ID or SKU)
            // - Create new variants
            // - Delete removed variants (Optional, maybe too dangerous for now? Let's just update/upsert)

            // For this Implementation, we will iterate through the submitted variants and Upsert them.
            // We won't delete missing variants yet to avoid data loss of existing listings, unless explicitly requested.
            // But usually Product Builder reflects the "Source of Truth".
            // Let's safe-guard: We mainly update specific fields.

            if (body.hasVariants && body.variants.length > 0) {
                for (const v of body.variants) {
                    if (v.id) {
                        // Update existing
                        await tx.variant.update({
                            where: { id: v.id },
                            data: {
                                name: v.name,
                                sku: v.sku,
                                barcode: v.barcode,
                                price: v.price,
                                stock: v.stock,
                                image: v.image
                            }
                        })
                    } else {
                        // Create new
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
                }
            } else {
                // Single Product Mode: Update the "Default" variant or the ONLY variant
                // Find the default variant
                const variants = await tx.variant.findMany({ where: { productId: product.id } })
                if (variants.length > 0) {
                    const targetVariant = variants[0] // Usually just one in single mode
                    await tx.variant.update({
                        where: { id: targetVariant.id },
                        data: {
                            sku: body.sku,
                            barcode: body.barcode,
                            price: body.price,
                            stock: body.stock,
                            image: body.images[0]
                        }
                    })
                }
            }

            return product
        })

        return NextResponse.json(updatedProduct)
    } catch (error) {
        console.error("[PRODUCT_UPDATE]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
