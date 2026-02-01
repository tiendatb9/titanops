"use client"

import { DataTable } from "@/components/products/data-table"
import { sampleProducts } from "@/components/products/data"
import { Button } from "@/components/ui/button"
import { Plus, ListFilter, FileText, CheckCircle2 } from "lucide-react"
import { useState } from "react"
import { ProductSheet } from "@/components/products/product-sheet"
import { Product } from "@/components/products/schema"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"

export default function ProductsPage() {
    const router = useRouter()
    const [sheetOpen, setSheetOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

    const handleEdit = (product: Product) => {
        setSelectedProduct(product)
        setSheetOpen(true)
    }

    const handleAddNew = () => {
        // Redirect to Builder for full experience
        router.push("/products/builder")
    }

    // Filter Data
    const draftProducts = sampleProducts.filter(p => p.status === 'draft')
    const publishedProducts = sampleProducts.filter(p => p.status === 'active')

    // Define columns locally to access handlers
    const getColumns = (): ColumnDef<Product>[] => [
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
                            <span className="font-medium truncate max-w-[300px]">{product.name}</span>
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
                        Giá Master
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
            header: "Tồn Master",
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
                        {(!platforms.shopee && !platforms.tiktok && !platforms.lazada) && <span className="text-xs text-muted-foreground italic">Chưa liên kết</span>}
                    </div>
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
                        {status === "active" ? "Đã đăng" : status === "draft" ? "Chờ đăng" : "Lưu trữ"}
                    </Badge>
                )
            }
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const product = row.original

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
                                onClick={() => navigator.clipboard.writeText(product.id)}
                            >
                                Sao chép ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEdit(product)}>Chỉnh sửa nhanh</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push("/products/builder")}>Mở Builder chi tiết</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">Xóa</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]

    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 flex">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Quản lý sản phẩm (Local)</h2>
                    <p className="text-muted-foreground">
                        Sản phẩm gốc được lưu trữ tại máy/extension trước khi đẩy lên sàn.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button onClick={handleAddNew}>
                        <Plus className="mr-2 h-4 w-4" /> Thêm mới
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="all" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="all">Tất cả</TabsTrigger>
                    <TabsTrigger value="draft" className="gap-2">
                        <FileText className="h-4 w-4" /> Chờ đăng (Draft)
                    </TabsTrigger>
                    <TabsTrigger value="published" className="gap-2">
                        <CheckCircle2 className="h-4 w-4" /> Đã đăng (Published)
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="space-y-4">
                    <DataTable columns={getColumns()} data={sampleProducts} />
                </TabsContent>
                <TabsContent value="draft" className="space-y-4">
                    <DataTable columns={getColumns()} data={draftProducts} />
                </TabsContent>
                <TabsContent value="published" className="space-y-4">
                    <DataTable columns={getColumns()} data={publishedProducts} />
                </TabsContent>
            </Tabs>

            <ProductSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                product={selectedProduct}
            />
        </div>
    )
}
