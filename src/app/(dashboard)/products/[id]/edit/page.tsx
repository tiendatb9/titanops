
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { ProductEditor } from "@/components/products/product-editor"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: PageProps) {
    const session = await auth()
    if (!session?.user?.id) return redirect("/login")

    const { id } = await params

    // Fetch Product with rawJson
    const product = await prisma.product.findUnique({
        where: { id, userId: session.user.id },
        include: {
            listings: {
                include: { shop: true } // To know which shop/platform it belongs to
            }
        }
    })

    if (!product) return notFound()

    // Determine Platform/Credentials source
    // In Flat Schema, a Product might be linked to MULTIPLE listings (if cross-posted).
    // But currently we import 1-to-1.
    // We need the Shop Credentials to fetch Attributes/Logistics.
    // We pick the first listing to get the Shop.

    const primaryListing = product.listings[0]
    const shopId = primaryListing?.shopId

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Chỉnh sửa sản phẩm</h2>
            </div>
            <div className="hidden h-full flex-1 flex-col space-y-8 md:flex">
                <ProductEditor
                    product={product}
                    shopId={shopId} // Pass Shop ID for API calls
                />
            </div>
        </div>
    )
}
