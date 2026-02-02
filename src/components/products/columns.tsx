"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Product } from "./schema"

export const columns: ColumnDef<Product>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "name",
        header: "Sản phẩm",
        cell: ({ row }) => {
            const product = row.original
            return (
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-md border bg-muted/50 overflow-hidden">
                        <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium truncate max-w-[200px]">{product.name}</span>
                        <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>
                    </div>
                </div>
            )
        },
    },
    {
        accessorKey: "price",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Giá bán
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("price"))
            const formatted = new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
            }).format(amount)

            return <div className="font-medium">{formatted}</div>
        },
    },
    {
        accessorKey: "stock",
        header: "Tồn kho",
        cell: ({ row }) => {
            return <div className="font-medium">{row.getValue("stock")}</div>
        }
    },
    {
        accessorKey: "platforms",
        header: "Sàn liên kết",
        cell: ({ row }) => {
            const platforms = row.original.platforms
            return (
                <div className="flex gap-1">
                    {platforms.shopee && <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">Shopee</Badge>}
                    {platforms.tiktok && <Badge variant="outline" className="bg-black text-white border-gray-800">TikTok</Badge>}
                    {platforms.lazada && <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Lazada</Badge>}
                </div>
            )
        }
    },
    {
        id: "rawJson",
        header: "Nguồn dữ liệu",
        cell: ({ row }) => {
            const raw = (row.original as any).rawJson
            if (!raw) return <span className="text-muted-foreground text-xs">Trống</span>

            return (
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-6 text-xs bg-blue-50 text-blue-700 border-blue-200">
                            Xem JSON
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[800px] max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Dữ liệu gốc từ Sàn</DialogTitle>
                            <DialogDescription>Dữ liệu JSON thô được trả về từ API của sàn.</DialogDescription>
                        </DialogHeader>
                        <div className="bg-slate-950 text-slate-50 p-4 rounded-md text-xs font-mono whitespace-pre-wrap overflow-auto h-[500px]">
                            {JSON.stringify(raw, null, 2)}
                        </div>
                    </DialogContent>
                </Dialog>
            )
        }
    },
    {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            return (
                <Badge variant={status === "active" ? "default" : "secondary"}>
                    {status === "active" ? "Đang bán" : status === "draft" ? "Nháp" : "Lưu trữ"}
                </Badge>
            )
        }
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const payment = row.original

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => navigator.clipboard.writeText(payment.id)}
                        >
                            Sao chép ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Chỉnh sửa</DropdownMenuItem>
                        <DropdownMenuItem>Đăng lên sàn</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Xóa</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]
