"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { productBuilderSchema, ProductBuilderValues } from "@/components/products/builder/schema"
import { ChannelPublisher } from "@/components/products/channel-publisher"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Save, Upload, Plus, Trash2, Box } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface ProductBuilderProps {
    initialData?: ProductBuilderValues & { id?: string }
}

export function ProductBuilder({ initialData }: ProductBuilderProps) {
    const router = useRouter()
    const [isGeneratingVariants, setIsGeneratingVariants] = useState(false)
    const isEditMode = !!initialData?.id

    // Initial setup
    const form = useForm<ProductBuilderValues>({
        resolver: zodResolver(productBuilderSchema) as any,
        defaultValues: initialData || {
            name: "",
            sku: "",
            description: "",
            descriptionHtml: "",
            syncDescription: true,
            images: [] as string[],
            categoryId: "",
            weight: 100,
            daysToShip: 2,
            attributes: [],
            hasVariants: false,
            variationTiers: [],
            variants: [],
            price: 0,
            stock: 0,
            channels: []
        },
    })

    // Fetch Shops on Mount (only if no channels pre-filled or need sync)
    // Actually we always need available shops to populate the list if new shops appeared.
    // But for simplicity, if initialData has channels, use them. 
    // If we want to merge new shops, we'd need more logic. 
    useEffect(() => {
        if (initialData?.channels?.length) return; // Skip if we have data (Edit Mode might need valid check though)

        const fetchShops = async () => {
            try {
                const res = await fetch("/api/shops")
                if (res.ok) {
                    const shops = await res.json()
                    const channelData = shops.map((shop: any) => ({
                        shopId: shop.id,
                        shopName: shop.name,
                        platform: shop.platform,
                        isActive: false,
                        price: 0,
                        stock: 0
                    }))
                    form.setValue("channels", channelData)
                }
            } catch (error) {
                console.error("Failed to fetch shops", error)
            }
        }
        fetchShops()
    }, [form, initialData])

    // Dynamic Fields
    const { fields: attrFields, append: appendAttr, remove: removeAttr } = useFieldArray({
        control: form.control,
        name: "attributes"
    })

    const { fields: tierFields, append: appendTier, remove: removeTier } = useFieldArray({
        control: form.control,
        name: "variationTiers"
    })

    const hasVariants = form.watch("hasVariants")
    const tiers = form.watch("variationTiers")

    // Helper: Generate Cartesian Product of Variants
    const generateVariants = () => {
        setIsGeneratingVariants(true)
        const currentVariants = form.getValues("variants") || []
        const baseSku = form.getValues("sku") || "SKU"
        const basePrice = form.getValues("price") || 0

        const t1 = tiers[0]
        const t2 = tiers[1]

        let newVariants: any[] = []

        if (t1 && t1.options.length > 0) {
            t1.options.forEach((opt1, idx1) => {
                if (t2 && t2.options.length > 0) {
                    t2.options.forEach((opt2, idx2) => {
                        const name = `${opt1.name} - ${opt2.name}`
                        const tierIndices = [idx1, idx2]

                        const existing = currentVariants.find(v =>
                            v.tierIndices?.length === 2 &&
                            v.tierIndices[0] === idx1 &&
                            v.tierIndices[1] === idx2
                        )

                        if (existing) {
                            newVariants.push({ ...existing, name })
                        } else {
                            newVariants.push({
                                name: name,
                                tierIndices: tierIndices,
                                sku: `${baseSku}-${idx1}${idx2}`,
                                barcode: "",
                                price: basePrice,
                                stock: 0,
                                image: ""
                            })
                        }
                    })
                } else {
                    const name = opt1.name
                    const tierIndices = [idx1]
                    const existing = currentVariants.find(v => v.tierIndices?.length === 1 && v.tierIndices[0] === idx1)

                    if (existing) {
                        newVariants.push({ ...existing, name })
                    } else {
                        newVariants.push({
                            name: name,
                            tierIndices: tierIndices,
                            sku: `${baseSku}-${idx1}`,
                            barcode: "",
                            price: basePrice,
                            stock: 0,
                            image: ""
                        })
                    }
                }
            })
        }
        form.setValue("variants", newVariants)
        setIsGeneratingVariants(false)
    }

    const [isSubmitting, setIsSubmitting] = useState(false)

    async function onSubmit(values: ProductBuilderValues) {
        setIsSubmitting(true)
        try {
            // Check if Edit or Create
            const url = isEditMode ? `/api/products/${initialData.id}` : "/api/products"
            const method = isEditMode ? "PUT" : "POST" // Or PATCH

            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values)
            })

            if (!res.ok) {
                const error = await res.text()
                alert(`Lỗi: ${error}`)
                return
            }

            alert(isEditMode ? "Cập nhật thành công!" : "Tạo sản phẩm thành công!")
            router.push("/products")
            router.refresh()
        } catch (error) {
            console.error(error)
            alert("Có lỗi xảy ra")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-muted/30">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-6 py-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/products">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-lg font-semibold">{isEditMode ? "Chỉnh sửa sản phẩm" : "Tạo sản phẩm"}</h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" disabled={isSubmitting}>Lưu nháp</Button>
                    <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSubmitting ? "Đang lưu..." : "Lưu & Đăng"}
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-[1600px] mx-auto w-full">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                            {/* LEFT COLUMN: MASTER DATA */}
                            <div className="lg:col-span-8 space-y-8">
                                {/* INFO & CATEGORY */}
                                <Card>
                                    <CardHeader><CardTitle>Thông tin cơ bản</CardTitle></CardHeader>
                                    <CardContent className="space-y-4">
                                        <FormField control={form.control} name="name" render={({ field }) => (
                                            <FormItem><FormLabel>Tên sản phẩm *</FormLabel><FormControl><Input placeholder="Tên sản phẩm..." {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />

                                        <FormField control={form.control} name="categoryId" render={({ field }) => (
                                            <FormItem><FormLabel>Danh mục ngành hàng *</FormLabel><FormControl>
                                                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" {...field}>
                                                    <option value="">Chọn danh mục...</option>
                                                    <option value="101">Thời trang nam</option>
                                                    <option value="102">Thời trang nữ</option>
                                                    <option value="103">Mẹ & Bé</option>
                                                </select>
                                            </FormControl><FormMessage /></FormItem>
                                        )} />

                                        <div className="space-y-3 border rounded-md p-4">
                                            <div className="flex items-center justify-between">
                                                <FormLabel>Mô tả sản phẩm</FormLabel>
                                                <FormField control={form.control} name="syncDescription" render={({ field }) => (
                                                    <div className="flex items-center gap-2">
                                                        <label className="text-xs text-muted-foreground cursor-pointer" htmlFor="sync-desc">Đồng bộ Text/HTML</label>
                                                        <Switch id="sync-desc" checked={field.value} onCheckedChange={field.onChange} />
                                                    </div>
                                                )} />
                                            </div>

                                            <Tabs defaultValue="text" className="w-full">
                                                <TabsList className="grid w-[200px] grid-cols-2">
                                                    <TabsTrigger value="text">Text</TabsTrigger>
                                                    <TabsTrigger value="html">HTML</TabsTrigger>
                                                </TabsList>
                                                <TabsContent value="text">
                                                    <FormField control={form.control} name="description" render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Textarea
                                                                    className="min-h-[150px] font-mono text-sm"
                                                                    placeholder="Nhập văn bản thuần..."
                                                                    {...field}
                                                                    onChange={(e) => {
                                                                        field.onChange(e);
                                                                        if (form.getValues("syncDescription")) {
                                                                            form.setValue("descriptionHtml", e.target.value.replace(/\n/g, "<br/>"));
                                                                        }
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )} />
                                                </TabsContent>
                                                <TabsContent value="html">
                                                    <FormField control={form.control} name="descriptionHtml" render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Textarea
                                                                    className="min-h-[150px] font-mono text-sm bg-slate-50 text-slate-700"
                                                                    placeholder="<div>Nhập mã HTML...</div>"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )} />
                                                </TabsContent>
                                            </Tabs>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* LOGISTICS & ATTRIBUTES */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card>
                                        <CardHeader className="flex flex-row items-center space-y-0 pb-2 gap-2">
                                            <Box className="h-5 w-5 text-muted-foreground" />
                                            <CardTitle className="text-base">Vận chuyển</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4 pt-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField control={form.control} name="weight" render={({ field }) => (
                                                    <FormItem><FormLabel>Cân nặng (g) *</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                                <FormField control={form.control} name="daysToShip" render={({ field }) => (
                                                    <FormItem><FormLabel>Chuẩn bị hàng</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                <FormField control={form.control} name="width" render={({ field }) => (
                                                    <FormItem><FormLabel className="text-xs">Rộng (cm)</FormLabel><FormControl><Input type="number" className="h-8" {...field} /></FormControl></FormItem>
                                                )} />
                                                <FormField control={form.control} name="height" render={({ field }) => (
                                                    <FormItem><FormLabel className="text-xs">Cao (cm)</FormLabel><FormControl><Input type="number" className="h-8" {...field} /></FormControl></FormItem>
                                                )} />
                                                <FormField control={form.control} name="depth" render={({ field }) => (
                                                    <FormItem><FormLabel className="text-xs">Dài (cm)</FormLabel><FormControl><Input type="number" className="h-8" {...field} /></FormControl></FormItem>
                                                )} />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-base">Thuộc tính</CardTitle>
                                            <Button type="button" variant="outline" size="sm" onClick={() => appendAttr({ name: "", value: "" })}>
                                                <Plus className="h-3 w-3 mr-1" /> Thêm
                                            </Button>
                                        </CardHeader>
                                        <CardContent className="space-y-2 pt-4">
                                            {attrFields.map((field, index) => (
                                                <div key={field.id} className="flex gap-2">
                                                    <FormField control={form.control} name={`attributes.${index}.name`} render={({ field }) => (
                                                        <Input placeholder="Tên" className="flex-1" {...field} />
                                                    )} />
                                                    <FormField control={form.control} name={`attributes.${index}.value`} render={({ field }) => (
                                                        <Input placeholder="Giá trị" className="flex-1" {...field} />
                                                    )} />
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeAttr(index)}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            ))}
                                            {attrFields.length === 0 && <p className="text-sm text-muted-foreground italic">Chưa có thuộc tính nào.</p>}
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* VARIANTS & PRICING */}
                                <Card>
                                    <CardHeader className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle>Thông tin bán hàng</CardTitle>
                                            <FormField control={form.control} name="hasVariants" render={({ field }) => (
                                                <div className="flex items-center gap-2">
                                                    <FormLabel className="font-normal cursor-pointer">Sản phẩm có nhiều phân loại?</FormLabel>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </div>
                                            )} />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {!hasVariants ? (
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField control={form.control} name="sku" render={({ field }) => (
                                                    <FormItem><FormLabel>SKU Phân loại</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                                <FormField control={form.control} name="barcode" render={({ field }) => (
                                                    <FormItem><FormLabel>Barcode</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                                <FormField control={form.control} name="price" render={({ field }) => (
                                                    <FormItem><FormLabel>Giá bán</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                                <FormField control={form.control} name="stock" render={({ field }) => (
                                                    <FormItem><FormLabel>Kho hàng</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                <div className="bg-muted/30 p-4 rounded-lg space-y-4 border">
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="text-sm font-semibold">Nhóm phân loại</h4>
                                                        {tierFields.length < 2 && (
                                                            <Button type="button" variant="secondary" size="sm" onClick={() => appendTier({ name: "", options: [] })}>
                                                                <Plus className="h-3 w-3 mr-1" /> Thêm nhóm
                                                            </Button>
                                                        )}
                                                    </div>

                                                    {tierFields.map((tier, tierIndex) => (
                                                        <div key={tier.id} className="space-y-2">
                                                            <div className="flex gap-2 items-center">
                                                                <FormField control={form.control} name={`variationTiers.${tierIndex}.name`} render={({ field }) => (
                                                                    <Input placeholder="Tên nhóm (vd: Màu sắc)" className="w-1/3" {...field} />
                                                                )} />
                                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeTier(tierIndex)}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                            <div className="pl-4 border-l-2 ml-2">
                                                                <p className="text-xs text-muted-foreground mr-2">Tùy chọn (Enter để thêm):</p>
                                                                <Input
                                                                    placeholder="Nhập..."
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            e.preventDefault();
                                                                            const val = e.currentTarget.value;
                                                                            if (val) {
                                                                                const current = form.getValues(`variationTiers.${tierIndex}.options`) || [];
                                                                                form.setValue(`variationTiers.${tierIndex}.options`, [...current, { name: val }]);
                                                                                e.currentTarget.value = "";
                                                                            }
                                                                        }
                                                                    }}
                                                                />
                                                                <div className="flex flex-wrap gap-2 mt-2">
                                                                    {form.watch(`variationTiers.${tierIndex}.options`)?.map((opt, optIdx) => (
                                                                        <Badge key={optIdx} variant="secondary">{opt.name}</Badge>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    <Button type="button" className="w-full mt-2" onClick={generateVariants}>
                                                        Tạo danh sách biến thể
                                                    </Button>
                                                </div>

                                                {form.watch("variants").length > 0 && (
                                                    <div className="border rounded-md">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead>Tên</TableHead>
                                                                    <TableHead className="w-[60px]">Ảnh</TableHead>
                                                                    <TableHead className="w-[140px]">SKU</TableHead>
                                                                    <TableHead className="w-[120px]">Giá</TableHead>
                                                                    <TableHead className="w-[100px]">Kho</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {form.watch("variants").map((variant, index) => (
                                                                    <TableRow key={index}>
                                                                        <TableCell>{variant.name}</TableCell>
                                                                        <TableCell>
                                                                            <Button variant="outline" size="icon" className="h-8 w-8" type="button"><Upload className="h-4 w-4" /></Button>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <Input
                                                                                value={variant.sku}
                                                                                onChange={(e) => form.setValue(`variants.${index}.sku`, e.target.value)}
                                                                                className="h-8"
                                                                            />
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <Input
                                                                                type="number"
                                                                                value={variant.price}
                                                                                onChange={(e) => form.setValue(`variants.${index}.price`, Number(e.target.value))}
                                                                                className="h-8"
                                                                            />
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <Input
                                                                                type="number"
                                                                                value={variant.stock}
                                                                                onChange={(e) => form.setValue(`variants.${index}.stock`, Number(e.target.value))}
                                                                                className="h-8"
                                                                            />
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* RIGHT COLUMN: CHANNELS */}
                            <div className="lg:col-span-4 space-y-6">
                                <ChannelPublisher />
                            </div>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    )
}
