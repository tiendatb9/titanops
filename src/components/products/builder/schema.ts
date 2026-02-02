import * as z from "zod"

// --- VARIATIONS (TIERS) ---
export const variationOptionSchema = z.object({
    name: z.string().min(1, "Bắt buộc"), // e.g. "Red"
    image: z.string().optional(), // Image for specific option (e.g. Red shirt)
})

export const variationTierSchema = z.object({
    name: z.string().min(1, "Tên nhóm phân loại (vd: Màu sắc)"),
    options: z.array(variationOptionSchema).min(1, "Cần ít nhất 1 tùy chọn"),
})

// --- VARIANT ITEM (COMBINATION) ---
export const variantSchema = z.object({
    id: z.string().optional(),
    name: z.string(), // Auto-generated: "Red - S"
    tierIndices: z.array(z.number()), // [0, 0] -> Option 0 of Tier 1, Option 0 of Tier 2

    sku: z.string().min(1, "SKU là bắt buộc"),
    barcode: z.string().optional(), // Barcode field
    price: z.coerce.number().min(0, "Giá không hợp lệ"),
    stock: z.coerce.number().min(0, "Tồn kho không hợp lệ"),
    image: z.string().optional(),
})

// --- CHANNEL OVERRIDE ---
export const channelOverrideSchema = z.object({
    shopId: z.string(),
    shopName: z.string(),
    platform: z.enum(["SHOPEE", "TIKTOK", "LAZADA", "TIKI", "OTHER"]),
    platformItemId: z.string().optional(), // Added to track External ID
    isActive: z.boolean().default(true),

    // Specific Overrides
    price: z.coerce.number().optional(),
    stock: z.coerce.number().optional(),
    // Future: Listing specific details like pre-order per channel?
})

// --- ATTRIBUTES ---
export const attributeSchema = z.object({
    name: z.string().min(1, "Tên thuộc tính"),
    value: z.string().min(1, "Giá trị"),
})

// --- MAIN PRODUCT ---
export const productBuilderSchema = z.object({
    name: z.string().min(10, "Tên sản phẩm phải có ít nhất 10 ký tự (Chuẩn sàn)"),
    sku: z.string().min(3, "SKU Master phải có ít nhất 3 ký tự"),
    description: z.string().optional(),
    descriptionHtml: z.string().optional(),
    syncDescription: z.boolean().default(true), // UI State for syncing
    images: z.array(z.string()).min(1, "Cần ít nhất 1 hình ảnh"),

    categoryId: z.string().min(1, "Vui lòng chọn danh mục ngành hàng"),
    brand: z.string().optional(),

    // Shipping & Logistics
    weight: z.coerce.number().min(10, "Trọng lượng tối thiểu 10g"), // Grams
    width: z.coerce.number().optional(),
    height: z.coerce.number().optional(),
    depth: z.coerce.number().optional(),

    daysToShip: z.coerce.number().min(2, "Tối thiểu 2 ngày (Hàng có sẵn)").default(2), // Pre-order > 2

    // Attributes (Dynamic Specs)
    attributes: z.array(attributeSchema).default([]),

    // Variants Logic
    hasVariants: z.boolean().default(false),
    variationTiers: z.array(variationTierSchema).default([]), // The Definition
    variants: z.array(variantSchema).default([]), // The Combinations

    // Single Product fields
    price: z.coerce.number().min(0).optional(),
    stock: z.coerce.number().min(0).optional(),
    barcode: z.string().optional(),

    channels: z.array(channelOverrideSchema).default([]),
})

export type ProductBuilderValues = z.infer<typeof productBuilderSchema>
