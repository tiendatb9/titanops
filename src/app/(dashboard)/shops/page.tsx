"use client"
// Vercel Trigger Check

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Store, Settings2, RefreshCw, ShoppingBag, Search, Filter, MoreHorizontal } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { ShopModal } from "@/components/shops/shop-modal"
import { ShopSettingsDialog } from "@/components/shops/shop-settings-dialog"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"

// --- Helper Components ---

function PlatformIcon({ platform }: { platform: string }) {
    // Return SVG/Image based on platform or fallback
    const styles: Record<string, string> = {
        SHOPEE: "bg-orange-500",
        TIKTOK: "bg-black",
        LAZADA: "bg-blue-600",
        OTHER: "bg-gray-500"
    }
    const colorClass = styles[platform] || "bg-gray-500"

    return (
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-md ${colorClass} text-white`}>
            {/* Simple initials for now, ideally use SVG logos */}
            <span className="font-bold text-xs">{platform.substring(0, 2)}</span>
        </div>
    )
}

function StatusBadge({ active, expiresAt }: { active: boolean, expiresAt?: string }) {
    if (!active) return <Badge variant="destructive" className="rounded-full px-3">Mất kết nối</Badge>

    // Check Expiry
    const isExpiring = expiresAt && new Date(expiresAt).getTime() - Date.now() < 30 * 60 * 1000 // 30 mins

    if (isExpiring) {
        return (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 rounded-full px-3 flex items-center gap-1 border-yellow-200">
                <span className="relative flex h-2 w-2 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                </span>
                Sắp hết hạn
            </Badge>
        )
    }

    return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 rounded-full px-3 flex items-center gap-1">
            <span className="relative flex h-2 w-2 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Đang hoạt động
        </Badge>
    )
}

export default function ShopsPage() {
    const [open, setOpen] = useState(false)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [selectedShop, setSelectedShop] = useState<any>(null)
    const [shops, setShops] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSyncing, setIsSyncing] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")

    // --- Actions ---
    async function handleSync(shopId: string) {
        setIsSyncing(shopId)
        toast.info("Đang xử lý đồng bộ...", { duration: 5000 })
        try {
            const res = await fetch(`/api/shops/${shopId}/sync`, { method: "POST" })
            if (!res.ok) throw new Error(await res.text())
            const data = await res.json()
            toast.success(`Đã cập nhật ${data.count} sản phẩm!`)
            fetchShops()
        } catch (error) {
            console.error(error)
            toast.error("Đồng bộ thất bại. Vui lòng thử lại.")
        } finally {
            setIsSyncing(null)
        }
    }

    const fetchShops = async () => {
        try {
            const res = await fetch("/api/shops")
            if (res.ok) setShops(await res.json())
        } catch (error) { console.error(error) } finally { setIsLoading(false) }
    }

    useEffect(() => { fetchShops() }, [])

    // --- Computed Data ---
    const counts = {
        all: shops.length,
        shopee: shops.filter(s => s.platform === 'SHOPEE').length,
        tiktok: shops.filter(s => s.platform === 'TIKTOK').length,
        lazada: shops.filter(s => s.platform === 'LAZADA').length,
        other: shops.filter(s => !['SHOPEE', 'TIKTOK', 'LAZADA'].includes(s.platform)).length
    }

    const availableTabs = [
        { id: 'all', label: 'Tất cả', count: counts.all, show: true }, // Always show All
        { id: 'shopee', label: 'Shopee', count: counts.shopee, show: counts.shopee > 0 },
        { id: 'tiktok', label: 'TikTok Shop', count: counts.tiktok, show: counts.tiktok > 0 },
        { id: 'lazada', label: 'Lazada', count: counts.lazada, show: counts.lazada > 0 },
        { id: 'other', label: 'Khác', count: counts.other, show: counts.other > 0 },
    ].filter(t => t.show)

    const filteredShops = shops.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.platformShopId?.includes(searchTerm)
    )

    // --- Render Helper ---
    const ShopTable = ({ data, platformFilter }: { data: any[], platformFilter: string }) => {
        const displayData = platformFilter === 'all'
            ? data
            : data.filter(s => platformFilter === 'other'
                ? !['SHOPEE', 'TIKTOK', 'LAZADA'].includes(s.platform)
                : s.platform === platformFilter.toUpperCase())

        if (displayData.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-16 text-center border rounded-xl bg-muted/20 border-dashed">
                    <div className="bg-background p-4 rounded-full shadow-sm mb-4">
                        <Store className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">Chưa có cửa hàng</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mt-1">
                        Danh sách hiện tại đang trống. Hãy kết nối gian hàng mới để bắt đầu quản lý.
                    </p>
                    <Button variant="outline" className="mt-4" onClick={() => setOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Kết nối ngay
                    </Button>
                </div>
            )
        }

        return (
            <Card className="border-none shadow-sm bg-background/60 backdrop-blur-sm">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="hover:bg-muted/50 border-b-input">
                                <TableHead className="w-[350px] pl-6 py-4">Thông tin Gian hàng</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Sản phẩm</TableHead>
                                <TableHead>Đồng bộ</TableHead>
                                <TableHead className="text-right pr-6">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {displayData.map((shop) => (
                                <TableRow key={shop.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="pl-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <PlatformIcon platform={shop.platform} />
                                            <div>
                                                <div className="font-semibold text-base flex items-center gap-2">
                                                    {shop.name}
                                                    {shop.type === 'custom_app' && <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">Custom</Badge>}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                                                    ID: {shop.platformShopId || '---'}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge active={shop.status === 'active' || shop.isActive} expiresAt={shop.tokenExpiresAt} />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="bg-primary/10 p-1.5 rounded-md">
                                                <ShoppingBag className="h-4 w-4 text-primary" />
                                            </div>
                                            <span className="font-medium">{shop.products || 0}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-sm">
                                            <span className="text-foreground/80">
                                                {shop.lastSync ? formatDistanceToNow(new Date(shop.lastSync), { addSuffix: true, locale: vi }) : 'Chưa đồng bộ'}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {shop.lastSync ? new Date(shop.lastSync).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <div className="flex justify-end items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="hidden md:flex h-8"
                                                disabled={isSyncing === shop.id}
                                                onClick={() => handleSync(shop.id)}
                                            >
                                                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isSyncing === shop.id ? "animate-spin" : ""}`} />
                                                Sync
                                            </Button>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Tác vụ</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleSync(shop.id)}>
                                                        <RefreshCw className="mr-2 h-4 w-4" /> Đồng bộ dữ liệu
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => { setSelectedShop(shop); setSettingsOpen(true) }}>
                                                        <Settings2 className="mr-2 h-4 w-4" /> Cấu hình Shop
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-red-600 focus:text-red-600">
                                                        Ngắt kết nối
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 flex max-w-[1600px] mx-auto bg-muted/10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        Quản lý Cửa hàng
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Trung tâm kết nối và vận hành đa sàn thương mại điện tử.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative w-full md:w-64 hidden md:block">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Tìm kiếm shop..."
                            className="pl-9 bg-background"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button onClick={() => setOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Kết nối Shop mới
                    </Button>
                </div>
            </div>

            {/* Content */}
            <Tabs defaultValue="all" className="space-y-6">
                <div className="flex items-center justify-between">
                    <TabsList className="bg-transparent p-0 h-auto gap-2">
                        {availableTabs.map(tab => (
                            <TabsTrigger
                                key={tab.id}
                                value={tab.id}
                                className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary border border-transparent data-[state=active]:border-border rounded-full px-5 py-2 transition-all"
                            >
                                {tab.label}
                                <span className="ml-2 bg-muted-foreground/10 text-muted-foreground py-0.5 px-2 rounded-full text-xs font-medium">
                                    {tab.count}
                                </span>
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {/* Mobile Search - Visible only on small screens */}
                    <div className="md:hidden">
                        <Button variant="ghost" size="icon"><Search className="h-5 w-5" /></Button>
                    </div>
                </div>

                {availableTabs.map(tab => (
                    <TabsContent key={tab.id} value={tab.id} className="mt-0 focus-visible:ring-0">
                        <ShopTable data={filteredShops} platformFilter={tab.id} />
                    </TabsContent>
                ))}
            </Tabs>

            <ShopModal
                open={open}
                onOpenChange={(v) => { if (!setOpen(v)) fetchShops() }}
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
