import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { ProductBuilder } from "@/components/products/builder/product-builder"
import { ProductBuilderValues } from "@/components/products/builder/schema"

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (!session?.user?.id) redirect("/login")

    const { id } = await params

    // Fetch Product with Variants AND Listings to rebuild Channels
    const product = await prisma.product.findUnique({
        where: { id: id, userId: session.user.id },
        include: {
            variants: {
                include: {
                    listings: {
                        include: { shop: true }
                    }
                }
            }
        }
    })

    if (!product) notFound()

    // Transform Data to Form Schema
    // We need to map DB structure back to Builder Form Structure
    const defaultVariant = product.variants.find(v => v.name === "Default") || product.variants[0]
    const otherVariants = product.variants.filter(v => v.name !== "Default")
    const hasVariants = otherVariants.length > 0

    // Extract Unique Channels (Shops) from Listings
    // A product might have multiple variants linked to the same shop.
    // We derive the "Product Level" link from the variants.
    const channelMap = new Map<string, { shopId: string, shopName: string, platform: any, platformItemId: string }>()

    product.variants.forEach(v => {
        v.listings.forEach(l => {
            if (!channelMap.has(l.shopId)) {
                channelMap.set(l.shopId, {
                    shopId: l.shop.id,
                    shopName: l.shop.name,
                    platform: l.shop.platform,
                    platformItemId: l.platformItemId
                })
            }
        })
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
        sku: (hasVariants ? product.sku : (defaultVariant?.sku || product.sku)) || "",
        description: product.description || "",
        descriptionHtml: product.descriptionHtml || "",
        syncDescription: true,
        images: product.images,
        categoryId: product.categoryId || "",

        // Spec placeholders
        weight: 100,
        daysToShip: 2,
        attributes: [],

        hasVariants: hasVariants,

        // We won't try to reverse-engineer tiers yet, just load variants
        variationTiers: [],

        variants: hasVariants ? product.variants.map(v => ({
            id: v.id,
            name: v.name,
            sku: v.sku || "",
            price: Number(v.price),
            stock: v.stock,
            image: v.image || "",
            tierIndices: [], // We lost this context, fine for now
            barcode: v.barcode || ""
        })) : [],

        // Single Product Mode values
        price: !hasVariants ? Number(defaultVariant?.price || 0) : 0,
        stock: !hasVariants ? Number(defaultVariant?.stock || 0) : 0,
        barcode: !hasVariants ? (defaultVariant?.barcode || "") : "",

        channels: channels
    }

    return <ProductBuilder initialData={initialData} />
}
