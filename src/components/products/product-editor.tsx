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
import { RefreshCw, Save, ChevronLeft, Check, ChevronsUpDown, X, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CategoryCascader } from "./category-cascader"
import { BrandCombobox } from "./brand-combobox"


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

    // State for Brands (Lifted)
    const [brands, setBrands] = React.useState<any[]>([])
    const [scanProgress, setScanProgress] = React.useState("")
    const [loadingBrands, setLoadingBrands] = React.useState(false)

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

    // Fetch Brands (Global & Caching) - Scan immediately when categoryId exists
    React.useEffect(() => {
        if (!shopId || !formData.categoryId) return

        let isCancelled = false
        const CACHE_KEY = `titanops_brands_${shopId}_${formData.categoryId}`

        async function scanBrands() {
            // 1. Check Cache
            const cached = localStorage.getItem(CACHE_KEY)
            if (cached) {
                try {
                    const parsed = JSON.parse(cached)
                    // Valid for 24 hours
                    if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
                        setBrands(parsed.data)
                        setScanProgress("Đã tải từ Cache")
                        return // Skip scanning
                    }
                } catch (e) { localStorage.removeItem(CACHE_KEY) }
            }

            // 2. Scan if no cache
            setLoadingBrands(true)
            let allBrands: any[] = []
            let offset = 0
            let hasMore = true
            const pageSize = 100

            try {
                // Using 500 pages limit (~50k brands) for safety
                while (hasMore && !isCancelled && offset < 50000) {
                    const res = await fetch(`/api/shops/${shopId}/brands?categoryId=${formData.categoryId}&offset=${offset}&pageSize=${pageSize}`)
                    if (!res.ok) break

                    const data = await res.json()
                    const list = data.brand_list || []

                    if (list.length > 0) {
                        allBrands = [...allBrands, ...list]
                        // Update UI every 500 items or so
                        if (allBrands.length % 500 === 0 || !data.has_next_page) {
                            setBrands(prev => [...prev, ...list])
                            setScanProgress(`Đang quét... ${allBrands.length} thương hiệu`)
                        } else {
                            // Just update internal list, don't re-render excessively
                        }
                    }

                    if (data.has_next_page) {
                        offset = data.next_offset
                        // Delay 300ms (Safe Mode)
                        await new Promise(r => setTimeout(r, 300))
                    } else {
                        hasMore = false
                    }
                }

                if (!isCancelled && allBrands.length > 0) {
                    setBrands(allBrands) // Final update
                    setScanProgress(`Hoàn tất (${allBrands.length})`)
                    localStorage.setItem(CACHE_KEY, JSON.stringify({
                        timestamp: Date.now(),
                        data: allBrands
                    }))
                }
            } catch (e) {
                console.error("Scan Brands Error", e)
            } finally {
                setLoadingBrands(false)
            }
        }

        setBrands([])
        scanBrands()

        return () => { isCancelled = true }
    }, [shopId, formData.categoryId])

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
                                <CategoryCascader
                                    categories={categories}
                                    value={formData.categoryId || 0}
                                    onSelect={(id) => setFormData(prev => ({ ...prev, categoryId: id }))}
                                />
                                <p className="text-[11px] text-muted-foreground">
                                    *Chọn đúng danh mục để hiển thị đúng thuộc tính sản phẩm.
                                </p>
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

                {/* TAB 2: MEDIA */}
                <TabsContent value="media" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Hình ảnh sản phẩm</CardTitle>
                            <CardDescription>
                                Quản lý hình ảnh hiển thị trên Shopee. Tối đa 9 ảnh.
                                Kéo thả để sắp xếp (Tính năng sắp xếp đang cập nhật).
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Image Grid */}
                            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                                {formData.images.map((img: string, index: number) => (
                                    <div key={index} className="group relative aspect-square border rounded-md overflow-hidden bg-muted">
                                        <img src={img} alt={`Product ${index}`} className="w-full h-full object-cover" />

                                        {/* Actions Overlay */}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <Button
                                                variant="destructive" size="icon" className="h-8 w-8"
                                                onClick={() => {
                                                    const newImages = [...formData.images]
                                                    newImages.splice(index, 1)
                                                    setFormData({ ...formData, images: newImages })
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        {/* Badges */}
                                        {index === 0 && (
                                            <div className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded shadow">
                                                Ảnh bìa
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Add Button */}
                                {formData.images.length < 9 && (
                                    <div className="aspect-square border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 hover:border-blue-500 transition-colors"
                                        onClick={() => {
                                            const url = prompt("Nhập URL hình ảnh (Tính năng Upload đang xây dựng):")
                                            if (url) setFormData((prev: any) => ({ ...prev, images: [...prev.images, url] }))
                                        }}
                                    >
                                        <Plus className="h-8 w-8 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground mt-2">Thêm ảnh</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 3: ATTRIBUTES */}
                <TabsContent value="attributes" className="space-y-4">
                    <AttributeEditor
                        shopId={shopId}
                        categoryId={formData.categoryId}
                        initialAttributes={product.rawJson?.attribute_list || []}
                        initialBrandId={rawItem.brand?.brand_id}
                        onChange={(attrs) => setFormData(prev => ({ ...prev, attributes: attrs }))}
                        onBrandChange={(brandId) => setFormData(prev => ({ ...prev, brandId: brandId }))}
                        // Lifted Props
                        brands={brands}
                        loadingBrands={loadingBrands}
                        scanProgress={scanProgress}
                    />
                </TabsContent>

                {/* PLACEHOLDERS FOR OTHER TABS */}
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

// --- SUB COMPONENTS ---

export function AttributeEditor({
    shopId, categoryId, initialAttributes, initialBrandId, onChange, onBrandChange,
    brands, loadingBrands, scanProgress
}: {
    shopId?: string,
    categoryId: number,
    initialAttributes: any[],
    initialBrandId?: number,
    onChange: (attrs: any[]) => void
    onBrandChange?: (brandId: number) => void
    brands: any[]
    loadingBrands: boolean
    scanProgress: string
}) {
    const [attributes, setAttributes] = React.useState<any[]>([])
    // Local brands state removed, using props
    const [values, setValues] = React.useState<Record<number, any>>({})
    const [selectedBrand, setSelectedBrand] = React.useState<number | null>(initialBrandId || null)

    const [loading, setLoading] = React.useState(false)

    // Load Attributes
    React.useEffect(() => {
        if (!shopId || !categoryId) return

        async function loadAttrs() {
            setLoading(true) // Only block for attributes
            try {
                const res = await fetch(`/api/shops/${shopId}/attributes?categoryId=${categoryId}`)
                if (res.ok) setAttributes(await res.json())
            } catch (e) { console.error("Load Attrs Error", e) }
            finally { setLoading(false) }
        }
        loadAttrs()
    }, [shopId, categoryId])

    // Load Brands (Background)
    React.useEffect(() => {
        if (!shopId || !categoryId) return

        async function loadBrands() {
            try {
                const res = await fetch(`/api/shops/${shopId}/brands?categoryId=${categoryId}`)
                if (res.ok) setBrands(await res.json())
            } catch (e) { console.error("Load Brands Error", e) }
        }
        loadBrands()
    }, [shopId, categoryId])

    // Handle Brand Change
    const handleBrandChange = (val: string) => {
        const id = Number(val)
        setSelectedBrand(id)
        if (onBrandChange) onBrandChange(id)
    }


    // Initial Values
    React.useEffect(() => {
        if (initialAttributes && initialAttributes.length > 0) {
            const map: any = {}
            initialAttributes.forEach(a => {
                map[a.attribute_id] = a.attribute_value_list?.[0]?.value_id || a.attribute_value_list?.[0]?.original_value_name || ""
            })
            setValues(map)
        }
    }, [initialAttributes])

    // Handle Change
    const handleChange = (id: number, val: any) => {
        const newValues = { ...values, [id]: val }
        setValues(newValues)

        // Convert to Shopee Format
        const out = Object.entries(newValues).map(([k, v]) => ({
            attribute_id: Number(k),
            attribute_value_list: [{ original_value_name: String(v) }] // Simply sending value name for now
        }))
        onChange(out)
    }

    if (loading) return <div className="p-4 text-sm text-muted-foreground">Đang tải thuộc tính...</div>
    if (attributes.length === 0) return <div className="p-4 text-sm text-muted-foreground">Danh mục này không có thuộc tính bắt buộc.</div>

    return (
        <Card>
            <CardHeader>
                <CardTitle>Thuộc tính sản phẩm ({attributes.length})</CardTitle>
                <CardDescription>Điền đầy đủ các thuộc tính để tăng độ hiển thị.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* BRAND FIELD (Searchable Combobox) */}
                <div className="grid gap-2">
                    <Label className="flex gap-1">
                        Thương hiệu / Tác giả
                        <span className="text-red-500">*</span>
                    </Label>

                    <BrandCombobox
                        brands={brands}
                        value={selectedBrand}
                        onChange={(id) => handleBrandChange(String(id))}
                        loading={loadingBrands}
                        placeholder={scanProgress || (loadingBrands ? "Đang quét..." : "Chọn thương hiệu")}
                    />

                    <div className="flex justify-between items-center mt-1">
                        <p className="text-[10px] text-muted-foreground">
                            *Nhập tên để tìm kiếm.
                        </p>
                        {scanProgress && <span className="text-[10px] text-blue-600 font-medium">{scanProgress}</span>}
                    </div>
                </div>

                {attributes.map(attr => (
                    <div key={attr.attribute_id} className="grid gap-2">
                        <Label className="flex gap-1">
                            {attr.display_attribute_name}
                            {attr.is_mandatory && <span className="text-red-500">*</span>}
                        </Label>

                        {/* RENDER INPUT BASED ON TYPE */}
                        {/* 
                            input_type mapping:
                            1: SINGLE_DROP_DOWN -> Select
                            2: SINGLE_COMBO_BOX -> Select (with custom input support? for now Select)
                            3: FREE_TEXT_FILED -> Input
                            4: MULTI_DROP_DOWN -> Select Multiple (Not handled yet, treating as Single)
                        */}
                        {(attr.input_type == 1 || attr.input_type == 2 || attr.input_type == 'DROP_DOWN' || attr.input_type == 'COMBO_BOX') && attr.attribute_value_list.length > 0 ? (
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={values[attr.attribute_id] || ""}
                                onChange={(e) => handleChange(attr.attribute_id, e.target.value)}
                            >
                                <option value="">-- Chọn {attr.display_attribute_name} --</option>
                                {attr.attribute_value_list.map((v: any) => (
                                    <option key={v.value_id} value={v.display_value_name}>
                                        {v.display_value_name}
                                    </option>
                                ))}
                            </select>
                        ) : attr.input_validation_type == 4 || attr.date_format_type ? (
                            // Date Picker Type
                            <Input
                                type="date"
                                value={values[attr.attribute_id] || ""}
                                onChange={(e) => handleChange(attr.attribute_id, e.target.value)}
                            />
                        ) : (
                            // Text Input (Default)
                            <div className="relative">
                                <Input
                                    value={values[attr.attribute_id] || ""}
                                    onChange={(e) => handleChange(attr.attribute_id, e.target.value)}
                                    placeholder={`Nhập ${attr.display_attribute_name}`}
                                />
                                {attr.attribute_unit && <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">{attr.attribute_unit}</span>}
                            </div>
                        )}

                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
