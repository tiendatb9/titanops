import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { ProductBuilder } from "@/components/products/builder/product-builder"
import { ProductBuilderValues } from "@/components/products/builder/schema"

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (!session?.user?.id) redirect("/login")

    const { id } = await params

    // Fetch Product with Children (Variants) AND Listings
    // Note: 'variants' relation now points to 'Product' table with parentId
    const product = await prisma.product.findUnique({
        where: { id: id, userId: session.user.id },
        include: {
            variants: {
                include: {
                    listings: {
                        include: { shop: true }
                    }
                }
            },
            listings: { // Also fetch listings for Master Product
                include: { shop: true }
            }
        }
    })

    if (!product) notFound()

    // Transform Data
    const children = product.variants // These are the Child Products
    const hasVariants = children.length > 0

    // Extract Unique Channels (Shops) from Listings
    // We check both Master Listings and Child Listings
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

    // Check Child Listings
    children.forEach(v => {
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
        sku: product.sku || "", // Master SKU
        description: product.description || "",
        descriptionHtml: product.descriptionHtml || "",
        syncDescription: true,
        images: product.images,
        categoryId: product.categoryId || "",

        // Spec placeholders
        weight: product.weight || 100,
        daysToShip: 2,
        attributes: [], // TODO: Load Attributes if stored

        hasVariants: hasVariants,

        // We won't try to reverse-engineer tiers yet, just load variants
        variationTiers: [],

        variants: hasVariants ? children.map(v => ({
            id: v.id,
            name: v.name,
            sku: v.sku || "",
            price: Number(v.price),
            stock: v.stock,
            image: v.images[0] || "",
            tierIndices: [], // Fine for now
            barcode: v.barcode || ""
        })) : [],

        // Single Product Mode values (Always populated from Master if no variants)
        price: !hasVariants ? Number(product.price) : 0,
        stock: !hasVariants ? product.stock : 0,
        barcode: !hasVariants ? (product.barcode || "") : "",

        channels: channels
    }

    return <ProductBuilder initialData={initialData} />
}
