export type Product = {
    id: string
    name: string
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
    variants: {
        id: string
        name: string
        sku: string
        price: number
        stock: number
        sourceSkuId?: string
    }[]
}
