
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface BrandComboboxProps {
    brands: any[]
    value: number | null
    onChange: (value: number) => void
    loading?: boolean
}

export function BrandCombobox({ brands, value, onChange, loading }: BrandComboboxProps) {
    const [open, setOpen] = React.useState(false)

    // Ensure we handle "0" or null correctly
    const selectedBrand = brands.find((brand) => brand.brand_id === value)

    // Virtualized handling for large lists?
    // For 5-10k items, standard rendering might lag.
    // However, CommandList in shadcn usually handles hundreds well. 
    // Optimization: limit displayed items when not searching?

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal"
                >
                    {value === 0
                        ? "No Brand / Không có thương hiệu"
                        : selectedBrand
                            ? selectedBrand.display_brand_name
                            : (loading ? "Đang tải dữ liệu..." : "Chọn thương hiệu / Tác giả...")}
                    {loading ? <Loader2 className="ml-2 h-4 w-4 animate-spin opacity-50" />
                        : <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Tìm kiếm tác giả..." />
                    <CommandList>
                        <CommandEmpty>Không tìm thấy.</CommandEmpty>
                        <CommandGroup>
                            <CommandItem
                                value="no brand khong co thuong hieu"
                                onSelect={() => {
                                    onChange(0)
                                    setOpen(false)
                                }}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        value === 0 ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                No Brand / Không có thương hiệu
                            </CommandItem>

                            {/* Render limited items or all? rendering 10000 items into DOM is bad. 
                                Optimally, use `cmdk`'s virtualization or slice. 
                                Let's slice to top 50 matches if filtering logic is custom, but Shadcn Command handles filtering internally.
                                Passing 10,000 children to CommandGroup WILL act slow.
                            */}
                            {brands.slice(0, 500).map((brand) => (
                                <CommandItem
                                    key={brand.brand_id}
                                    value={brand.display_brand_name + " " + brand.original_brand_name}
                                    onSelect={() => {
                                        onChange(brand.brand_id)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === brand.brand_id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {brand.display_brand_name}
                                </CommandItem>
                            ))}
                            {brands.length > 500 && (
                                <div className="p-2 text-xs text-center text-muted-foreground">
                                    Và {brands.length - 500} kết quả khác. Hãy nhập tên để tìm kiếm chính xác hơn.
                                </div>
                            )}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
