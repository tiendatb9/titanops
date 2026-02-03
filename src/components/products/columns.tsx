"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
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
        header: "Sản phẩm (ID / SKU)",
        cell: ({ row }) => {
            const product = row.original
            return (
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-md border bg-muted/50 overflow-hidden shrink-0">
                        <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <div className="flex flex-col max-w-[220px]">
                        <div className="flex items-center gap-1">
                            <a href={product.sourceUrl || "#"} target="_blank" className="font-medium truncate hover:underline hover:text-blue-600" title={product.name}>
                                {product.name}
                            </a>
                        </div>
                        <div className="flex flex-col gap-0.5 mt-1">
                            <span className="text-[10px] text-muted-foreground">SKU: {product.sku}</span>
                            <div className="flex gap-1">
                                {product.sourceId && (
                                    <span className="text-[10px] text-blue-600 bg-blue-50 px-1 rounded border border-blue-100" title="Item ID">ID: {product.sourceId}</span>
                                )}
                                {product.daysToShip && (
                                    <span className="text-[10px] text-orange-600 bg-orange-50 px-1 rounded border border-orange-100" title="Days to Ship">DTS: {product.daysToShip}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
    },
    {
        accessorKey: "variants",
        header: "Chi tiết biến thể (Model ID / Giá / Kho)",
        cell: ({ row }) => {
            const variants = row.original.variants
            return (
                <div className="flex flex-col gap-2 text-sm min-w-[400px]">
                    <div className="grid grid-cols-12 gap-2 font-medium text-xs text-muted-foreground border-b pb-1">
                        <div className="col-span-4">Phân loại</div>
                        <div className="col-span-3">Giá bán</div>
                        <div className="col-span-2">Kho</div>
                        <div className="col-span-3">Trạng thái</div>
                    </div>
                    {variants.map((v) => (
                        <div key={v.id} className="grid grid-cols-12 gap-2 items-center border-b last:border-0 pb-1 last:pb-0 font-normal">
                            <div className="col-span-4 flex flex-col">
                                <span className="text-xs truncate font-medium" title={v.name}>{v.name}</span>
                                <span className="text-[10px] text-muted-foreground truncate" title={v.sourceSkuId}>ID: {v.sourceSkuId || "-"}</span>
                                <span className="text-[10px] text-muted-foreground truncate">{v.sku}</span>
                            </div>
                            <div className="col-span-3 flex flex-col justify-center">
                                {v.originalPrice && v.originalPrice > v.price && (
                                    <span className="text-[10px] text-muted-foreground line-through">
                                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v.originalPrice)}
                                    </span>
                                )}
                                <span className="text-xs font-semibold text-red-600">
                                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v.price)}
                                </span>
                                {v.promoId && <span className="text-[9px] text-green-600">KM: {v.promoId}</span>}
                            </div>
                            <div className="col-span-2 text-xs">
                                {v.stock}
                            </div>
                            <div className="col-span-3 flex flex-col">
                                {v.status === 'NORMAL' ? (
                                    <span className="text-[10px] text-green-600 bg-green-50 px-1 rounded w-fit">NORMAL</span>
                                ) : v.status === 'BANNED' ? (
                                    <span className="text-[10px] text-red-600 bg-red-50 px-1 rounded w-fit">BANNED</span>
                                ) : (
                                    <span className="text-[10px] text-gray-500">{v.status || "-"}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )
        }
    },
    /*
    // RAW JSON Column (Hidden or moved to actions)
    */
    {
        accessorKey: "platformStatus",
        header: "TT Sàn",
        cell: ({ row }) => {
            const status = row.original.platformStatus || "NORMAL"
            return (
                <Badge variant={status === "NORMAL" ? "outline" : "destructive"} className={status === "NORMAL" ? "text-green-600 border-green-200 bg-green-50" : ""}>
                    {status}
                </Badge>
            )
        }
    },
    {
        accessorKey: "status",
        header: "TT App",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            return (
                <Badge variant={status === "active" ? "default" : "secondary"}>
                    {status === "active" ? "Active" : "Draft"}
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
                        <DropdownMenuItem asChild>
                            <Link href={`/products/builder/${payment.id}`}>Chỉnh sửa</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>Đăng lên sàn</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Xóa</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]
