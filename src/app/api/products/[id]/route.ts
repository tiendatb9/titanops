import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const body = await req.json()
        const { id: productId } = await params

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
                    sku: body.sku,
                    price: body.price || 0,
                    stock: body.stock || 0,
                    weight: body.weight,
                    // width, height, depth if sent
                }
            })

            // 2. Handle Variants (Child Products)
            if (body.hasVariants && body.variants.length > 0) {
                for (const v of body.variants) {
                    if (v.id) {
                        // Update existing Child Product
                        // Verify it is a child of this product
                        const existingChild = await tx.product.findFirst({
                            where: { id: v.id, parentId: product.id }
                        })

                        if (existingChild) {
                            await tx.product.update({
                                where: { id: v.id },
                                data: {
                                    name: v.name,
                                    sku: v.sku,
                                    barcode: v.barcode,
                                    price: v.price,
                                    stock: v.stock,
                                    images: v.image ? [v.image] : [],
                                    status: 'ACTIVE'
                                }
                            })
                        }
                    } else {
                        // Create new Child Product
                        await tx.product.create({
                            data: {
                                userId: session.user.id,
                                parentId: product.id,
                                name: v.name,
                                sku: v.sku,
                                barcode: v.barcode,
                                price: v.price || 0,
                                stock: v.stock || 0,
                                images: v.image ? [v.image] : [],
                                status: 'ACTIVE'
                            }
                        })
                    }
                }
            } else {
                // Single Product Mode: 
                // We already updated the Master Product at step 1.
                // Ensure no rogue children exist? (Optional cleanup)
            }

            return product
        })

        return NextResponse.json(updatedProduct)
    } catch (error) {
        console.error("[PRODUCT_UPDATE]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
