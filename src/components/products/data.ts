import { Product } from "./schema"

export const sampleProducts: Product[] = [
    {
        id: "p1",
        name: "Áo khoác gió form rộng Unisex",
        sku: "AK-GIO-001",
        image: "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lznb4k4x8v0j3d",
        price: 159000,
        stock: 50,
        status: "active",
        platforms: { shopee: true, tiktok: true },
        variants: [
            { id: "v1-1", name: "S / Đen", sku: "AK-GIO-001-S-BK", price: 159000, stock: 20 },
            { id: "v1-2", name: "M / Đen", sku: "AK-GIO-001-M-BK", price: 159000, stock: 30 }
        ]
    },
    {
        id: "p2",
        name: "Quần Jeans nam ống đứng cao cấp",
        sku: "QJ-NAM-02",
        image: "https://down-vn.img.susercontent.com/file/sg-11134201-7rd5a-lu4k4l8z8q0j1f",
        price: 299000,
        stock: 120,
        status: "active",
        platforms: { shopee: true },
        variants: [
            { id: "v2-1", name: "Default", sku: "QJ-NAM-02-DEF", price: 299000, stock: 120 }
        ]
    },
    {
        id: "p3",
        name: "Balo Laptop chống nước thời trang",
        sku: "BL-005-BL",
        image: "https://down-vn.img.susercontent.com/file/cn-11134207-7r98o-lx3k4m2n1b3v5c",
        price: 450000,
        stock: 0,
        status: "archived",
        platforms: { lazada: true },
        variants: []
    },
    {
        id: "p4",
        name: "Tai nghe Bluetooth Gaming",
        sku: "TN-GM-01",
        image: "https://down-vn.img.susercontent.com/file/sg-11134201-7rd4e-lvh7t6n8k9j2h4",
        price: 890000,
        stock: 15,
        status: "draft",
        platforms: {},
        variants: [
            { id: "v4-1", name: "Default", sku: "TN-GM-01", price: 890000, stock: 15 }
        ]
    },
    {
        id: "p5",
        name: "Giày Sneaker nam nữ thể thao",
        sku: "GS-009-WH",
        image: "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lznb4k4x8v0j3d", // placeholder
        price: 320000,
        stock: 200,
        status: "active",
        platforms: { shopee: true, tiktok: true, lazada: true },
        variants: [
            { id: "v5-1", name: "Size 40", sku: "GS-009-WH-40", price: 320000, stock: 100 },
            { id: "v5-2", name: "Size 41", sku: "GS-009-WH-41", price: 320000, stock: 100 }
        ]
    }
]
