
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

        // Create Single Product (Flat)
        const { searchParams } = new URL(req.url)
        const query = searchParams.get('query')
        const sourceId = searchParams.get('sourceId')

        const where: any = {
            userId: session.user.id
        }

        if (query) {
            where.name = { contains: query, mode: "insensitive" }
        }

        // Support fetching by Group/Source ID
        if (sourceId) {
            where.sourceId = sourceId
        }
        const product = await prisma.product.create({
            data: {
                userId: userId,
                name: data.name,
                description: data.description,
                descriptionHtml: data.descriptionHtml,
                categoryId: data.categoryId,
                images: data.images,
                sku: data.sku,
                price: data.price || 0,
                stock: data.stock || 0,
                weight: data.weight,
                status: "DRAFT", // Default to Draft
                barcode: data.barcode
                // No variants relation
            }
        })

        return NextResponse.json(product)
    } catch (error) {
        console.error("[PRODUCT_POST]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
