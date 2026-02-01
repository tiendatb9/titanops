"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, RefreshCw, Filter } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function OnlineProductsPage() {
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
                        <div className="text-2xl font-bold">1,240</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Shopee (3 Shops)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">850</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">TikTok Shop (2 Shops)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">390</div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
                <div className="flex flex-col items-center gap-1 text-center">
                    <h3 className="text-2xl font-bold tracking-tight">Danh sách sản phẩm sàn</h3>
                    <p className="text-sm text-muted-foreground">
                        Chức năng đồng bộ đang được phát triển. Dữ liệu sẽ hiển thị ở đây.
                    </p>
                </div>
            </div>
        </div>
    )
}
