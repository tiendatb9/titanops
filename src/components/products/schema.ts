export type Product = {
    type?: 'first' | 'sub' // New logic
    parentName?: string
    parentImage?: string
    parentId?: string
    variantId?: string // Source SKU ID
    name: string
    variantName?: string
    sku: string
    image: string
    price: number
    stock: number
    status: "active" | "draft" | "archived"
    platforms: {
        shopee?: boolean
        tiktok?: boolean
        lazada?: boolean
    }
    sourceId?: string
    sourceUrl?: string
    // Rich Data Fields
    originalPrice?: number
    promoPrice?: number
    promoId?: string
    daysToShip?: number
    platformStatus?: string

    variants: {
        id: string
        name: string
        sku: string
        price: number // Current (Promo) Price
        stock: number
        sourceSkuId?: string

        // Variant Rich Data
        originalPrice?: number
        promoPrice?: number
        promoId?: string
        status?: string
    }[]
}
