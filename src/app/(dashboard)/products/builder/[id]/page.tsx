import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { ProductBuilder } from "@/components/products/builder/product-builder"
import { ProductBuilderValues } from "@/components/products/builder/schema"

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (!session?.user?.id) redirect("/login")

    const { id } = await params

    // Fetch Product with Variants
    const product = await prisma.product.findUnique({
        where: { id: id, userId: session.user.id },
        include: { variants: true }
    })

    if (!product) notFound()

    // Transform Data to Form Schema
    // We need to map DB structure back to Builder Form Structure
    const defaultVariant = product.variants.find(v => v.name === "Default") || product.variants[0]
    const otherVariants = product.variants.filter(v => v.name !== "Default")
    const hasVariants = otherVariants.length > 0

    // TODO: Reconstruct Tiers from Variant Names if we want to support editing Tiers fully.
    // This is hard because we store flattened Variants. 
    // For now, if it has variants, we might just list them in the table without reconstructing the "Tier Generator" state perfectly
    // or we assume a simple "Tier 1 - Tier 2" logic based on name splitting.

    // Simplification for MVP:
    // If hasVariants, we load them into `variants` array.
    // We might leave `variationTiers` empty or try to infer.
    // Let's infer for better UX if possible, or just raw edit.

    // For now, let's just map the raw variants to the table so the user can edit Price/Stock/SKU.
    // Re-generating the matrix (Tiers) from existing data is complex.
    // Strategy: 
    // 1. Load existing variants.
    // 2. Hide "Generator" by default. 
    // 3. Allow user to add new variants manually or via generator if they re-setup tiers.

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

        channels: [] // We'd fetch Listings here ideally
    }

    return <ProductBuilder initialData={initialData} />
}
