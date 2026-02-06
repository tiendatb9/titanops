
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { ProductBuilder } from "@/components/products/builder/product-builder"
import { ProductBuilderValues } from "@/components/products/builder/schema"

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (!session?.user?.id) redirect("/login")

    const { id } = await params

    // Fetch Single Product (Flat) without variants relation
    let product = await prisma.product.findUnique({
        where: { id: id, userId: session.user.id },
        include: {
            listings: {
                include: { shop: true }
            }
        }
    })

    // Fallback: Try searching by sourceId (Shopee Item ID) if not found by UUID
    if (!product) {
        product = await prisma.product.findFirst({
            where: { sourceId: id, userId: session.user.id },
            include: {
                listings: {
                    include: { shop: true }
                }
            }
        })
    }

    if (!product) {
        // DEBUGGING 404
        return (
            <div className="p-10 text-red-500 space-y-4">
                <h1 className="text-2xl font-bold">Product Not Found (404)</h1>
                <div className="bg-slate-100 p-4 rounded text-black font-mono text-sm">
                    <p><strong>Requested ID:</strong> {id}</p>
                    <p><strong>User ID:</strong> {session.user.id}</p>
                    <p><strong>Lookup 1 (Unique ID):</strong> Failed</p>
                    <p><strong>Lookup 2 (Source ID):</strong> Failed</p>
                    <p><strong>Suggestion:</strong> Check if this ID exists in the 'Product' table under 'id' or 'sourceId'.</p>
                </div>
                <Button asChild><Link href="/products">Back to List</Link></Button>
            </div>
        )
    }

    // Fetch Siblings/Variants (Flat Architecture: Group by sourceId)
    // If product has sourceId, fetch all products with same sourceId
    let variants: any[] = []
    let children: any[] = []

    if (product.sourceId) {
        children = await prisma.product.findMany({
            where: {
                sourceId: product.sourceId,
                id: { not: product.id } // Exclude self if needed, or include? 
                // Listing all variants including self is usually better for the grid, 
                // but 'product' is the main form data. 
                // Let's exclude self for now to avoid duplication in variants list if Builder handles it.
            },
            orderBy: { sku: 'asc' }
        })
    }

    const hasVariants = children.length > 0

    // Extract Unique Channels (Shops) from Listings
    const channelMap = new Map<string, { shopId: string, shopName: string, platform: any, platformItemId: string }>()

    // Check Master Listings
    product.listings.forEach(l => {
        if (!channelMap.has(l.shopId)) {
            channelMap.set(l.shopId, {
                shopId: l.shop.id,
                shopName: l.shop.name,
                platform: l.shop.platform,
                platformItemId: l.platformItemId
            })
        }
    })

    const channels = Array.from(channelMap.values()).map(c => ({
        shopId: c.shopId,
        shopName: c.shopName,
        platform: c.platform,
        platformItemId: c.platformItemId,
        isActive: true
    }))

    const initialData: ProductBuilderValues & { id: string } = {
        id: product.id,
        name: product.name,
        sku: product.sku || "",
        description: product.description || "",
        descriptionHtml: product.descriptionHtml || "",
        syncDescription: true,
        images: product.images,
        categoryId: product.categoryId || "",

        // Spec placeholders
        weight: product.weight || 100,
        daysToShip: 2,
        attributes: [],

        hasVariants: hasVariants,

        variationTiers: [],

        // Map children to builder variants format
        variants: children.map(child => ({
            id: child.id,
            name: child.variantName || child.name,
            price: Number(child.price),
            stock: child.stock,
            sku: child.sku || "",
            image: child.images[0] || "",
            options: [], // Placeholder as we don't have parsed options
            tierIndices: [] // Placeholder
        })),

        // Single Product Mode values
        price: Number(product.price),
        stock: product.stock,
        barcode: product.barcode || "",

        channels: channels
    }

    return <ProductBuilder initialData={initialData} />
}
