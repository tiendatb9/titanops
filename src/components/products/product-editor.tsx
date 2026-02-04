"use client"

import * as React from "react"
import { Product, Shop } from "@prisma/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { RefreshCw, Save, ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface ProductEditorProps {
    product: any
    shopId?: string
}

export function ProductEditor({ product, shopId }: ProductEditorProps) {
    const router = useRouter()
    const rawItem = product.rawJson?.item || product.rawJson || {}
    const rawModel = product.rawJson?.model || {}

    // Initial State from Raw JSON
    const [formData, setFormData] = React.useState({
        itemName: rawItem.item_name || product.name || "",
        itemSku: rawItem.item_sku || product.sku || "",
        description: "", // Need to parse extended desc
        categoryId: rawItem.category_id || 0,
        weight: rawItem.weight || 0,
        images: rawItem.image?.image_url_list || product.images || []
    })

    // Parse Description on Mount
    React.useEffect(() => {
        let desc = rawItem.description || product.description
        if (rawItem.description_info?.extended_description?.field_list) {
            const fields = rawItem.description_info.extended_description.field_list
            const texts = fields
                .filter((f: any) => f.field_type === 'text')
                .map((f: any) => f.text)
            if (texts.length > 0) desc = texts.join('\n\n')
        }
        setFormData(prev => ({ ...prev, description: desc }))
    }, [rawItem, product])


    const handleSave = async () => {
        // TODO: Implement Save (Multiple APIs)
        alert("Tính năng đang phát triển...")
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                    <h3 className="font-medium text-lg text-foreground">{formData.itemName}</h3>
                    <p className="text-sm text-muted-foreground">ID: {product.sourceId} | SKU: {formData.itemSku}</p>
                </div>
                <Button onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" /> Lưu thay đổi
                </Button>
            </div>

            <Tabs defaultValue="info" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="info">Thông tin chung</TabsTrigger>
                    <TabsTrigger value="media">Hình ảnh & Video</TabsTrigger>
                    <TabsTrigger value="attributes">Thuộc tính</TabsTrigger>
                    <TabsTrigger value="sales">Phân loại & Giá</TabsTrigger>
                    <TabsTrigger value="logistic">Vận chuyển</TabsTrigger>
                </TabsList>

                {/* TAB 1: BASIC INFO */}
                <TabsContent value="info" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Thông tin cơ bản</CardTitle>
                            <CardDescription>Tên, Mô tả và Mã sản phẩm</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Tên sản phẩm</Label>
                                <Input
                                    id="name"
                                    value={formData.itemName}
                                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="sku">SKU (Mã phân loại)</Label>
                                <Input
                                    id="sku"
                                    value={formData.itemSku}
                                    onChange={(e) => setFormData({ ...formData, itemSku: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="desc">Mô tả sản phẩm</Label>
                                <Textarea
                                    id="desc"
                                    value={formData.description}
                                    className="min-h-[200px]"
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* PLACEHOLDERS FOR OTHER TABS */}
                <TabsContent value="media">
                    <Card>
                        <CardHeader><CardTitle>Quản lý Media</CardTitle></CardHeader>
                        <CardContent><p className="text-muted-foreground">Đang phát triển...</p></CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="attributes">
                    <Card>
                        <CardHeader><CardTitle>Thuộc tính ngành hàng</CardTitle></CardHeader>
                        <CardContent><p className="text-muted-foreground">Đang phát triển...</p></CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="sales">
                    <Card>
                        <CardHeader><CardTitle>Thông tin Bán hàng</CardTitle></CardHeader>
                        <CardContent><p className="text-muted-foreground">Đang phát triển...</p></CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="logistic">
                    <Card>
                        <CardHeader><CardTitle>Vận chuyển</CardTitle></CardHeader>
                        <CardContent><p className="text-muted-foreground">Đang phát triển...</p></CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
