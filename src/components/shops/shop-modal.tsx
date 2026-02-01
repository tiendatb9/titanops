"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { shopFormSchema, ShopFormValues, Platform } from "./schema"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
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
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, ShoppingBag, Store } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface ShopModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ShopModal({ open, onOpenChange }: ShopModalProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const form = useForm<ShopFormValues>({
        resolver: zodResolver(shopFormSchema),
        defaultValues: {
            name: "",
            platform: Platform.SHOPEE,
            useCustomApp: false,
            appKey: "",
            appSecret: "",
            // New Platforms Defaults
            sapoDomain: "",
            sapoAccessToken: "",
            sapoLocationId: "",
            sapoAccountId: "",
            pancakeApiKey: "",
            pancakeShopId: "",
            wooDomain: "",
            wooConsumerKey: "",
            wooConsumerSecret: ""
        },
    })

    const useCustomApp = form.watch("useCustomApp")

    async function onSubmit(values: ShopFormValues) {
        setIsLoading(true)

        // Titan App Mode (OAuth)
        if (!values.useCustomApp) {
            if (values.platform === Platform.SHOPEE) {
                window.location.href = "/api/shops/shopee/auth"
                return
            }
            if (values.platform === Platform.TIKTOK) {
                window.location.href = "/api/shops/tiktok/auth"
                return
            }
        }

        try {
            const res = await fetch("/api/shops", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values)
            })

            if (!res.ok) {
                const err = await res.text()
                alert(`Lỗi kết nối: ${err}`)
                return
            }

            const data = await res.json()
            alert(`Đã kết nối thành công: ${data.name} (${data.platform})`)
            onOpenChange(false)
            router.refresh() // Refresh to show new shop in list
        } catch (error) {
            console.error(error)
            alert("Có lỗi xảy ra, vui lòng thử lại.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Thêm cửa hàng mới</DialogTitle>
                    <DialogDescription>
                        Hỗ trợ đa sàn (Shopee, TikTok) và các nền tảng bán hàng (Sapo, Pancake, WooCommerce).
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* 1. Basic Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <span className="bg-primary/10 text-primary w-5 h-5 rounded-full flex items-center justify-center text-xs">1</span>
                                Thông tin cơ bản
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <FormLabel>Tên gian hàng (Gợi nhớ)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="VD: Titan Store - SAPO CN1" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="platform"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <FormLabel>Nền tảng</FormLabel>
                                            <FormControl>
                                                <div className="grid grid-cols-4 gap-2">
                                                    {[
                                                        { id: Platform.SHOPEE, label: "Shopee", icon: ShoppingBag, color: "bg-orange-50 text-orange-600 border-orange-200" },
                                                        { id: Platform.TIKTOK, label: "TikTok", icon: Store, color: "bg-black text-white border-black" },
                                                        { id: Platform.LAZADA, label: "Lazada", icon: ShoppingBag, color: "bg-blue-50 text-blue-600 border-blue-200" },
                                                        { id: Platform.TIKI, label: "Tiki", icon: Store, color: "bg-blue-50 text-blue-500 border-blue-200" },
                                                        { id: Platform.SAPO, label: "Sapo", icon: Store, color: "bg-green-50 text-green-600 border-green-200" },
                                                        { id: Platform.PANCAKE, label: "Pancake", icon: Store, color: "bg-indigo-50 text-indigo-600 border-indigo-200" },
                                                        { id: Platform.WOO, label: "WooCommerce", icon: Store, color: "bg-purple-50 text-purple-600 border-purple-200" },
                                                    ].map((p) => (
                                                        <div
                                                            key={p.id}
                                                            onClick={() => field.onChange(p.id)}
                                                            className={`
                                                               cursor-pointer rounded-md border p-3 flex flex-col items-center justify-center gap-2 transition-all
                                                               ${field.value === p.id
                                                                    ? `ring-2 ring-primary ${p.color}`
                                                                    : "hover:bg-accent/50 text-muted-foreground border-transparent bg-slate-50"}
                                                           `}
                                                        >
                                                            <p.icon className="h-5 w-5" />
                                                            <span className="text-xs font-semibold">{p.label}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* 2. Connection Settings (Dynamic based on Platform) */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <span className="bg-primary/10 text-primary w-5 h-5 rounded-full flex items-center justify-center text-xs">2</span>
                                Cấu hình kết nối
                            </h3>

                            {/* CASE A: MARKETPLACES (Shopee, TikTok...) */}
                            {[Platform.SHOPEE, Platform.TIKTOK, Platform.LAZADA, Platform.TIKI].includes(form.watch('platform')) && (
                                <div className="rounded-lg border p-4 space-y-4 bg-slate-50/50">
                                    <div className="flex flex-row items-center justify-between">
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <FormLabel className="text-base font-semibold">Sử dụng App Riêng (BYOA)</FormLabel>
                                                <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50">Enterprise</Badge>
                                            </div>
                                            <FormDescription>Dùng API Key riêng thay vì Titan App.</FormDescription>
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name="useCustomApp"
                                            render={({ field }) => (
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            )}
                                        />
                                    </div>
                                    {useCustomApp && (
                                        <div className="grid gap-4 pt-2">
                                            <FormField control={form.control} name="appKey" render={({ field }) => (
                                                <FormItem><FormLabel>Partner/App ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            <FormField control={form.control} name="appSecret" render={({ field }) => (
                                                <FormItem><FormLabel>App Secret</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* CASE B: SAPO */}
                            {form.watch('platform') === Platform.SAPO && (
                                <div className="rounded-lg border p-4 grid gap-4 bg-green-50/30 border-green-100">
                                    <FormField control={form.control} name="sapoDomain" render={({ field }) => (
                                        <FormItem><FormLabel>Sapo Domain</FormLabel><FormControl><Input placeholder="vd: cuahang.mysapo.net" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="sapoAccessToken" render={({ field }) => (
                                        <FormItem><FormLabel>Storefront Access Token</FormLabel><FormControl><Input type="password" placeholder="Key..." {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={form.control} name="sapoLocationId" render={({ field }) => (
                                            <FormItem><FormLabel>Location ID (Kho)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="sapoAccountId" render={({ field }) => (
                                            <FormItem><FormLabel>Account ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                    <div className="text-xs text-muted-foreground p-2 bg-white rounded border">
                                        ℹ️ Vào <b>Cấu hình</b> &gt; <b>Ứng dụng</b> &gt; <b>Tạo API Key</b> để lấy thông tin này.
                                    </div>
                                </div>
                            )}

                            {/* CASE C: PANCAKE */}
                            {form.watch('platform') === Platform.PANCAKE && (
                                <div className="rounded-lg border p-4 grid gap-4 bg-indigo-50/30 border-indigo-100">
                                    <FormField control={form.control} name="pancakeApiKey" render={({ field }) => (
                                        <FormItem><FormLabel>Pancake API Key</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="pancakeShopId" render={({ field }) => (
                                        <FormItem><FormLabel>Shop ID (POS)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <div className="text-xs text-muted-foreground p-2 bg-white rounded border">
                                        ℹ️ Truy cập <b>Web POS</b> &gt; <b>Cấu hình</b> &gt; <b>API</b> để lấy Key.
                                    </div>
                                </div>
                            )}

                            {/* CASE D: WOOCOMMERCE */}
                            {form.watch('platform') === Platform.WOO && (
                                <div className="rounded-lg border p-4 grid gap-4 bg-purple-50/30 border-purple-100">
                                    <FormField control={form.control} name="wooDomain" render={({ field }) => (
                                        <FormItem><FormLabel>Website Domain</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="wooConsumerKey" render={({ field }) => (
                                        <FormItem><FormLabel>Consumer Key</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="wooConsumerSecret" render={({ field }) => (
                                        <FormItem><FormLabel>Consumer Secret</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <div className="text-xs text-muted-foreground p-2 bg-white rounded border">
                                        ℹ️ Vào <b>WooCommerce</b> &gt; <b>Settings</b> &gt; <b>Advanced</b> &gt; <b>REST API</b> để tạo Key.
                                    </div>
                                </div>
                            )}
                        </div>



                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Hủy bỏ</Button>
                            <Button type="submit" className="bg-primary" disabled={isLoading}>
                                {isLoading ? "Đang xử lý..." : (
                                    (!useCustomApp && [Platform.SHOPEE, Platform.TIKTOK].includes(form.watch('platform')))
                                        ? `Kết nối với ${form.watch('platform') === Platform.SHOPEE ? 'Shopee' : 'TikTok'}`
                                        : useCustomApp ||
                                            [Platform.SAPO, Platform.PANCAKE, Platform.WOO].includes(form.watch('platform'))
                                            ? "Xác minh & Kết nối" : "Kết nối Ngay"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog >
    )
}
