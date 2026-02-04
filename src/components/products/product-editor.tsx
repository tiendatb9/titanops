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
import { RefreshCw, Save, ChevronLeft, Check, ChevronsUpDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

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


    // State for Categories
    const [categories, setCategories] = React.useState<any[]>([])
    const [loadingCats, setLoadingCats] = React.useState(false)
    const [openCat, setOpenCat] = React.useState(false)

    // Fetch Categories if ShopId present
    React.useEffect(() => {
        if (!shopId) return

        async function fetchCats() {
            setLoadingCats(true)
            try {
                const res = await fetch(`/api/shops/${shopId}/categories`)
                if (res.ok) {
                    const data = await res.json()
                    setCategories(data)
                }
            } catch (e) {
                console.error("Failed to load categories", e)
            } finally {
                setLoadingCats(false)
            }
        }
        fetchCats()
    }, [shopId])

    const handleSave = async () => {
        // TODO: Implement Save (Multiple APIs)
        alert("Tính năng đang phát triển...")
    }

    // Helper to find selected category name
    const selectedCat = categories.find(c => c.category_id === formData.categoryId)
    const categoryName = selectedCat ? selectedCat.display_category_name : (formData.categoryId ? `ID: ${formData.categoryId}` : "Chưa chọn danh mục")

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
                                <Label>Danh mục Shopee</Label>
                                <div className="flex flex-col gap-2">
                                    <Popover open={openCat} onOpenChange={setOpenCat}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={openCat}
                                                className="w-full justify-between"
                                            >
                                                {categoryName !== "Chưa chọn danh mục" ? categoryName : "Chọn danh mục..."}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[400px] p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder="Tìm kiếm danh mục..." />
                                                <CommandList>
                                                    <CommandEmpty>Không tìm thấy danh mục.</CommandEmpty>
                                                    <CommandGroup>
                                                        {categories
                                                            .filter(c => !c.has_children)
                                                            .map((category) => (
                                                                <CommandItem
                                                                    key={category.category_id}
                                                                    value={category.display_category_name}
                                                                    onSelect={() => {
                                                                        setFormData(prev => ({ ...prev, categoryId: category.category_id }))
                                                                        setOpenCat(false)
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            formData.categoryId === category.category_id ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {category.display_category_name}
                                                                </CommandItem>
                                                            ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <p className="text-[11px] text-muted-foreground">
                                        *Chỉ hiển thị {categories.filter(c => !c.has_children).length} danh mục lá (Leaf Category) để chọn.
                                    </p>
                                </div>
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
