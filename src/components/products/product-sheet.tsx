"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
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
        resolver: zodResolver(formSchema),
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

    // Reset form when product changes
    useEffect(() => {
        if (product) {
            form.reset({
                name: product.name,
                sku: product.sku,
                description: "", // Mock data doesn't have desc yet
                price: product.price,
                stock: product.stock,
                status: product.status,
                platforms: {
                    shopee: product.platforms.shopee || false,
                    tiktok: product.platforms.tiktok || false,
                    lazada: product.platforms.lazada || false,
                }
            })
        } else {
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
            <SheetContent className="w-[800px] sm:w-[540px] md:w-[700px] p-0 flex flex-col">
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
                                <TabsList className="grid w-full grid-cols-3 mb-4">
                                    <TabsTrigger value="general">Thông tin chung</TabsTrigger>
                                    <TabsTrigger value="variants">Biến thể & Giá</TabsTrigger>
                                    <TabsTrigger value="platforms">Cấu hình Sàn</TabsTrigger>
                                </TabsList>

                                <TabsContent value="general" className="space-y-4">
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
                                                    <FormLabel>SKU (Mã quản lý)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="VD: AO-001" {...field} />
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
                                                        className="min-h-[150px]"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </TabsContent>

                                <TabsContent value="variants" className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="price"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Giá bán lẻ (VND)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" {...field} />
                                                    </FormControl>
                                                    <FormDescription>Giá mặc định khi chưa cấu hình sàn.</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="stock"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Tồn kho tổng</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="p-4 border rounded-md bg-muted/50 text-center text-sm text-muted-foreground">
                                        Tính năng quản lý Biến thể (Size/Màu) nâng cao sẽ được cập nhật trong phiên bản sau.
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
        </Sheet>
    )
}
