"use client"

import { DataTable } from "@/components/products/data-table"
import { Button } from "@/components/ui/button"
import { Plus, FileText, CheckCircle2, ArrowUpDown, MoreHorizontal } from "lucide-react"
import { useState } from "react"
import { ProductSheet } from "@/components/products/product-sheet"
import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Simplified Product Type for Table
type ProductData = {
    id: string
    name: string
    sku: string | null
    price: number
    stock: number
    status: string
    images: string[]
    source: string | null
    platformStatus: string | null
}

interface ProductsClientProps {
    data: ProductData[]
}

export function ProductsClient({ data }: ProductsClientProps) {
    const router = useRouter()
    const [sheetOpen, setSheetOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null)

    const handleEdit = (product: any) => {
        // Navigate to Edit Page
        router.push(`/products/${product.id}/edit`)
    }

    const handleAddNew = () => {
        router.push("/products/builder")
    }

    // Filter
    const draftProducts = data.filter(p => p.status === 'DRAFT')
    const publishedProducts = data.filter(p => p.status === 'ACTIVE')

    const getColumns = (): ColumnDef<ProductData>[] => [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
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
                const image = product.images?.[0] || "/placeholder.png"
                return (
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-md border bg-muted/50 overflow-hidden shrink-0">
                            <img src={image} alt={product.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <Link href={`/products/${product.id}/edit`} className="font-medium truncate max-w-[300px] hover:underline hover:text-primary transition-colors">
                                {product.name}
                            </Link>
                            <span className="text-xs text-muted-foreground truncate">SKU: {product.sku || '---'}</span>
                        </div>
                    </div>
                )
            },
        },
        {
            accessorKey: "price",
            header: "Giá bán",
            cell: ({ row }) => {
                const amount = Number(row.getValue("price"))
                return <div className="font-medium">{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount)}</div>
            },
        },
        {
            accessorKey: "stock",
            header: "Tồn kho",
            cell: ({ row }) => <div className="font-medium">{row.getValue("stock")}</div>
        },
        {
            accessorKey: "source",
            header: "Nguồn",
            cell: ({ row }) => {
                const s = row.original.source
                if (!s) return <span className="text-xs text-muted-foreground italic">Local</span>
                return (
                    <Badge variant="outline" className={s === 'SHOPEE' ? "bg-orange-50 text-orange-600 border-orange-200" : ""}>
                        {s}
                    </Badge>
                )
            }
        },
        {
            accessorKey: "status",
            header: "Trạng thái",
            cell: ({ row }) => {
                const status = row.original.status
                return (
                    <Badge variant={status === "ACTIVE" ? "default" : "secondary"}>
                        {status === "ACTIVE" ? "Đã đăng" : "Lưu trữ"}
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
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(product.id)}>Sao chép ID</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEdit(product)}>Chỉnh sửa</DropdownMenuItem>
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
                    <h2 className="text-2xl font-bold tracking-tight">Quản lý sản phẩm</h2>
                    <p className="text-muted-foreground">Danh sách sản phẩm từ cơ sở dữ liệu.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button onClick={handleAddNew}><Plus className="mr-2 h-4 w-4" /> Thêm mới</Button>
                </div>
            </div>

            <Tabs defaultValue="all" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="all">Tất cả ({data.length})</TabsTrigger>
                    <TabsTrigger value="draft" className="gap-2"><FileText className="h-4 w-4" /> Chờ đăng (0)</TabsTrigger>
                    <TabsTrigger value="published" className="gap-2"><CheckCircle2 className="h-4 w-4" /> Đã đăng ({publishedProducts.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="space-y-4">
                    <DataTable columns={getColumns()} data={data} />
                </TabsContent>
                <TabsContent value="draft" className="space-y-4">
                    <div className="py-8 text-center text-muted-foreground">Chưa có sản phẩm nháp</div>
                </TabsContent>
                <TabsContent value="published" className="space-y-4">
                    <DataTable columns={getColumns()} data={publishedProducts} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
