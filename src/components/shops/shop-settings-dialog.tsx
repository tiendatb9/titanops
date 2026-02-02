"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
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
import { Loader2, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

const formSchema = z.object({
    name: z.string().min(1, "Tên không được để trống"),
})

interface ShopSettingsDialogProps {
    shop: {
        id: string
        name: string
        platform: string
    } | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function ShopSettingsDialog({ shop, open, onOpenChange, onSuccess }: ShopSettingsDialogProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: shop?.name || "",
        },
        values: {
            name: shop?.name || "",
        }
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!shop) return
        setIsLoading(true)
        try {
            const res = await fetch(`/api/shops/${shop.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            })

            if (!res.ok) throw new Error("Failed to update")

            onSuccess() // Refresh list
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            alert("Lỗi khi cập nhật")
        } finally {
            setIsLoading(false)
        }
    }

    async function onDelete() {
        if (!shop) return
        if (!confirm("Bạn có chắc chắn muốn xóa cửa hàng này? Hành động này không thể hoàn tác.")) return

        setIsDeleting(true)
        try {
            const res = await fetch(`/api/shops/${shop.id}`, {
                method: "DELETE",
            })

            if (!res.ok) throw new Error("Failed to delete")

            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            alert("Lỗi khi xóa")
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Cấu hình cửa hàng</DialogTitle>
                    <DialogDescription>
                        Thay đổi tên hiển thị hoặc ngắt kết nối cửa hàng.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tên hiển thị</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Tên này chỉ hiển thị trên TitanOPS để bạn dễ quản lý.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-between pt-4">
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={onDelete}
                                disabled={isDeleting || isLoading}
                            >
                                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                Ngắt kết nối
                            </Button>

                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                    Hủy
                                </Button>
                                <Button type="submit" disabled={isLoading || isDeleting}>
                                    {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    Lưu thay đổi
                                </Button>
                            </div>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
