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

    const products = await prisma.product.findMany({
        where: { userId },
        include: {
            variants: {
                include: {
                    listings: { include: { shop: true } }
                }
            }
        },
        orderBy: { updatedAt: 'desc' }
    })

    // Transform for UI (matches columns schema)
    const formattedProducts = products.map(p => {
        // Find platforms this product is listed on
        const platforms = {
            shopee: p.variants.some(v => v.listings.some(l => l.shop.platform === 'SHOPEE')),
            tiktok: p.variants.some(v => v.listings.some(l => l.shop.platform === 'TIKTOK')),
            lazada: false
        }

        // Calculate Price/Stock range or total
        // Simple logic: Take first variant or range
        const price = p.variants[0]?.price ? Number(p.variants[0].price) : 0
        const stock = p.variants.reduce((sum, v) => sum + v.stock, 0)

        return {
            id: p.id,
            name: p.name,
            sku: p.sku || "",
            price: price,
            stock: stock,
            status: (p.status === 'ACTIVE' ? 'active' : 'draft') as "active" | "draft" | "archived",
            image: p.images[0] || "/placeholder.png",
            platforms: platforms,
            rawJson: p.rawJson,
            sourceId: p.sourceId || undefined,
            variants: p.variants.map(v => ({
                id: v.id,
                name: v.name,
                sku: v.sku || "",
                price: Number(v.price),
                stock: v.stock,
                sourceSkuId: v.sourceSkuId || undefined
            }))
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
