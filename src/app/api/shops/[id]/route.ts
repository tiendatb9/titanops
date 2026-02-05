import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const updateShopSchema = z.object({
    name: z.string().min(1, "Name is required"),
    isActive: z.boolean().optional()
})

export const dynamic = 'force-dynamic' // Force dynamic

export async function PATCH(
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
        const body = await req.json()

        const result = updateShopSchema.safeParse(body)
        if (!result.success) {
            return new NextResponse("Invalid Data", { status: 400 })
        }

        // Verify ownership
        const existingShop = await prisma.shop.findUnique({
            where: { id: shopId, userId: session.user.id }
        })

        if (!existingShop) {
            return new NextResponse("Shop not found", { status: 404 })
        }

        const updatedShop = await prisma.shop.update({
            where: { id: shopId },
            data: {
                name: result.data.name,
                isActive: result.data.isActive
            }
        })

        return NextResponse.json(updatedShop)
    } catch (error) {
        console.error("[SHOP_PATCH]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function DELETE(
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

        // Verify ownership
        const existingShop = await prisma.shop.findUnique({
            where: { id: shopId, userId: session.user.id }
        })

        if (!existingShop) {
            return new NextResponse("Shop not found", { status: 404 })
        }

        await prisma.shop.delete({
            where: { id: shopId }
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error("[SHOP_DELETE]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
