
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

    // Fetch Variants (Siblings via Source ID)
    // In Flat Architecture, we group by sourceId (Shopee Item ID)
    let dbVariants: any[] = []
    if (product.sourceId && product.shopId) {
        dbVariants = await prisma.product.findMany({
            where: {
                sourceId: product.sourceId,
                shopId: product.shopId,
                userId: session.user.id,
                NOT: {
                    id: product.id // Exclude self? Or include? Builder logic expects self in variants? 
                    // Usually Builder treats "variants" as the list of skus. 
                    // If this is one of them, we should include ALL of them in the list.
                }
            }
        })
        // Add current product to the list if not present, or better: fetch ALL including self.
        // Let's refetch cleaner.
        dbVariants = await prisma.product.findMany({
            where: {
                sourceId: product.sourceId,
                shopId: product.shopId,
                userId: session.user.id
            }
        })
    }

    const hasVariants = dbVariants.length > 0

    // Map DB Variants to Builder Variants
    const mappedVariants = dbVariants.map(v => ({
        id: v.id,
        name: v.variantName || v.name,
        price: Number(v.price),
        stock: v.stock,
        sku: v.sku,
        image: v.image,
        options: [] // TODO: Extract options if stored? For Flat SKU from Shopee, options might not be explicit in DB columns
    }))

    // ... (rest of initialData construction)

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

        variationTiers: [], // Populating tiers from DB is complex if not stored as JSON. 
        // For Shopee synced products, we might need to rely on 'variantName' text or fetch structure.
        // For now, listing variants is better than nothing.

        variants: mappedVariants.length > 0 ? mappedVariants : [],

        // Single Product Mode values
        price: Number(product.price),
        stock: product.stock,
        barcode: product.barcode || "",

        channels: channels
    }

    return <ProductBuilder initialData={initialData} />
}
