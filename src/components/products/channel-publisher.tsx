"use client"

import { useFormContext, useFieldArray } from "react-hook-form"
import { ProductBuilderValues } from "./builder/schema"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Store, ShoppingBag, Globe, AlertCircle } from "lucide-react"

export function ChannelPublisher() {
    const form = useFormContext<ProductBuilderValues>()

    // We assume 'channels' is already populated with available shops (from API or Props)
    // In a real app, we might fetch available shops and merge with form values
    const { fields, update } = useFieldArray({
        control: form.control,
        name: "channels"
    })

    const getPlatformIcon = (platform: string) => {
        switch (platform) {
            case "SHOPEE": return <ShoppingBag className="h-4 w-4 text-orange-500" />
            case "TIKTOK": return <span className="text-xs font-bold bg-black text-white px-1 rounded">Tk</span>
            default: return <Store className="h-4 w-4" />
        }
    }

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Đăng đa kênh
                </CardTitle>
                <CardDescription>Chọn shop và điều chỉnh giá riêng</CardDescription>
                <div className="flex gap-2 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        className="text-[10px] h-7"
                        onClick={() => {
                            const masterPrice = form.getValues("price") || 0
                            const current = form.getValues("channels")
                            const updated = current.map(c => ({ ...c, price: masterPrice }))
                            form.setValue("channels", updated, { shouldDirty: true })
                        }}
                    >
                        Đồng bộ Giá
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        className="text-[10px] h-7"
                        onClick={() => {
                            const masterStock = form.getValues("stock") || 0
                            const current = form.getValues("channels")
                            const updated = current.map(c => ({ ...c, stock: masterStock }))
                            form.setValue("channels", updated, { shouldDirty: true })
                        }}
                    >
                        Đồng bộ Kho
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {fields.map((field, index) => {
                    const isActive = form.watch(`channels.${index}.isActive`)

                    return (
                        <div key={field.id} className={`border rounded-lg p-3 transition-colors ${isActive ? 'bg-background border-primary/50' : 'bg-muted/50'}`}>
                            {/* Header: Checkbox + Shop Name */}
                            <div className="flex items-start gap-3">
                                <FormField
                                    control={form.control}
                                    name={`channels.${index}.isActive`}
                                    render={({ field: cbField }) => (
                                        <Checkbox
                                            checked={cbField.value}
                                            onCheckedChange={cbField.onChange}
                                            className="mt-1"
                                        />
                                    )}
                                />
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                        {getPlatformIcon(field.platform)}
                                        <label className="text-sm font-medium cursor-pointer" onClick={() => form.setValue(`channels.${index}.isActive`, !isActive)}>
                                            {field.shopName}
                                        </label>
                                        {isActive && <Badge variant="outline" className="text-[10px] h-5">Live</Badge>}
                                    </div>

                                    {isActive && (
                                        <div className="grid grid-cols-2 gap-2 mt-3 animate-in fade-in slide-in-from-top-1">
                                            <FormField
                                                control={form.control}
                                                name={`channels.${index}.price`}
                                                render={({ field: pField }) => (
                                                    <FormItem className="space-y-0">
                                                        <FormLabel className="text-[10px] text-muted-foreground">Giá bán kênh</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Input
                                                                    type="number"
                                                                    className="h-7 text-xs pr-6"
                                                                    placeholder="Mặc định"
                                                                    {...pField}
                                                                />
                                                                <span className="absolute right-2 top-1.5 text-[10px] text-muted-foreground">đ</span>
                                                            </div>
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`channels.${index}.stock`}
                                                render={({ field: sField }) => (
                                                    <FormItem className="space-y-0">
                                                        <FormLabel className="text-[10px] text-muted-foreground">Tồn kho kênh</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                className="h-7 text-xs"
                                                                placeholder="Mặc định"
                                                                {...sField}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    )}

                                    {/* Mock Validation or Info */}
                                    {isActive && field.platform === "SHOPEE" && (
                                        <div className="flex items-center gap-1 mt-2 text-[10px] text-amber-600">
                                            <AlertCircle className="h-3 w-3" />
                                            <span>Shopee yêu cầu cân nặng chính xác</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}

                {fields.length === 0 && <div className="text-center text-sm text-muted-foreground py-4">Chưa kết nối Shop nào.</div>}
            </CardContent>
        </Card>
    )
}
