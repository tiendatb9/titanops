import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, RefreshCw, Filter } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { DataTable } from "@/components/products/data-table"
import { columns } from "@/components/products/columns"
import { redirect } from "next/navigation"

async function getOnlineProducts(userId: string) {
    // 1. Get Stats (Count Listings by Platform)
    // We count Listings that are ACTIVE
    const [totalLive, shopeeLive, tiktokLive] = await Promise.all([
        prisma.listing.count({
            where: { shop: { userId }, status: 'ACTIVE' }
        }),
        prisma.listing.count({ // Shopee
            where: { shop: { userId, platform: 'SHOPEE' }, status: 'ACTIVE' }
        }),
        prisma.listing.count({ // TikTok
            where: { shop: { userId, platform: 'TIKTOK' }, status: 'ACTIVE' }
        })
    ])

    // 2. Get Products that have at least one Listing
    // For the table, we show "Products" but maybe annotated with platforms?
    // Current columns logic expects "products" with "platforms" boolean map.

    // 2. Get Products (Flat)
    const products = await prisma.product.findMany({
        where: { userId },
        // No Include Variants needed
        orderBy: { updatedAt: 'desc' }
    })

    // Transform for UI (matches columns schema)
    const formattedProducts = products.map((p: any) => {
        return {
            id: p.id,
            name: p.name,
            variantName: p.variantName || undefined, // New Field
            sku: p.sku || "",

            price: Number(p.price),
            stock: p.stock,

            status: (p.status === 'ACTIVE' ? 'active' : 'draft') as "active" | "draft" | "archived",
            image: p.images[0] || "/placeholder.png",
            platforms: { shopee: true, tiktok: false, lazada: false }, // Placeholder logic

            rawJson: p.rawJson,
            sourceId: p.sourceId || undefined,
            sourceUrl: p.sourceUrl || undefined,

            // Rich Data Mapping
            originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
            promoPrice: p.promoPrice ? Number(p.promoPrice) : undefined,
            promoId: p.promoId || undefined,
            daysToShip: p.daysToShip || undefined,
            platformStatus: p.platformStatus || undefined,

            // Legacy Variant Array (Keep empty or minimal for Columns compatibility?)
            // Columns expect 'variants' array.
            // If I return empty, columns will show "Simple Product" view?
            // But I want to show the Variant Name if present!
            // I should use "variants" to fake self? 
            // OR Update Columns to just show top level info.
            variants: []
        }
    })

    return {
        stats: { total: totalLive, shopee: shopeeLive, tiktok: tiktokLive },
        data: formattedProducts
    }
}

export default async function OnlineProductsPage() {
    const session = await auth()
    if (!session?.user?.id) redirect("/login")

    const { stats, data } = await getOnlineProducts(session.user.id)

    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 flex">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Sản phẩm Online</h2>
                    <p className="text-muted-foreground">
                        Quản lý và đồng bộ sản phẩm đang hiển thị thực tế trên các sàn (Shopee, TikTok, Lazada).
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4" /> Đồng bộ tất cả
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Tìm kiếm theo tên, SKU hoặc ID sàn..."
                        className="pl-8"
                    />
                </div>
                <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Lọc Shop/Sàn</Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Quick Stats */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tổng sản phẩm Live</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Shopee</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.shopee}</div>
                        <p className="text-xs text-muted-foreground">Đang hoạt động</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">TikTok Shop</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.tiktok}</div>
                        <p className="text-xs text-muted-foreground">Sắp ra mắt</p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex-1 overflow-auto rounded-md border">
                <DataTable data={data} columns={columns} />
            </div>
        </div>
    )
}
