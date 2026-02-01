"use client"

import * as React from "react"
import {
    BookOpen,
    Bot,
    Command,
    Frame,
    LifeBuoy,
    Map,
    PieChart,
    Settings2,
    SquareTerminal,
    Package,
    ShoppingBag,
    Users,
    LayoutDashboard,
    Box,
    Store
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
// import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"

// Sample Data Structure
const data = {
    // user: {
    //     name: "Admin User",
    //     email: "admin@titanops.com",
    //     avatar: "/avatars/shadcn.jpg",
    // },
    teams: [
        {
            name: "TitanOPS",
            logo: Command,
            plan: "Enterprise",
        },
    ],
    navMain: [
        {
            title: "Dashboard",
            url: "/",
            icon: LayoutDashboard,
            isActive: true,
        },
        {
            title: "Sản phẩm (Products)",
            url: "/products",
            icon: Package,
            items: [
                { title: "Tất cả sản phẩm", url: "/products" },
                { title: "Sản phẩm Online (Sàn)", url: "/products/online" },
                { title: "Thêm mới (Builder)", url: "/products/builder" },
                { title: "Đăng hàng loạt", url: "/products/bulk-post" },
            ],
        },
        {
            title: "Đơn hàng (Orders)",
            url: "/orders",
            icon: ShoppingBag,
            items: [
                { title: "Chờ xử lý", url: "/orders?status=pending" },
                { title: "Đang giao", url: "/orders?status=shipping" },
                { title: "Lịch sử đơn", url: "/orders/history" },
            ],
        },
        {
            title: "Tồn kho (Inventory)",
            url: "/inventory",
            icon: Box,
            items: [
                { title: "Quản lý tồn kho", url: "/inventory" },
                { title: "Nhập/Xuất kho", url: "/inventory/transactions" },
            ],
        },
        {
            title: "Cửa hàng (Shops)",
            url: "/shops",
            icon: Store,
        },
        {
            title: "Cấu hình (Settings)",
            url: "/settings/database",
            icon: Settings2,
            items: [
                { title: "Database", url: "/settings/database" },
            ],
        },
    ],
    navSecondary: [
        {
            title: "Hỗ trợ",
            url: "#",
            icon: LifeBuoy,
        },
        {
            title: "Phản hồi",
            url: "#",
            icon: Map,
        },
    ],
}

export function AppSidebar({ user, ...props }: React.ComponentProps<typeof Sidebar> & { user: { name: string; email: string; avatar: string } }) {
    return (
        <Sidebar variant="inset" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <a href="#">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                    <Command className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">TitanOPS</span>
                                    <span className="truncate text-xs">Multi-Channel Manager</span>
                                </div>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
                {/* <NavProjects projects={data.navSecondary} /> */}
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={user} />
            </SidebarFooter>
        </Sidebar>
    )
}
