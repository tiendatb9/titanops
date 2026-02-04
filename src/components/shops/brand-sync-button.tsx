
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

interface BrandSyncButtonProps {
    shopId: string
    categoryId?: number
}

export function BrandSyncButton({ shopId, categoryId }: BrandSyncButtonProps) {
    const [open, setOpen] = React.useState(false)
    const [syncing, setSyncing] = React.useState(false)
    const [progress, setProgress] = React.useState(0) // Percentage or Count
    const [status, setStatus] = React.useState("")
    const [totalSynced, setTotalSynced] = React.useState(0)

    const handleSync = async () => {
        if (!categoryId) {
            toast.error("Vui lòng chọn hoặc cung cấp Category ID để đồng bộ")
            return
        }

        setSyncing(true)
        setStatus("Đang khởi tạo...")
        setTotalSynced(0)
        setProgress(0)

        // Estimated total for progress bar? Hard to know. Shopee doesn't say.
        // Assume 5000 for visuals? Or just spinner.

        let offset = 0
        let hasNext = true

        try {
            while (hasNext && open) { // Stop if modal closed
                const res = await fetch(`/api/shops/${shopId}/brands/sync`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ categoryId, offset })
                })

                if (!res.ok) throw new Error(await res.text())

                const data = await res.json()

                // Update State
                setTotalSynced(prev => prev + (data.syncedCount || 0))
                setStatus(`Đã đồng bộ: ${totalSynced + (data.syncedCount || 0)} thương hiệu`)

                // Logic for next
                if (data.hasNextPage) {
                    offset = data.nextOffset
                    // Minimal delay to prevent freezing UI
                    await new Promise(r => setTimeout(r, 100))
                } else {
                    hasNext = false
                }
            }

            setStatus("Hoàn tất!")
            toast.success(`Đã đồng bộ xong ${totalSynced} thương hiệu!`)
            // Close after 2s
            setTimeout(() => setOpen(false), 2000)

        } catch (e: any) {
            toast.error(`Lỗi đồng bộ: ${e.message}`)
            setStatus("Lỗi!")
        } finally {
            setSyncing(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Đồng bộ Brand
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Đồng bộ Thương hiệu từ Shopee</DialogTitle>
                    <DialogDescription>
                        Quá trình này sẽ tải toàn bộ thương hiệu về Database để tìm kiếm nhanh hơn.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {!categoryId ? (
                        <div className="text-red-500 text-sm">Cần chọn ngành hàng trước khi đồng bộ.</div>
                    ) : (
                        <div className="space-y-2">
                            <div className="text-sm font-medium">{status || "Sẵn sàng"}</div>
                            {syncing && <Progress value={30} className="animate-pulse" />}
                            {/* Determining value is hard without total */}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setOpen(false)} disabled={syncing}>Đóng</Button>
                    <Button onClick={handleSync} disabled={syncing || !categoryId}>
                        {syncing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Đang chạy...
                            </>
                        ) : "Bắt đầu"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
