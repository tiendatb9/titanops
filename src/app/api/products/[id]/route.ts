import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic' // Force dynamic to prevent build crash

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
        const userId = session.user.id

        // Validate ownership
        const existingProduct = await prisma.product.findUnique({
            where: { id: productId, userId: userId }
        })

        if (!existingProduct) {
            return new NextResponse("Product not found", { status: 404 })
        }

        // Destructure fields from body for the update
        const {
            name,
            sku,
            description,
            descriptionHtml,
            images,
            categoryId,
            brand, // Assuming 'brand' is a new field from the body
            price,
            stock,
            weight,
            daysToShip, // Assuming 'daysToShip' is a new field from the body
            status, // Assuming 'status' is a new field from the body
            barcode // Assuming 'barcode' is a new field from the body
        } = body

        // Update Main Product
        const updatedProduct = await prisma.product.update({
            where: { id: productId, userId: userId },
            data: {
                name,
                sku,
                description,
                descriptionHtml,
                images,
                categoryId,
                brand,
                price: price || 0, // Ensure price has a default if not provided
                stock: stock || 0, // Ensure stock has a default if not provided
                weight,
                daysToShip,
                status,
                barcode
                // No variants relation
            }
        })

        return NextResponse.json(updatedProduct)
    } catch (error) {
        console.error("[PRODUCT_UPDATE]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
