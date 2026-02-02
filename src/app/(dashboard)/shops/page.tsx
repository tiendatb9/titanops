"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Store, Settings2, RefreshCw } from "lucide-react"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShopModal } from "@/components/shops/shop-modal"
import { ShopSettingsDialog } from "@/components/shops/shop-settings-dialog"

export default function ShopsPage() {
    const [open, setOpen] = useState(false)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [selectedShop, setSelectedShop] = useState<any>(null)
    const [shops, setShops] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Fetch Shops
    const fetchShops = async () => {
        try {
            const res = await fetch("/api/shops")
            if (res.ok) {
                const data = await res.json()
                setShops(data)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    // Initial Fetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        fetchShops()
    }, [])

    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 flex">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Quản lý Cửa hàng</h2>
                    <p className="text-muted-foreground">
                        Kết nối và quản lý các gian hàng trên đa sàn.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button onClick={() => setOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Thêm cửa hàng
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-10">Đang tải dữ liệu...</div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {shops.map((shop) => (
                        <Card key={shop.id} className={shop.status === 'disconnected' ? "opacity-70 border-dashed" : ""}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {shop.platform === 'SHOPEE' ? 'Shopee Store' : shop.platform === 'TIKTOK' ? 'TikTok Shop' : 'Lazada'}
                                </CardTitle>
                                {shop.type === 'custom_app' && (
                                    <Badge variant="secondary" className="text-xs">Custom App</Badge>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 mb-2">
                                    <Store className="h-5 w-5 text-muted-foreground" />
                                    <span className="text-2xl font-bold">{shop.name}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {shop.products} sản phẩm • Đồng bộ {shop.lastSync}
                                </p>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Badge variant={shop.status === 'active' ? 'default' : 'destructive'}>
                                    {shop.status === 'active' ? 'Đang hoạt động' : 'Mất kết nối'}
                                </Badge>
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        title="Cấu hình"
                                        onClick={() => {
                                            setSelectedShop(shop)
                                            setSettingsOpen(true)
                                        }}
                                    >
                                        <Settings2 className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" title="Đồng bộ ngay">
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    ))}

                    {/* Add Card Placeholder */}
                    <div
                        className="flex items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setOpen(true)}
                    >
                        <div className="text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                <Plus className="h-6 w-6" />
                            </div>
                            <h3 className="mt-2 text-sm font-semibold">Kết nối cửa hàng mới</h3>
                            <p className="text-sm text-muted-foreground">Shopee, TikTok, Lazada</p>
                        </div>
                    </div>
                </div>

            )}

            <ShopModal
                open={open}
                onOpenChange={(v) => {
                    setOpen(v)
                    if (!v) fetchShops()
                }}
            />

            <ShopSettingsDialog
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
                shop={selectedShop}
                onSuccess={fetchShops}
            />
        </div>
    )
}
