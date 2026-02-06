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
            const isParent = product.type === 'parent'

            if (isParent) {
                return (
                    <div className="flex items-center gap-3 py-1">
                        <div className="h-10 w-10 rounded-md border bg-muted/50 overflow-hidden shrink-0">
                            <img
                                src={product.image}
                                alt={product.name}
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1">
                                <span className="font-semibold text-sm truncate max-w-[300px]" title={product.name}>
                                    {product.name}
                                </span>
                                {product.sourceUrl && (
                                    <a href={product.sourceUrl} target="_blank" className="text-muted-foreground hover:text-blue-600">
                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </a>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                                {product.sourceId && (
                                    <span className="text-[10px] text-blue-600 bg-blue-50 px-1 rounded border border-blue-100" title="Item ID">
                                        ID: {product.sourceId}
                                    </span>
                                )}
                                <span className="text-[10px] text-muted-foreground">{product.sku}</span>
                            </div>
                        </div>
                    </div>
                )
            }

            // Variant Row
            return (
                <div className="flex items-center gap-3 pl-8 relative"> {/* Indent */}
                    {/* Tree connector line can be added via CSS if needed, for now just padding */}
                    <div className="h-8 w-8 rounded border bg-muted/50 overflow-hidden shrink-0">
                        <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <div className="flex flex-col max-w-[220px]">
                        <div className="text-xs font-medium text-purple-700">
                            pl: {product.variantName}
                        </div>
                        <div className="flex flex-col gap-0.5 mt-0.5">
                            <span className="text-[10px] text-muted-foreground">SKU: {product.sku}</span>
                            <div className="flex gap-1">
                                <span className="text-[10px] text-gray-500 bg-gray-50 px-1 rounded border border-gray-100" title="Variant ID">ID: {product.id}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
    },
    {
        accessorKey: "price",
        header: "Giá bán",
        cell: ({ row }) => {
            const p = row.original
            return (
                <div className="flex flex-col justify-center">
                    {p.originalPrice && p.originalPrice > p.price && (
                        <span className="text-[10px] text-muted-foreground line-through">
                            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p.originalPrice)}
                        </span>
                    )}
                    <span className="text-sm font-semibold text-red-600">
                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p.price)}
                    </span>
                    {p.promoId && <span className="text-[9px] text-green-600">KM: {p.promoId}</span>}
                </div>
            )
        }
    },
    {
        accessorKey: "stock",
        header: "Kho",
        cell: ({ row }) => {
            if (row.original.type === 'parent') return null
            return <div className="font-medium">{row.getValue("stock")}</div>
        },
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
                            <Link href={`/products/${payment.id}/edit`}>Chỉnh sửa</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>Đăng lên sàn</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Xóa</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]
