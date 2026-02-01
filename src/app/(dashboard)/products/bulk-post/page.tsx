"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, Store, RefreshCw, Send, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { sampleProducts } from "@/components/products/data"

// Mock Shops
const SHOPS = [
    { value: "shopee-1", label: "Shopee Chính (HCM)", platform: "SHOPEE" },
    { value: "shopee-2", label: "Shopee Phụ (HN)", platform: "SHOPEE" },
    { value: "tiktok-1", label: "TikTok Store Official", platform: "TIKTOK" },
    { value: "lazada-1", label: "Lazada Mall", platform: "LAZADA" },
]

export default function BulkPostPage() {
    const [selectedProducts, setSelectedProducts] = useState<string[]>([])
    const [selectedShops, setSelectedShops] = useState<string[]>([])
    const [priceAdjustment, setPriceAdjustment] = useState<number>(0)
    const [isPublishing, setIsPublishing] = useState(false)

    // Filter only Draft products for Bulk Post usually, but let's allow all for demo
    const products = sampleProducts.filter(p => p.status === 'draft')

    const toggleProduct = (id: string) => {
        if (selectedProducts.includes(id)) {
            setSelectedProducts(selectedProducts.filter(item => item !== id))
        } else {
            setSelectedProducts([...selectedProducts, id])
        }
    }

    const toggleAllProducts = () => {
        if (selectedProducts.length === products.length) {
            setSelectedProducts([])
        } else {
            setSelectedProducts(products.map(p => p.id))
        }
    }

    const toggleShop = (value: string) => {
        if (selectedShops.includes(value)) {
            setSelectedShops(selectedShops.filter(item => item !== value))
        } else {
            setSelectedShops([...selectedShops, value])
        }
    }

    const handlePublish = () => {
        if (selectedProducts.length === 0) return alert("Vui lòng chọn sản phẩm!")
        if (selectedShops.length === 0) return alert("Vui lòng chọn Shop đích!")

        setIsPublishing(true)
        // Mock API Call
        setTimeout(() => {
            alert(`Đã gửi lệnh đăng ${selectedProducts.length} sản phẩm lên ${selectedShops.length} shop!`)
            setIsPublishing(false)
            setSelectedProducts([])
        }, 1500)
    }

    return (
        <div className="h-full flex flex-col p-8 space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Đăng hàng loạt (Bulk Listing)</h2>
                <p className="text-muted-foreground">
                    Chọn sản phẩm từ danh sách chờ (Draft) và đẩy lên nhiều Shop cùng lúc.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
                {/* LEFT: Product Selection */}
                <Card className="col-span-2 flex flex-col h-full">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle>1. Chọn sản phẩm ({selectedProducts.length})</CardTitle>
                            <Button variant="ghost" size="sm" onClick={toggleAllProducts}>
                                {selectedProducts.length === products.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                            </Button>
                        </div>
                        <CardDescription>Danh sách sản phẩm đang ở trạng thái Chờ đăng (Draft).</CardDescription>
                    </CardHeader>
                    <Separator />
                    <CardContent className="flex-1 p-0 overflow-hidden">
                        <ScrollArea className="h-full">
                            <div className="flex flex-col">
                                {products.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground">
                                        Không có sản phẩm nào đang chờ đăng.
                                    </div>
                                ) : (
                                    products.map((product) => (
                                        <div
                                            key={product.id}
                                            className={cn(
                                                "flex items-center gap-4 p-4 border-b hover:bg-muted/50 cursor-pointer transition-colors",
                                                selectedProducts.includes(product.id) && "bg-muted/30"
                                            )}
                                            onClick={() => toggleProduct(product.id)}
                                        >
                                            <Checkbox
                                                checked={selectedProducts.includes(product.id)}
                                                onCheckedChange={() => toggleProduct(product.id)}
                                            />
                                            <div className="h-12 w-12 rounded bg-muted overflow-hidden flex-shrink-0">
                                                <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{product.name}</p>
                                                <p className="text-xs text-muted-foreground">SKU: {product.sku} | Kho: {product.stock}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-sm">
                                                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(product.price)}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* RIGHT: Configuration */}
                <div className="flex flex-col gap-6 h-full">
                    <Card className="flex-1 flex flex-col">
                        <CardHeader>
                            <CardTitle>2. Chọn Shop đích</CardTitle>
                            <CardDescription>Sản phẩm sẽ được đăng lên các shop đã chọn.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-4">
                            <div className="grid gap-2">
                                {SHOPS.map((shop) => (
                                    <div
                                        key={shop.value}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:border-primary transition-all",
                                            selectedShops.includes(shop.value) && "border-primary bg-primary/5"
                                        )}
                                        onClick={() => toggleShop(shop.value)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Store className={cn(
                                                "h-5 w-5",
                                                shop.platform === "SHOPEE" ? "text-orange-500" :
                                                    shop.platform === "TIKTOK" ? "text-black" : "text-blue-600"
                                            )} />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{shop.label}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase">{shop.platform}</span>
                                            </div>
                                        </div>
                                        {selectedShops.includes(shop.value) && <Check className="h-4 w-4 text-primary" />}
                                    </div>
                                ))}
                            </div>

                            <Separator />

                            <div className="space-y-4 pt-2">
                                <Label>Thiết lập giá (Tùy chọn)</Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Tăng giá thêm:</span>
                                    <div className="relative flex-1">
                                        <Input
                                            type="number"
                                            value={priceAdjustment}
                                            onChange={(e) => setPriceAdjustment(Number(e.target.value))}
                                            className="pr-8 text-right"
                                        />
                                        <div className="absolute right-3 top-2.5 text-xs text-muted-foreground">%</div>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Ví dụ: Nhập 10 để tăng giá bán trên sàn cao hơn 10% so với giá gốc.
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter className="pt-4 border-t bg-muted/20">
                            <Button
                                className="w-full"
                                size="lg"
                                onClick={handlePublish}
                                disabled={isPublishing || selectedProducts.length === 0 || selectedShops.length === 0}
                            >
                                {isPublishing ? (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Đang xử lý...
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" /> Đăng {selectedProducts.length} sản phẩm
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Quick Guide */}
                    <Card className="bg-blue-50/50 border-blue-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-blue-800">Lưu ý khi đăng</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-blue-700 space-y-2">
                            <p>• Sản phẩm sẽ được đưa vào hàng chờ xử lý của hệ thống.</p>
                            <p>• Hình ảnh sẽ được tự động upload lại lên server của sàn.</p>
                            <p>• Vui lòng đảm bảo danh mục ngành hàng đã được map đúng.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
