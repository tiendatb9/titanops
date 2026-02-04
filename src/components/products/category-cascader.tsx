
"use client"

import * as React from "react"
import { Check, ChevronRight, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Category {
    category_id: number
    parent_category_id: number
    display_category_name: string
    has_children: boolean
}

interface CategoryCascaderProps {
    categories: Category[]
    value?: number
    onSelect: (categoryId: number) => void
    width?: string
}

export function CategoryCascader({ categories, value, onSelect, width = "w-full" }: CategoryCascaderProps) {
    const [open, setOpen] = React.useState(false)

    // Selection State (Path)
    const [selectedL1, setSelectedL1] = React.useState<Category | null>(null)
    const [selectedL2, setSelectedL2] = React.useState<Category | null>(null)
    const [selectedL3, setSelectedL3] = React.useState<Category | null>(null)
    const [selectedL4, setSelectedL4] = React.useState<Category | null>(null)

    // Derived Lists
    const roots = React.useMemo(() => categories.filter(c => c.parent_category_id === 0), [categories])
    const l2List = React.useMemo(() => selectedL1 ? categories.filter(c => c.parent_category_id === selectedL1.category_id) : [], [categories, selectedL1])
    const l3List = React.useMemo(() => selectedL2 ? categories.filter(c => c.parent_category_id === selectedL2.category_id) : [], [categories, selectedL2])
    const l4List = React.useMemo(() => selectedL3 ? categories.filter(c => c.parent_category_id === selectedL3.category_id) : [], [categories, selectedL3])

    // Initialize from value on Open
    React.useEffect(() => {
        if (open && value) {
            // Reverse traverse to find path
            const leaf = categories.find(c => c.category_id === value)
            if (leaf) {
                const path = [leaf]
                let curr = leaf
                while (curr.parent_category_id !== 0) {
                    const parent = categories.find(c => c.category_id === curr.parent_category_id)
                    if (parent) {
                        path.unshift(parent)
                        curr = parent
                    } else break
                }

                // Assign to state based on depth
                if (path[0]) setSelectedL1(path[0])
                if (path[1]) setSelectedL2(path[1])
                if (path[2]) setSelectedL3(path[2])
                if (path[3]) setSelectedL4(path[3])
            }
        }
    }, [open, value, categories])

    const handleConfirm = () => {
        // Find the last selected node
        const final = selectedL4 || selectedL3 || selectedL2 || selectedL1
        if (final && !final.has_children) {
            onSelect(final.category_id)
            setOpen(false)
        }
    }

    // Helper to render a column
    const renderColumn = (items: Category[], selected: Category | null, onSelectCol: (c: Category) => void, level: string) => {
        if (items.length === 0) return null
        return (
            <div className="flex-1 min-w-[220px] border-r last:border-r-0 flex flex-col h-full bg-background">
                <div className="p-3 border-b bg-muted/30 text-xs font-semibold text-muted-foreground uppercase sticky top-0 z-10">{level}</div>
                <div className="flex-1 overflow-y-auto p-1 custom-scrollbar">
                    {items.map(item => (
                        <div
                            key={item.category_id}
                            className={cn(
                                "flex items-center justify-between px-3 py-2.5 text-sm rounded-sm cursor-pointer transition-colors",
                                "hover:bg-accent hover:text-accent-foreground",
                                selected?.category_id === item.category_id && "bg-blue-50 text-blue-700 font-medium"
                            )}
                            onClick={() => onSelectCol(item)}
                        >
                            <span className="truncate pr-2" title={item.display_category_name}>{item.display_category_name}</span>
                            {item.has_children && <ChevronRight className="h-4 w-4 opacity-50 shrink-0" />}
                            {!item.has_children && selected?.category_id === item.category_id && <Check className="h-4 w-4 shrink-0 text-blue-600" />}
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const currentSelectionName = categories.find(c => c.category_id === value)?.display_category_name || "Chọn danh mục..."
    const currentPath = value ? getPathString(value, categories) : ""

    // Can save?
    const finalSelection = selectedL4 || selectedL3 || selectedL2 || selectedL1
    const isValidLeaf = finalSelection && !finalSelection.has_children

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className={cn("justify-between text-left font-normal h-auto py-2", width)}>
                    <div className="flex flex-col items-start truncate overflow-hidden w-full">
                        <span className="font-medium truncate w-full">{currentSelectionName}</span>
                        {currentPath && <span className="text-[11px] text-muted-foreground truncate w-full">{currentPath}</span>}
                    </div>
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] w-[1200px] h-[80vh] flex flex-col gap-0 p-0 md:max-w-6xl">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle>Chọn danh mục sản phẩm</DialogTitle>
                    <DialogDescription>
                        Chọn theo phân cấp: Ngành hàng {'>'} Danh mục con.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-row bg-muted/10 h-full">
                    {renderColumn(roots, selectedL1, (c) => {
                        setSelectedL1(c); setSelectedL2(null); setSelectedL3(null); setSelectedL4(null)
                    }, "Ngành hàng chính")}

                    {renderColumn(l2List, selectedL2, (c) => {
                        setSelectedL2(c); setSelectedL3(null); setSelectedL4(null)
                    }, "Danh mục cấp 2")}

                    {renderColumn(l3List, selectedL3, (c) => {
                        setSelectedL3(c); setSelectedL4(null)
                    }, "Danh mục cấp 3")}

                    {renderColumn(l4List, selectedL4, (c) => {
                        setSelectedL4(c)
                    }, "Danh mục cấp 4")}
                </div>

                <DialogFooter className="p-4 border-t bg-background flex justify-between items-center sm:justify-between">
                    <div className="text-sm text-muted-foreground">
                        Đã chọn: <span className="font-medium text-foreground">{finalSelection ? finalSelection.display_category_name : "Chưa chọn"}</span>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setOpen(false)}>Hủy</Button>
                        <Button onClick={handleConfirm} disabled={!isValidLeaf}>Xác nhận</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function getPathString(id: number, cats: Category[]) {
    const leaf = cats.find(c => c.category_id === id)
    if (!leaf) return ""
    const names = [leaf.display_category_name]
    let curr = leaf
    while (curr.parent_category_id !== 0) {
        const parent = cats.find(c => c.category_id === curr.parent_category_id)
        if (parent) {
            names.unshift(parent.display_category_name)
            curr = parent
        } else break
    }
    return names.join(" > ")
}
