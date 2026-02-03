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
        header: "Sản phẩm",
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
                    <div className="flex flex-col max-w-[200px]">
                        <span className="font-medium truncate" title={product.name}>{product.name}</span>
                        <div className="flex flex-col gap-0.5 mt-1">
                            <span className="text-[10px] text-muted-foreground">Master SKU: {product.sku}</span>
                            {product.sourceId && (
                                <span className="text-[10px] text-blue-600 bg-blue-50 px-1 rounded w-fit">ID: {product.sourceId}</span>
                            )}
                        </div>
                    </div>
                </div>
            )
        },
    },
    {
        accessorKey: "variants",
        header: "Chi tiết biến thể",
        cell: ({ row }) => {
            const variants = row.original.variants
            return (
                <div className="flex flex-col gap-2 text-sm min-w-[300px]">
                    <div className="grid grid-cols-12 gap-2 font-medium text-xs text-muted-foreground border-b pb-1">
                        <div className="col-span-4">SKU</div>
                        <div className="col-span-3">Giá</div>
                        <div className="col-span-2">Kho</div>
                        <div className="col-span-3">ID Sàn</div>
                    </div>
                    {variants.map((v) => (
                        <div key={v.id} className="grid grid-cols-12 gap-2 items-center border-b last:border-0 pb-1 last:pb-0">
                            <div className="col-span-4 flex flex-col">
                                <span className="font-medium truncate" title={v.sku}>{v.sku}</span>
                                {v.name !== 'Default' && <span className="text-[10px] text-muted-foreground truncate">{v.name}</span>}
                            </div>
                            <div className="col-span-3 text-xs">
                                {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v.price)}
                            </div>
                            <div className="col-span-2 text-xs">
                                {v.stock}
                            </div>
                            <div className="col-span-3 flex flex-col">
                                <span className="text-[10px] text-muted-foreground truncate" title={v.sourceSkuId || "N/A"}>
                                    {v.sourceSkuId || "-"}
                                </span>
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
