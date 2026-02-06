"use client"

import { useEffect, useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Product } from "./schema"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Trash2, Upload, AlertCircle } from "lucide-react"
import { toast } from "sonner"

import { CategoryCascader } from "./category-cascader"

const formSchema = z.object({
    name: z.string().min(2, {
        message: "Tên sản phẩm phải có ít nhất 2 ký tự.",
    }),
    sku: z.string().min(1, {
        message: "SKU không được để trống.",
    }),
    description: z.string().optional(),
    price: z.coerce.number().min(0),
    stock: z.coerce.number().int().min(0),
    status: z.enum(["active", "draft", "archived"]),
    platforms: z.object({
        shopee: z.boolean().default(false),
        tiktok: z.boolean().default(false),
        lazada: z.boolean().default(false),
    })
})

type ProductSheetProps = {
    product?: Product | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ProductSheet({ product, open, onOpenChange }: ProductSheetProps) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: "",
            sku: "",
            description: "",
            price: 0,
            stock: 0,
            status: "draft",
            platforms: {
                shopee: false,
                tiktok: false,
                lazada: false,
            }
        },
    })

    // State for Variants
    const [variants, setVariants] = useState<any[]>([])
    const [shopeeAttributes, setShopeeAttributes] = useState<any[]>([])
    const [isLoadingAttributes, setIsLoadingAttributes] = useState(false)

    // Reset form when product changes
    useEffect(() => {
        if (product) {
            form.reset({
                name: product.name,
                sku: product.sku || "",
                description: product.description || "",
                price: Number(product.price) || 0,
                stock: Number(product.stock) || 0,
                status: product.status || "draft",
                platforms: {
                    shopee: product.platforms?.shopee || false,
                    tiktok: product.platforms?.tiktok || false,
                    lazada: product.platforms?.lazada || false,
                }
            })

            // FETCH VARIANTS
            if (product.sourceId) {
                fetch(`/api/products?sourceId=${product.sourceId}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.products) setVariants(data.products)
                    })
                    .catch(e => console.error("Failed to fetch variants", e))
            } else {
                setVariants([product]) // Local product / No source ID
            }

            // FETCH ATTRIBUTES (If Shop & Category exist)
            // Assuming product has categoryId and shopId. 
            // If not available in 'product' schema, we might need to fetch detailed info or pass it.
            // For now, let's try to fetch if we have categoryId.
            // Note: The schema 'Product' might not have categoryId at root level if it's not in the view model. 
            // But let's assume it might or we use a fallback.
            // If the real categoryId is missing, we can't fetch. 
            if (product.shopId && product.categoryId) {
                setIsLoadingAttributes(true)
                fetch(`/api/shopee/attributes?shopId=${product.shopId}&categoryId=${product.categoryId}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.response?.attribute_list) {
                            setShopeeAttributes(data.response.attribute_list)
                        }
                    })
                    .finally(() => setIsLoadingAttributes(false))
            }

        } else {
            setVariants([])
            setShopeeAttributes([])
            form.reset({
                name: "",
                sku: "",
                description: "",
                price: 0,
                stock: 0,
                status: "draft",
                platforms: { shopee: false, tiktok: false, lazada: false }
            })
        }
    }, [product, form, open]) // Reset when opening/product changes

    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values)
        onOpenChange(false)
        // TODO: Call API to save
        alert("Đã lưu sản phẩm (Simulation): " + values.name)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="min-w-[90vw] sm:min-w-[800px] p-0 flex flex-col">
                <SheetHeader className="p-6 pb-2">
                    <SheetTitle>{product ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}</SheetTitle>
                    <SheetDescription>
                        {product ? `Cập nhật thông tin cho SKU: ${product.sku}` : "Tạo sản phẩm mới để đăng bán đa sàn."}
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 flex-1 flex flex-col min-h-0">
                        <ScrollArea className="flex-1 px-6">
                            <Tabs defaultValue="general" className="w-full">
                                <TabsList className="grid w-full grid-cols-5">
                                    <TabsTrigger value="general">Thông tin</TabsTrigger>
                                    <TabsTrigger value="images">Hình ảnh</TabsTrigger>
                                    <TabsTrigger value="attributes">Thuộc tính</TabsTrigger>
                                    <TabsTrigger value="variants">Phân loại</TabsTrigger>
                                    <TabsTrigger value="shipping">Vận chuyển</TabsTrigger>
                                </TabsList>

                                <TabsContent value="general" className="space-y-4 pt-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tên sản phẩm</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Nhập tên sản phẩm..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="sku"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Mã sản phẩm (SKU)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="SKU-..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="status"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Trạng thái</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Chọn trạng thái" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="active">Đang bán (Active)</SelectItem>
                                                            <SelectItem value="draft">Bản nháp (Draft)</SelectItem>
                                                            <SelectItem value="archived">Lưu trữ (Archived)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Mô tả chi tiết</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Mô tả sản phẩm..."
                                                        className="min-h-[200px]"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </TabsContent>

                                <TabsContent value="images" className="space-y-4 pt-4">
                                    <div className="flex flex-wrap gap-4">
                                        {product?.images && product.images.length > 0 ? (
                                            product.images.map((img: string, i: number) => (
                                                <div key={i} className="relative h-24 w-24 rounded-md overflow-hidden border group">
                                                    <img src={img} alt={`Product ${i}`} className="h-full w-full object-cover" />
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-sm text-muted-foreground">Chưa có hình ảnh.</div>
                                        )}
                                        <div className="h-24 w-24 rounded-md border border-dashed flex items-center justify-center cursor-pointer hover:bg-muted/50">
                                            <Plus className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="attributes" className="space-y-4 pt-4">
                                    {isLoadingAttributes ? (
                                        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                                    ) : shopeeAttributes.length > 0 ? (
                                        <ScrollArea className="h-[400px] pr-4">
                                            <div className="space-y-4">
                                                {shopeeAttributes.map((attr: any) => (
                                                    <div key={attr.attribute_id} className="grid grid-cols-1 gap-2">
                                                        <Label className="text-sm font-medium">
                                                            {attr.original_attribute_name}
                                                            {attr.is_mandatory && <span className="text-red-500 ml-1">*</span>}
                                                        </Label>
                                                        {attr.input_type === 'DROP_DOWN' || attr.input_type === 'COMBO_BOX' ? (
                                                            <Select>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder={`Chọn ${attr.original_attribute_name}`} />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {attr.attribute_value_list?.map((val: any) => (
                                                                        <SelectItem key={val.value_id} value={String(val.value_id)}>
                                                                            {val.original_value_name}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        ) : (
                                                            <Input placeholder={`Nhập ${attr.original_attribute_name}...`} />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground text-sm">
                                            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                            <p>Không tìm thấy thuộc tính sàn.</p>
                                            <p className="text-xs">Vui lòng đảm bảo sản phẩm đã chọn đúng Danh mục Shopee.</p>
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="variants" className="space-y-4 pt-4">
                                    <div className="rounded-md border">
                                        <div className="grid grid-cols-12 gap-2 p-2 bg-muted/50 font-medium text-sm">
                                            <div className="col-span-1">Img</div>
                                            <div className="col-span-4">Phân loại</div>
                                            <div className="col-span-3">Giá</div>
                                            <div className="col-span-2">Kho</div>
                                            <div className="col-span-2">SKU</div>
                                        </div>
                                        <ScrollArea className="h-[300px]">
                                            <div className="flex flex-col">
                                                {variants.length === 0 ? (
                                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                                        Sản phẩm không có phân loại hoặc đang tải...
                                                    </div>
                                                ) : (
                                                    variants.map((variant, index) => (
                                                        <div key={variant.id} className="grid grid-cols-12 gap-2 p-2 border-b last:border-0 items-center text-sm">
                                                            <div className="col-span-1 h-8 w-8 bg-muted rounded overflow-hidden">
                                                                <img src={variant.images[0] || "/placeholder.png"} className="h-full w-full object-cover" />
                                                            </div>
                                                            <div className="col-span-4 font-medium truncate" title={variant.variantName}>
                                                                {variant.variantName || variant.name}
                                                            </div>
                                                            <div className="col-span-3">
                                                                <div className="text-xs text-muted-foreground line-through">
                                                                    {variant.originalPrice ? Number(variant.originalPrice).toLocaleString() : ''}
                                                                </div>
                                                                <div className="font-mono text-red-600">
                                                                    {Number(variant.promoPrice || variant.price).toLocaleString()}
                                                                </div>
                                                            </div>
                                                            <div className="col-span-2">
                                                                {variant.stock}
                                                            </div>
                                                            <div className="col-span-2 text-xs truncate" title={variant.sku}>
                                                                {variant.sku}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                    <div className="p-2 border rounded-md bg-yellow-50 text-yellow-800 text-xs mt-2">
                                        Lưu ý: Tính năng chỉnh sửa giá/kho đồng loạt đang được phát triển.
                                    </div>
                                </TabsContent>

                                <TabsContent value="shipping" className="space-y-4 pt-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Cân nặng (g)</Label>
                                            <Input type="number" placeholder="500" value={product?.weight || 500} disabled />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Thời gian chuẩn bị (ngày)</Label>
                                            <Input type="number" placeholder="2" value={product?.daysToShip || 2} disabled />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="space-y-2">
                                            <Label className="text-xs">Dài (cm)</Label>
                                            <Input type="number" placeholder="10" disabled />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs">Rộng (cm)</Label>
                                            <Input type="number" placeholder="10" disabled />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs">Cao (cm)</Label>
                                            <Input type="number" placeholder="5" disabled />
                                        </div>
                                    </div>
                                </TabsContent>
                                <TabsContent value="platforms" className="space-y-4">
                                    <div className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="platforms.shopee"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-base">Shopee</FormLabel>
                                                        <FormDescription>
                                                            Đăng và đồng bộ sản phẩm lên Shopee.
                                                        </FormDescription>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="platforms.tiktok"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-base">TikTok Shop</FormLabel>
                                                        <FormDescription>
                                                            Đăng và đồng bộ sản phẩm lên TikTok.
                                                        </FormDescription>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="platforms.lazada"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-base">Lazada</FormLabel>
                                                        <FormDescription>
                                                            Kênh bán hàng Lazada (Sắp ra mắt).
                                                        </FormDescription>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                            disabled
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </ScrollArea>

                        <SheetFooter className="p-6 pt-2 border-t mt-auto">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy bỏ</Button>
                            <Button type="submit">Lưu thay đổi</Button>
                        </SheetFooter>
                    </form>
                </Form>
            </SheetContent>
        </Sheet >
    )
}
