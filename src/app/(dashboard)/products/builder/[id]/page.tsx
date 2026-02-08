
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
    const product = await prisma.product.findUnique({
        where: { id: id, userId: session.user.id },
        include: {
            listings: {
                include: { shop: true }
            }
        }
    })

    if (!product) notFound()

    // Fetch Variants (Siblings by Source ID)
    let variants: any[] = []

    if (product.sourceId) {
        variants = await prisma.product.findMany({
            where: {
                sourceId: product.sourceId,
                status: { not: 'archived' }
            }
        })
    } else {
        // If no sourceId, check if this product IS a variant or just single
        // Since we don't have parentId, we can't easily find siblings without sourceId.
        // So we default to just this product.
        variants = [product]
    }

    const hasVariants = variants.length > 0 && !!product.sourceId

    // Map to Builder Variant Schema (must include tierIndices)
    const mappedVariants = variants.map((v: any) => ({
        id: v.id,
        name: v.variantName || v.name,
        sku: v.sku || "",
        price: Number(v.price),
        stock: v.stock,
        image: v.images?.[0] || "",
        options: v.variantName ? [v.variantName] : [],
        tierIndices: [] // Required by schema
    }))

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

        variants: mappedVariants,

        // Single Product Mode values
        price: Number(product.price),
        stock: product.stock,
        barcode: product.barcode || "",

        channels: channels
    }

    return <ProductBuilder initialData={initialData} />
}
