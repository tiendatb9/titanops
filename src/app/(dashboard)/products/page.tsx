
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ProductsClient } from "./client"

export default async function ProductsPage() {
    const session = await auth()
    if (!session?.user?.id) return redirect("/login")

    // Fetch Real Products
    const products = await prisma.product.findMany({
        where: { userId: session.user.id },
        orderBy: { updatedAt: 'desc' }
    })

    // Transform Decimal to Number for Client safety
    const safeProducts = products.map((p: any) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        price: Number(p.price),
        stock: p.stock,
        status: p.status,
        images: p.images,
        source: p.source,
        platformStatus: p.platformStatus
    }))

    return <ProductsClient data={safeProducts} />
}
